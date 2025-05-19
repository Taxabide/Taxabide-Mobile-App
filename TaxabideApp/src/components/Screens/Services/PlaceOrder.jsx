import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { pick, isCancel, types } from '@react-native-documents/picker';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser as updateReduxUser } from '../../../redux/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { isNetworkConnected } from '../../../utils/networkUtils';
import apiService from '../../../utils/api';
import LinearGradient from 'react-native-linear-gradient';
import ProfileNavbar from '../NavBar/ProfileNavbar';

const PlaceOrder = ({ route, navigation }) => {
  const { serviceId, serviceName, servicePrice, categoryName, categoryPrice, userId: routeUserId} = route.params;
  
  // Get user from Redux store
  const dispatch = useDispatch();
  const { user, isLoading: userLoading } = useSelector((state) => state.user);
  console.log('>>>>>>>>>>>>user',user)
  
  // Local state for user details
  const [localUserData, setLocalUserData] = useState(null);
  
  // Function to fetch user data from AsyncStorage
  const fetchUserDataFromStorage = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setLocalUserData(parsedUser);
        
        // If Redux store is empty but we have data in AsyncStorage, update Redux
        if (!user && parsedUser) {
          dispatch(updateReduxUser(parsedUser));
        }
        
        return parsedUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data from AsyncStorage:', error);
      return null;
    }
  }, [user, dispatch]);
  
  // Load user data from AsyncStorage on component mount
  useEffect(() => {
    fetchUserDataFromStorage();
  }, [fetchUserDataFromStorage]);
  
  // Add console logging to debug user data
  useEffect(() => {
    // Verify data is also in AsyncStorage
    const checkStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (!storedUser) {
          console.error('No user data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error checking AsyncStorage:', error);
      }
    };
    checkStorage();
  }, [user, routeUserId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Only check after userLoading is complete
    if (!userLoading && !user && !localUserData) {
      Alert.alert(
        'Not Logged In',
        'You need to log in to place an order',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.replace('SignIn')
          }
        ]
      );
    }
  }, [user, userLoading, navigation, localUserData]);

  // Calculate GST (18% of service price)
  const gstAmount = Math.round(parseFloat(servicePrice) * 0.18 * 10) / 10;
  
  // State for service data from API
  const [serviceData, setServiceData] = useState(null);
  const [govFees, setGovFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  
  // Fetch service data
  useEffect(() => {
    const fetchServiceData = async () => {
      setApiLoading(true);
      try {
        const response = await axios.get('https://taxabide.in/api/services-list-api.php');
        
        if (Array.isArray(response.data)) {
          // Find the current service
          const service = response.data.find(s => s.s_id === serviceId);
          
          if (service) {
            setServiceData(service);
            
            // Extract government fees if categories exist
            if (service.categories && Array.isArray(service.categories)) {
              const govFeesFound = service.categories.filter(c => 
                c.s_c_name && (
                  c.s_c_name.toLowerCase().includes('government') || 
                  c.s_c_name.toLowerCase().includes('govt') ||
                  c.s_c_name.toLowerCase().includes('gst')
                )
              );
              
              if (govFeesFound.length > 0) {
                setGovFees(govFeesFound);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setApiLoading(false);
      }
    };
    
    fetchServiceData();
  }, [serviceId]);
  
  // Recalculate total price including government fees
  const calculateTotal = useCallback(() => {
    let total = parseFloat(servicePrice) + parseFloat(categoryPrice || 0) + gstAmount;
    
    // Add all government fees
    govFees.forEach(fee => {
      if (fee.s_c_price) {
        total += parseFloat(fee.s_c_price);
      }
    });
    
    return total;
  }, [servicePrice, categoryPrice, gstAmount, govFees]);
  
  const totalPrice = calculateTotal();
  
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(12500);
  const [queryText, setQueryText] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState('');
  console.log(">>>>>>>>selectclient data",selectedClient)

  // Get first initials for avatar
  const getInitials = useCallback(() => {
    if (!user || !user.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, [user]);

  // Function to get the current active user data
  const getCurrentUser = useCallback(() => {
    return user || localUserData;
  }, [user, localUserData]);

  // Load userId from AsyncStorage when component mounts
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getUserIdFromStorage();
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };
    loadUserId();
  }, []);

  // Function to get user ID directly from AsyncStorage
  const getUserIdFromStorage = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        // First priority: Get the l_id (login table ID)
        if (userData && userData.l_id) {
          return userData.l_id;
        }
        
        // Second priority: Try other possible ID fields
        if (userData && userData.id) {
          return userData.id;
        }
        
        if (userData && userData.user_id) {
          return userData.user_id;
        }
        
        // Last resort: use signin_id or email
        if (userData && userData.signin_id) {
          return userData.signin_id;
        }
        
        if (userData && userData.email) {
          return userData.email;
        }
      }
      console.error('User ID not found in AsyncStorage');
      return null;
    } catch (error) {
      console.error('Error getting user ID from AsyncStorage:', error);
      return null;
    }
  };

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      setClientsLoading(true);
      setClientsError(null);
      
      try {
        // Get current user ID to filter clients
        const currentUser = getCurrentUser();
        let userId = currentUser?.l_id || currentUser?.id || '';
        
        if (!userId) {
          setClientsError('User ID not available. Please log in again.');
          setClientsLoading(false);
          return;
        }
        
        // Ensure userId is a string for comparison
        userId = userId.toString();
        console.log('Fetching clients for login user ID:', userId);
        
        // Try first with user_id parameter (if API supports filtering)
        let apiUrl = `https://taxabide.in/api/clients-list-api.php?user_id=${encodeURIComponent(userId)}`;
        console.log('First trying API with user_id parameter:', apiUrl);
        let response = await axios.get(apiUrl).catch(err => {
          console.log('Error with user_id parameter, will try without it:', err.message);
          return null;
        });
        // If first attempt failed or returned empty data, try without user_id parameter
        if (!response || !response.data || !response.data.data || response.data.data.length === 0) {
          apiUrl = `https://taxabide.in/api/clients-list-api.php`;
          console.log('Now trying API without user_id parameter:', apiUrl);
          response = await axios.get(apiUrl);
        }
        // Debug logs for API response
        console.log('API response:', response?.data);
        // Process the response data
        let responseOk = false;
        let allClients = [];
        // Handle different API response formats
        if (response.data && Array.isArray(response.data)) {
          allClients = response.data;
          responseOk = true;
        } else if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
          allClients = response.data.data;
          responseOk = true;
        } else if (response.data && Array.isArray(response.data.clients)) {
          allClients = response.data.clients;
          responseOk = true;
        } else if (response.data && Array.isArray(response.data.results)) {
          allClients = response.data.results;
          responseOk = true;
        }
        console.log('All clients from API:', allClients);
        if (responseOk && allClients.length > 0) {
          // IMPROVED FILTERING: Try different ways to match client to user ID
          const userClients = allClients.filter(client => {
            if (!client.c_user_id) return false;
            const clientUserId = client.c_user_id.toString().trim();
            const currentUserId = userId.trim();
            return (
              clientUserId === currentUserId || 
              parseInt(clientUserId) === parseInt(currentUserId)
            );
          });
          console.log('Filtered userClients:', userClients);
          
          if (userClients.length > 0) {
            // Only show clients that match the user ID
            setClients(userClients);
            setClientsError(null); // Clear any previous errors
          } else {
            // No clients with matching user ID
            // As a fallback, use all clients but show a warning
            setClients(allClients);
            setClientsError(`No clients found for your user ID: ${userId}. Showing all available clients.`);
          }
        } else {
          // Handle the case where API response is not in expected format
          setClientsError('No clients found or invalid API response format');
          console.error('Invalid API response:', response?.data);
        }
      } catch (error) {
        setClientsError(`Error fetching clients: ${error.message || 'Unknown error'}`);
        console.error('Clients API error:', error);
      } finally {
        setClientsLoading(false);
      }
    };
    
    fetchClients();
  }, [getCurrentUser]);

  const pickDocument = async () => {
    try {
      const results = await pick({
        type: [types.allFiles],
        allowMultiSelection: true, // Enable multiple selection
      });
      setSelectedDocuments(results); // Store all selected documents
    } catch (err) {
      if (!isCancel(err)) {
        Alert.alert('Error', 'Failed to pick documents');
      }
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrderInfo, setSuccessOrderInfo] = useState({});

  const handlePlaceOrder = async () => {
    if (!getCurrentUser()) {
      Alert.alert('Error', 'You must be logged in to place an order');
      return;
    }
    
    if (!selectedClient) {
      Alert.alert('Missing Information', 'Please select a client before placing the order');
      return;
    }

    // Check network connectivity
    const isConnected = await isNetworkConnected();
    
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Get the selected client details
      const selectedClientData = clients.find(client => client.c_id === selectedClient);
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Get userId directly from current user
      const currentUser = getCurrentUser();
      const userId = currentUser?.l_id || currentUser?.id || null;
      
      // Check if userId is valid
      if (!userId) {
        console.error('User ID is missing or invalid');
        Alert.alert('Error', 'User ID is missing. Please log in again.');
        setLoading(false);
        setIsUploading(false);
        return;
      }
      
      // Add all required fields to FormData
      formData.append('p_o_user_id', userId);
      formData.append('p_o_service_id', serviceId);
      formData.append('p_o_total_price', totalPrice.toFixed(1));
      formData.append('p_o_query', queryText);
      formData.append('p_o_client_id', selectedClient);
      formData.append('p_o_wallet_price', walletBalance);
      formData.append('btn', ''); // Adding btn field even when empty
      
      // Add files if selected
      if (selectedDocuments.length > 0) {
        selectedDocuments.forEach((doc, index) => {
          formData.append('files[]', {
            uri: doc.uri,
            type: doc.type,
            name: doc.name
          });
        });
      } else {
        // Add an empty files array to ensure the API knows we're sending this field
        formData.append('files[]', '');
      }
      
      // Make API call using our robust API service
      const result = await apiService.postFormData(
        'place-order-api.php',
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      );
      
      setIsUploading(false);
      
      // Log the API response for debugging
      console.log('Order API response:', result);
      
      if (!result.success) {
        setLoading(false);
        Alert.alert(
          'Error',
          result.error || 'Failed to place the order. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const responseData = result.data;
      const status = responseData && responseData.status;
      const message = responseData && responseData.message;
      if (
        (typeof status === 'string' && status.toLowerCase().includes('success')) ||
        (typeof message === 'string' && message.toLowerCase().includes('success')) ||
        (typeof message === 'string' && message.toLowerCase().includes('order placed successfully'))
      ) {
        setLoading(false);
        setShowSuccess(true);
        setSuccessOrderInfo({ serviceName, totalPrice: totalPrice.toFixed(1) });
        return;
      } else {
        setLoading(false);
        Alert.alert(
          'Error',
          message || status || 'Failed to place the order. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setLoading(false);
      setIsUploading(false);
      console.error('Order submission error:', error);
      
      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        Alert.alert(
          'Connection Timeout',
          'The server is taking too long to respond. Please try again later.',
          [{ text: 'OK' }]
        );
      } else if (error.response) {
        // The server responded with a status code outside the 2xx range
        Alert.alert(
          'Server Error',
          `Server returned error: ${error.response.status}. Please try again later.`,
          [{ text: 'OK' }]
        );
      } else if (error.request) {
        // The request was made but no response was received
        Alert.alert(
          'No Response',
          'No response received from the server. Please check your internet connection.',
          [{ text: 'OK' }]
        );
      } else {
        // Something else happened in setting up the request
        Alert.alert(
          'Error',
          'There was an error placing your order. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // If loading user data, show loading indicator
  if (userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f1787" />
        <Text>Loading user data...</Text>
      </View>
    );
  }

  // If no user data after loading, show auth required
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Authentication required</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.replace('SignIn')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <Text style={styles.successIcon}>✔️</Text>
          </View>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>Thank you for ordering </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => {
              navigation.navigate('ServiceList');
            }}
          >
            <Text style={styles.successButtonText}>Go to Service List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ProfileNavbar 
        navigation={navigation}
        currentUser={getCurrentUser()}
        updateUser={dispatch}
        title="Place Order"
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Services Price List</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>My Details</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{getCurrentUser()?.name || 'Not available'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{getCurrentUser()?.email || 'Not available'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Mobile:</Text>
              <Text style={styles.detailValue}>{getCurrentUser()?.mobile || 'Not available'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>PAN :</Text>
              <Text style={styles.detailValue}>{getCurrentUser()?.pan || 'Not available'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>User ID:</Text>
              <Text style={styles.detailValue}>
                {getCurrentUser()?.l_id ? (
                  <Text style={styles.idHighlight}>{getCurrentUser().l_id}</Text>
                ) : getCurrentUser()?.id ? (
                  <Text style={styles.idHighlight}>{getCurrentUser().id}</Text>
                ) : (
                  <Text style={styles.idWarning}>Not available (please log in again)</Text>
                )}
              </Text>
            </View>
          </View>
          
          <View style={styles.clientSelectCard}>
            <Text style={styles.clientSelectTitle}>Choose Client</Text>
            <View style={styles.clientSelectDropdown}>
              {clientsLoading ? (
                <View style={styles.clientsLoading}>
                  <ActivityIndicator size="small" color="#1f1787" />
                  <Text style={styles.clientsLoadingText}>Loading clients...</Text>
                </View>
              ) : clientsError ? (
                <View style={styles.clientsError}>
                  <Icon name="alert-circle-outline" size={20} color="#f44336" style={styles.errorIcon} />
                  <Text style={styles.clientsErrorText}>{clientsError}</Text>
                </View>
              ) : clients.length === 0 ? (
                <View style={styles.clientsError}>
                  <Icon name="account-off-outline" size={20} color="#f44336" style={styles.errorIcon} />
                  <Text style={styles.clientsErrorText}>No clients found</Text>
                </View>
              ) : (
                <Picker
                  selectedValue={selectedClient}
                  onValueChange={(itemValue) => setSelectedClient(itemValue)}
                  style={styles.clientPicker}
                  mode="dropdown"
                  dropdownIconColor="#333"
                  itemStyle={{ backgroundColor: '#fff' }}
                  backgroundColorDisabled="#fff"
                  backgroundColor="#fff"
                >
                  <Picker.Item label="Select Client" value="" color="#000" />
                  {clients.map((client) => {
                    const isUserClient = client.c_user_id === (getCurrentUser()?.l_id || getCurrentUser()?.id)?.toString();
                    // Show as 'Name (Email)' if email exists, else just 'Name'
                    const label = client.c_email
                      ? `${client.c_name} (${client.c_email})`
                      : client.c_name;
                    return (
                      <Picker.Item 
                        key={client.c_id} 
                        label={label}
                        value={client.c_id} 
                        color="#000" 
                        style={{backgroundColor: '#fff'}}
                      />
                    );
                  })}
                </Picker>
              )}
            </View>
          </View>
          
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>₹ {walletBalance}</Text>
          </View>
          
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceHeaderText}>Service</Text>
              <Text style={styles.serviceHeaderText}>Price</Text>
            </View>
            
            <View style={styles.serviceItemRow}>
              <Text style={styles.serviceName}>{serviceName}</Text>
              <Text style={styles.servicePrice}>₹ {servicePrice}</Text>
            </View>
            
            <View style={styles.serviceItemRow}>
              <Text style={styles.serviceName}>GST</Text>
              <Text style={styles.servicePrice}>₹ {gstAmount}</Text>
            </View>
            
            {categoryName && (
              <View style={styles.serviceItemRow}>
                <Text style={styles.serviceName}>{categoryName}</Text>
                <Text style={styles.servicePrice}>₹ {categoryPrice}</Text>
              </View>
            )}
            
            {/* Display all government fees from API */}
            {govFees.map((fee, index) => (
              <View key={`gov-fee-${index}`} style={styles.serviceItemRow}>
                <Text style={styles.serviceName}>{fee.s_c_name}</Text>
                <Text style={styles.servicePrice}>₹ {fee.s_c_price}</Text>
              </View>
            ))}
            
            {apiLoading && (
              <View style={styles.loadingFeeContainer}>
                <ActivityIndicator size="small" color="#1f1787" />
                <Text style={styles.loadingFeeText}>Loading fees...</Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.totalPriceRow}>
              <Text style={styles.totalPriceLabel}>Total Price</Text>
              <Text style={styles.totalPriceValue}>₹{totalPrice.toFixed(1)}</Text>
            </View>
            
            
            <View style={styles.documentSection}>
              <Text style={styles.documentTitle}>
                Upload Documents - {"\n"}AAdhar / Pan / Rent Agreement / Electricity Bill / Other Documents
              </Text>
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Text style={styles.uploadButtonText}>
                  {selectedDocuments.length > 0 
                    ? `${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''} selected` 
                    : "Choose Files"}
                </Text>
              </TouchableOpacity>
              
              {selectedDocuments.length > 0 && (
                <View style={styles.selectedDocsContainer}>
                  {selectedDocuments.map((doc, index) => (
                    <View key={index} style={styles.selectedDocItem}>
                      <Text style={styles.selectedDocName} numberOfLines={1} ellipsizeMode="middle">
                        {doc.name}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeDocButton}
                        onPress={() => {
                          const updatedDocs = [...selectedDocuments];
                          updatedDocs.splice(index, 1);
                          setSelectedDocuments(updatedDocs);
                        }}
                      >
                        <Text style={styles.removeDocButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.querySection}>
              <Text style={styles.queryLabel}>Type Query</Text>
              <TextInput
                style={styles.queryInput}
                placeholder="If Payment is done write here"
                value={queryText}
                onChangeText={setQueryText}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Add order confirmation with User ID */}
            <View style={styles.orderConfirmationCard}>
              <Text style={styles.orderConfirmationTitle}>Order Information</Text>
              <View style={styles.orderConfirmationRow}>
                {getCurrentUser()?.l_id ? (
                  <Text style={styles.orderConfirmationValue}>{getCurrentUser().l_id}</Text>
                ) : getCurrentUser()?.id ? (
                  <Text style={styles.orderConfirmationValue}>{getCurrentUser().id}</Text>
                ) : (
                  <Text style={styles.orderConfirmationError}>Missing (Login Required)</Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  {isUploading && (
                    <Text style={styles.uploadingText}>
                      Uploading... {uploadProgress}%
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.placeOrderButtonText}>Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#1f1787',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  profileButton: {
    padding: 5,
  },
  profileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userDetailsHeaderGradient: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  userDetailsHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userHeaderInfo: {
    flex: 1,
  },
  userDetailsName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetailsEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
  userDetailsBody: {
    padding: 16,
  },
  userDetailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetailIcon: {
    marginRight: 8,
  },
  userDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    width: 60,
  },
  userDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#1f1787',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIcon: {
    marginRight: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  titleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  contentContainer: {
    padding: 16,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  clientSelectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientSelectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  clientSelectDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  clientPicker: {
    height: 50,
    width: '100%',
    color: '#000',
    backgroundColor: '#fff',
  },
  clientsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  clientsLoadingText: {
    marginLeft: 10,
    color: '#666',
  },
  clientsError: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clientsErrorText: {
    color: '#f44336',
    marginBottom: 12,
    textAlign: 'center',
    marginLeft: 5,
  },
  errorIcon: {
    marginRight: 5,
  },
  alertBanner: {
    backgroundColor: '#f44336',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 8,
  },
  alertText: {
    color: '#ffffff',
    flex: 1,
    fontSize: 13,
  },
  clientsDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  selectedClientInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedClientTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  selectedClientDetails: {
    marginTop: 4,
  },
  clientInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  clientInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    width: 60,
  },
  clientInfoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  walletCard: {
    backgroundColor: '#1f1787',
    borderRadius: 4,
    padding: 16,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  serviceHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  serviceName: {
    fontSize: 15,
    color: '#333',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  loadingFeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  loadingFeeText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f1787',
  },
  documentSection: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  uploadButtonText: {
    color: '#555',
    fontSize: 14,
  },
  querySection: {
    marginBottom: 16,
  },
  queryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  queryInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  placeOrderButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
  },
  selectedDocsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  selectedDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedDocName: {
    flex: 1,
    color: '#333',
  },
  removeDocButton: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  removeDocButtonText: {
    color: '#f44336',
    fontSize: 14,
  },
  idHighlight: {
    fontWeight: 'bold',
  },
  idNote: {
    fontSize: 12,
    color: '#666',
  },
  idWarning: {
    color: '#f44336',
  },
  orderConfirmationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderConfirmationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderConfirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderConfirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  orderConfirmationValue: {
    fontSize: 14,
    color: '#333',
  },
  orderConfirmationError: {
    fontSize: 14,
    color: '#f44336',
  },
  ownerMatch: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  ownerMismatch: {
    fontWeight: 'bold',
    color: '#f44336',
  },
  clientIdHighlight: {
    fontWeight: 'bold',
    color: '#1f1787',
  },
  ownershipBadge: {
    backgroundColor: '#4caf50',
    padding: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  ownershipBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notOwnershipBadge: {
    backgroundColor: '#f44336',
    padding: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  notOwnershipBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clientIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#1f1787',
  },
  clientIdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: 70,
  },
  clientIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f1787',
    flex: 1,
  },
  yourClientBadge: {
    backgroundColor: '#4caf50',
    padding: 4,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  yourClientBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  successIconWrapper: {
    backgroundColor: '#e0f7e9',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#22c55e',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f1787',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  successPrice: {
    fontSize: 20,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PlaceOrder; 