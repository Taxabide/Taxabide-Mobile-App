import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Checkbox, Provider as PaperProvider} from 'react-native-paper';
import ProfileNavbar from '../../NavBar/ProfileNavbar';
import ClientFooter from '../../Footer/ClientFooter';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function AppDevelopment() {
  const navigation = useNavigation();

  // Input field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState('');
  const [question, setQuestion] = useState('');
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client selection states
  const [clientsList, setClientsList] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Debug helper function
  const logDebugInfo = (action, data = {}) => {
    console.log(
      `[DEBUG] ${action}:`,
      JSON.stringify({
        userId,
        clientsCount: clientsList?.length || 0,
        dropdownVisible,
        isLoadingClients,
        hasError: !!clientError,
        selectedClientId,
        ...data,
      }),
    );
  };

  // Checkbox group state (additional services)
  const [more, setMore] = useState({
    Domain: false,
    Hosting: false,
    SSL: false,
    ServerLimitedGB: false,
  });

  // Fetch clients list and user ID on component mount
  useEffect(() => {
    getUserId().then(id => {
      if (id) {
        fetchClients(id);
      }
    });
  }, []);

  // Get current user ID from storage
  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.id) {
          setUserId(parsed.id);
          return parsed.id;
        }
      }

      // Check other possible storage location if needed
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed && (parsed.id || parsed.user_id || parsed.t_d_user_id)) {
            const id = parsed.id || parsed.user_id || parsed.t_d_user_id;
            setUserId(id);
            return id;
          }
        } catch (e) {}
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Function to fetch clients from the API
  const fetchClients = async currentUserId => {
    try {
      setIsLoadingClients(true);
      setClientError(null);

      logDebugInfo('fetchClients_start', {currentUserId});

      // Use the provided user ID or get it from state
      const userIdToUse = currentUserId || userId;

      if (!userIdToUse) {
        setClientError('Please log in to view your clients');
        setClientsList([]);
        setIsLoadingClients(false);
        return;
      }

      // Try primary API endpoint
      try {
        const response = await fetch(
          `https://taxabide.in/api/clients-list-api.php?user_id=${userIdToUse}`,
        );
       console.log(">>>>>>>>>>>>>response",response)
        const responseText = await response.text();
        logDebugInfo('primaryAPI_response', {
          text: responseText.substring(0, 100),
        });
        let data;

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Error parsing response:', responseText);
          // If parsing fails, try alternate endpoint
          throw new Error('Invalid response format');
        }

        // Check if we got valid data
        if (
          response.ok &&
          data &&
          data.status === 'success' &&
          Array.isArray(data.data)
        ) {
          logDebugInfo('primaryAPI_success', {clientsCount: data.data.length});
          setClientsList(data.data);
          setIsLoadingClients(false);
          return;
        }

        // If we reach here, the primary API failed but didn't throw an error
        // Try alternate endpoint
        throw new Error('Primary API returned invalid data');
      } catch (primaryApiError) {
        console.log('Primary API error:', primaryApiError.message);

        // Try alternate endpoint
        try {
          const alternateResponse = await fetch(
            `https://taxabide.in/api/getClients.php?user_id=${userIdToUse}`,
          );

          if (!alternateResponse.ok) {
            throw new Error(`Server error: ${alternateResponse.status}`);
          }

          const alternateData = await alternateResponse.json();
          logDebugInfo('alternateAPI_response', {success: !!alternateData});

          if (alternateData && Array.isArray(alternateData.clients)) {
            // Transform data to match expected format
            const transformedClients = alternateData.clients.map(client => ({
              c_id: client.id || client.client_id || client._id || '0',
              c_name:
                client.name ||
                client.client_name ||
                client.c_name ||
                'Unknown Client',
              c_email:
                client.email || client.client_email || client.c_email || null,
            }));

            logDebugInfo('alternateAPI_success', {
              clientsCount: transformedClients.length,
            });
            setClientsList(transformedClients);
            setIsLoadingClients(false);
            return;
          } else {
            throw new Error('Invalid data format from alternate API');
          }
        } catch (alternateApiError) {
          console.log('Alternate API error:', alternateApiError.message);
          setClientError('Unable to load clients. Please try again later.');
        }
      }
    } catch (error) {
      console.log('Fetch clients error:', error.message);
      setClientError(
        'Error fetching clients. Please check your connection and try again.',
      );
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Force refresh clients list
  const refreshClients = () => {
    logDebugInfo('refreshClients_called');
    fetchClients(userId);
  };

  // Filter clients based on search query
  const getFilteredClients = () => {
    if (!clientSearchQuery.trim()) {
      return clientsList;
    }

    const query = clientSearchQuery.toLowerCase().trim();
    return clientsList.filter(
      client =>
        (client.c_name && client.c_name.toLowerCase().includes(query)) ||
        (client.c_email && client.c_email.toLowerCase().includes(query)),
    );
  };

  // Handle client selection
  const handleClientSelect = clientId => {
    logDebugInfo('handleClientSelect_called', {clientId});

    if (clientId === '') {
      setSelectedClient('');
      setSelectedClientId(null);
      return;
    }

    try {
      const client = clientsList.find(c => c.c_id === clientId);
      if (client) {
        logDebugInfo('client_selected', {clientName: client.c_name});
        setSelectedClient(client.c_name);
        setSelectedClientId(client.c_id);

        // Display a toast or some feedback that the client was selected
        Alert.alert(
          'Client Selected',
          `You selected ${client.c_name}`,
          [{text: 'OK'}],
          {cancelable: true},
        );
      } else {
        console.warn(`Client with ID ${clientId} not found in list`);
      }
    } catch (error) {
      console.error('Error selecting client:', error);
    }
  };

  // Phone input validation: Allow only numeric
  const handlePhoneChange = value => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
  };

  // Toggle checkboxes
  const toggleMore = key => {
    setMore(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Simple validation for required fields
    if (!name || !email || !phone || !services) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Try to get user ID one more time before submitting
    if (!userId) {
      await getUserId();
    }

    // Check if user is logged in
    if (!userId) {
      Alert.alert('Login Required', 'Please log in to submit this form', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Login',
          onPress: () =>
            navigation.navigate('SignIn', {returnTo: 'AppDevelopment'}),
        },
      ]);
      return;
    }

    try {
      setIsSubmitting(true);

      // Get selected additional services
      const selectedServiceNames = Object.keys(more)
        .filter(key => more[key])
        .join(', ');

      // Create form data object with correct field names
      const formParams = new URLSearchParams();
      formParams.append('t_d_name', name);
      formParams.append('t_d_email', email);
      formParams.append('t_d_phone', phone);
      formParams.append('t_d_service', services);
      formParams.append('t_d_more_service[]', selectedServiceNames);
      formParams.append('t_d_msg', question || '');

      // Ensure user ID is properly added in the format the backend expects
      formParams.append('t_d_user_id', userId);
      formParams.append('user_id', userId);

      // Include client ID if a client was selected
      if (selectedClientId) {
        formParams.append('t_d_client_id', selectedClientId);
        formParams.append('client_name', selectedClient || '');
      }

      // Set up request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // Using the correct endpoint for app development
        const apiUrl = `https://taxabide.in/api/tdws-app-development-api.php?uid=${userId}&user_id=${userId}&t_d_user_id=${userId}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: formParams.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Get response text
        const responseText = await response.text();

        // Success case
        if (response.ok) {
          // Try to parse response for more details
          let successMessage =
            'Your app development request has been submitted successfully!';
          try {
            const responseData = JSON.parse(responseText);
            if (responseData && responseData.message) {
              successMessage = responseData.message;
            }
          } catch (e) {
            // Use default message if can't parse
          }

          // Show simple success message with just an OK button
          Alert.alert('Success', successMessage, [
            {text: 'OK', onPress: resetForm},
          ]);
        } else {
          // Parse error message if possible
          let errorMessage = 'Server error occurred. Please try again later.';
          try {
            const errorData = JSON.parse(responseText);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {}

          Alert.alert('Error', errorMessage);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Network errors
        let errorMessage =
          'Network error. Please check your connection and try again.';
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again later.';
        }

        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      // Catch any unexpected errors
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to reset form fields
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setServices('');
    setQuestion('');
    setSelectedClient('');
    setSelectedClientId(null);
    setMore({
      Domain: false,
      Hosting: false,
      SSL: false,
      ServerLimitedGB: false,
    });
  };

  // Client dropdown component
  const ClientDropdown = () => {
    const filteredClients = getFilteredClients();

    // Show login prompt if no user ID is available
    if (!userId) {
      return (
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={closeClientDropdown}>
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={closeClientDropdown}>
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Choose Existing Client</Text>
              </View>

              <View style={styles.loginPromptContainer}>
                <Text style={styles.loginPromptText}>
                  Please log in to view and select your clients
                </Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => {
                    closeClientDropdown();
                    setTimeout(() => {
                      navigation.navigate('SignIn', {
                        returnTo: 'AppDevelopment',
                      });
                    }, 300);
                  }}>
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeClientDropdown}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }

    return (
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={closeClientDropdown}>
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={closeClientDropdown}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Choose Existing Client</Text>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search clients..."
                  value={clientSearchQuery}
                  onChangeText={setClientSearchQuery}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Client List Content */}
              {isLoadingClients ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color="#0D6EFD"
                    style={styles.dropdownLoading}
                  />
                  <Text style={styles.loadingText}>Loading clients...</Text>
                </View>
              ) : clientError && clientsList.length === 0 ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{clientError}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setIsLoadingClients(true);
                      refreshClients();
                    }}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : clientsList.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No clients available</Text>
                  <Text style={styles.noResultsSubText}>
                    Add a client to get started
                  </Text>
                  <TouchableOpacity
                    style={styles.addNewButton}
                    onPress={() => {
                      closeClientDropdown();
                      setTimeout(() => {
                        navigation.navigate('AddClient');
                      }, 300);
                    }}>
                    <Text style={styles.addNewButtonText}>Add New Client</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredClients.length > 0 ? (
                <ScrollView
                  style={styles.dropdownScrollView}
                  nestedScrollEnabled={true}>
                  {filteredClients.map(client => (
                    <TouchableOpacity
                      key={client.c_id}
                      style={styles.dropdownItem}
                      activeOpacity={0.5}
                      onPress={() => {
                        handleClientSelect(client.c_id);
                        closeClientDropdown();
                        setClientSearchQuery('');
                      }}>
                      <Text style={styles.dropdownItemText}>
                        {client.c_name}{' '}
                        {client.c_email ? `(${client.c_email})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    No matching clients found
                  </Text>
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setClientSearchQuery('')}>
                    <Text style={styles.clearSearchButtonText}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeClientDropdown}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Function to safely open the client dropdown
  const openClientDropdown = () => {
    logDebugInfo('openClientDropdown_called');

    try {
      // Force a delay to ensure UI renders properly
      setTimeout(() => {
        if (userId) {
          setIsLoadingClients(true);
          refreshClients(); // Refresh clients when opening dropdown
        }
        setDropdownVisible(true);
        logDebugInfo('dropdown_opened');
      }, 300);
    } catch (error) {
      console.error('Error opening dropdown:', error);
      Alert.alert(
        'Error',
        'There was an error opening the client list. Please try again.',
        [{text: 'OK'}],
      );
    }
  };

  // Function to safely close the client dropdown
  const closeClientDropdown = () => {
    logDebugInfo('closeClientDropdown_called');

    try {
      // Add a small delay to prevent UI issues
      setTimeout(() => {
        setDropdownVisible(false);
        logDebugInfo('dropdown_closed');
      }, 100);
    } catch (error) {
      console.error('Error closing dropdown:', error);

      // Force close if there's an error
      setDropdownVisible(false);
    }
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <ProfileNavbar navigation={navigation} />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Title */}
            <Text style={styles.heading}>
              Tulyarth DigiWeb Services - App Development
            </Text>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            {/* Email */}
            <Text style={styles.label}>Your Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {/* Services Dropdown */}
            <Text style={styles.label}>Select Service</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={services}
                onValueChange={itemValue => setServices(itemValue)}>
                <Picker.Item label="--Select Services--" value="" />
                <Picker.Item label="IOS Development" value="IOS Development" />
                <Picker.Item
                  label="Android Development"
                  value="Android Development"
                />
                <Picker.Item
                  label="E-Commerce App Development"
                  value="E-Commerce App Development"
                />
                <Picker.Item
                  label="Web App Development"
                  value="Web App Development"
                />
              </Picker>
            </View>

            {/* Additional Services Checkboxes */}
            <Text style={styles.label}>Choose More Services</Text>
            {['Domain', 'Hosting', 'SSL', 'ServerLimitedGB'].map(item => (
              <Checkbox.Item
                key={item}
                label={item === 'ServerLimitedGB' ? 'Server Limited GB*' : item}
                status={more[item] ? 'checked' : 'unchecked'}
                onPress={() => toggleMore(item)}
                color="#0D6EFD"
                labelStyle={{fontSize: 16}}
              />
            ))}

            {/* Question Box */}
            <Text style={styles.label}>Any Questions?</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Write Your Question here..."
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Client Selection with Dropdown */}
            <Text style={styles.label}>Choose Existing Client</Text>
            <View style={styles.clientSelectionRow}>
              <TouchableOpacity
                style={styles.clientDropdownButton}
                activeOpacity={0.6}
                onPress={openClientDropdown}>
                <View style={styles.clientDropdownButtonInner}>
                  <Text
                    style={[
                      styles.clientDropdownText,
                      !selectedClient && styles.clientDropdownPlaceholder,
                    ]}>
                    {selectedClient ||
                      (userId
                        ? 'Choose Existing Client'
                        : 'Login to Select Client')}
                  </Text>
                  <Icon name="chevron-down" size={18} color="#999" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addClientButton}
                activeOpacity={0.7}
                onPress={() => {
                  if (userId) {
                    navigation.navigate('AddClient');
                  } else {
                    Alert.alert(
                      'Login Required',
                      'You need to login first to add a client',
                      [
                        {text: 'Cancel', style: 'cancel'},
                        {
                          text: 'Login',
                          onPress: () =>
                            navigation.navigate('SignIn', {
                              returnTo: 'AppDevelopment',
                            }),
                        },
                      ],
                    );
                  }
                }}>
                <Text style={styles.addClientButtonText}>Add client</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>

            {/* View App Development Data Button */}
            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={() => navigation.navigate('AppDevelopmentTable')}>
              <Text style={styles.viewDataButtonText}>
                View All App Development Data
              </Text>
            </TouchableOpacity>
            <ClientFooter />
          </View>
        </ScrollView>
        {/* Client Dropdown Modal */}
        <ClientDropdown />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#E76B36',
    marginTop: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 9,
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 12,
    height: 120,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  clientSelectionRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  clientDropdownButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    minHeight: 48,
  },
  clientDropdownButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientDropdownText: {
    color: '#333',
    fontSize: 14,
  },
  clientDropdownPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  addClientButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addClientButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#0D6EFD',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  disabledButton: {backgroundColor: '#90b8f8'},
  submitButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  viewDataButton: {
    marginBottom: 20,
    backgroundColor: '#28a745',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  viewDataButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    maxHeight: 500,
    minHeight: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownHeader: {
    backgroundColor: '#0D6EFD',
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  dropdownTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 15,
  },
  dropdownScrollView: {
    maxHeight: 300,
    paddingHorizontal: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    padding: 25,
    alignItems: 'center',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearSearchButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  addNewButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
  },
  addNewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  noResultsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  noResultsSubText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#d3d3d3',
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    margin: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  loginPromptContainer: {
    padding: 25,
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#333',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
