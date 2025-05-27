import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import ProfileNavbar from '../../NavBar/ProfileNavbar';
import ClientFooter from '../../Footer/ClientFooter';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WebDevelopment = () => {
  const navigation = useNavigation();

  // Input field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // User ID state
  const [userId, setUserId] = useState(null);

  // Client selection states
  const [clientsList, setClientsList] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientError, setClientError] = useState(null);

  // Service options
  const [selectedServices, setSelectedServices] = useState({
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
      console.error('Error retrieving user ID:', error);
      return null;
    }
  };

  // Function to fetch clients from the API
  const fetchClients = async currentUserId => {
    try {
      setIsLoadingClients(true);
      setClientError(null);

      // Use the provided user ID or get it from state
      const userIdToUse = currentUserId || userId;

      if (!userIdToUse) {
        console.log('No user ID available to fetch clients');
        setClientError('Please log in to view your clients');
        setClientsList([]);
        setIsLoadingClients(false);
        return;
      }

      const response = await fetch(
        `https://taxabide.in/api/clients-list-api.php?user_id=${userIdToUse}`,
      );

      if (!response.ok) {
        // Try alternate endpoint if first one fails
        try {
          const alternateResponse = await fetch(
            `https://taxabide.in/api/getClients.php?user_id=${userIdToUse}`,
          );
          if (alternateResponse.ok) {
            const alternateData = await alternateResponse.json();
            if (alternateData && Array.isArray(alternateData.clients)) {
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
              setClientsList(transformedClients);
              setIsLoadingClients(false);
              return;
            }
          }
        } catch (alternateError) {
          console.error('Alternate API error:', alternateError);
        }

        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.data)) {
        setClientsList(data.data);
      } else {
        setClientError('Invalid response format');
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load clients. Please try again later.');
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Force refresh clients list
  const refreshClients = () => {
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
        client.c_name.toLowerCase().includes(query) ||
        client.c_email.toLowerCase().includes(query),
    );
  };

  // Phone input validation: Allow only numeric
  const handlePhoneChange = value => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
  };

  // Toggle service selection
  const toggleService = service => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  // Handle client selection
  const handleClientSelect = clientId => {
    if (clientId === '') {
      setSelectedClient('');
      setSelectedClientId(null);
      return;
    }

    const client = clientsList.find(c => c.c_id === clientId);
    if (client) {
      setSelectedClient(client.c_name);
      setSelectedClientId(client.c_id);
    }
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
            navigation.navigate('SignIn', {returnTo: 'WebDevelopment'}),
        },
      ]);
      return;
    }

    // Get selected additional services
    const selectedServiceNames = Object.keys(selectedServices)
      .filter(key => selectedServices[key])
      .join(', ');

    try {
      setIsSubmitting(true);
      setSubmitSuccess(false);

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
        // Include user ID both in URL and as a separate parameter in query string
        const apiUrl = `https://taxabide.in/api/tdws-web-development-api.php?uid=${userId}&user_id=${userId}&t_d_user_id=${userId}`;

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
          setSubmitSuccess(true);

          // Try to parse response for more details
          let successMessage = 'Your form has been submitted successfully!';
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
    setSelectedServices({
      Domain: false,
      Hosting: false,
      SSL: false,
      ServerLimitedGB: false,
    });
    setSubmitSuccess(false);
  };

  const ServiceCheckbox = ({service, label}) => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => toggleService(service)}>
      <View
        style={[
          styles.checkbox,
          selectedServices[service] ? styles.checkboxChecked : {},
        ]}
      />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

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
          onRequestClose={() => setDropdownVisible(false)}>
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}>
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
                    setDropdownVisible(false);
                    navigation.navigate('SignIn', {returnTo: 'WebDevelopment'});
                  }}>
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDropdownVisible(false)}>
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
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setDropdownVisible(false)}>
              <Text style={styles.dropdownTitle}>Choose Existing Client</Text>
            </TouchableOpacity>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
                autoCapitalize="none"
              />
            </View>

            {isLoadingClients ? (
              <ActivityIndicator
                size="small"
                color="#0D6EFD"
                style={styles.dropdownLoading}
              />
            ) : filteredClients.length > 0 ? (
              <ScrollView style={styles.dropdownScrollView}>
                {filteredClients.map(client => (
                  <TouchableOpacity
                    key={client.c_id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleClientSelect(client.c_id);
                      setDropdownVisible(false);
                      setClientSearchQuery('');
                    }}>
                    <Text style={styles.dropdownItemText}>
                      {client.c_name} , Email : {client.c_email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No clients found</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Navigate to WebDevelopmentTable
  const navigateToWebDevelopmentTable = () => {
    navigation.navigate('WebDevelopmentTable');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileNavbar navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Title and View All Button */}
          <View style={styles.headerRow}>
            <Text style={styles.heading}>
              Tulyarth DigiWeb Services - Web Development
            </Text>
            <TouchableOpacity
              style={styles.viewTableButton}
              onPress={navigateToWebDevelopmentTable}>
              <Text style={styles.viewTableButtonText}>
                View All Entries
              </Text>
            </TouchableOpacity>
          </View>
          {/* Success Message */}
          {submitSuccess && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Your form has been submitted successfully!
              </Text>
            </View>
          )}
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
              <Picker.Item
                label="Web Development Static"
                value="Web Development Static"
              />
              <Picker.Item
                label="Web Development Dynamic"
                value="Web Development Dynamic"
              />
              <Picker.Item
                label="Web Development E-commerce "
                value="Web Development E-commerce"
              />
              <Picker.Item label="CMS Websites" value="CMS Websites" />
              <Picker.Item label="Web Applications" value="Web Applications" />
              <Picker.Item
                label="Educational Websites"
                value="Educational Websites"
              />
            </Picker>
          </View>
          {/* Additional Services Checkboxes */}
          <Text style={styles.label}>Choose More Services</Text>
          <ServiceCheckbox service="Domain" label="Domain" />
          <ServiceCheckbox service="Hosting" label="Hosting" />
          <ServiceCheckbox service="SSL" label="SSL" />
          <ServiceCheckbox
            service="ServerLimitedGB"
            label="Server Limited GB*"
          />
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
              onPress={() => {
                if (userId) {
                  refreshClients(); // Refresh clients when opening dropdown
                }
                setDropdownVisible(true);
              }}>
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
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addClientButton}
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
                            returnTo: 'WebDevelopment',
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
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
          
          {/* View Data Button */}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('WebDevelopmentTable')}>
            <Text style={styles.viewAllButtonText}>
              VIEW ALL WEB DEVELOPMENT DATA
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Client Dropdown Modal */}
      <ClientDropdown />

      <ClientFooter />
    </SafeAreaView>
  );
};

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
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  viewTableButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewTableButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
  },
  clientDropdownText: {
    color: '#333',
  },
  clientDropdownPlaceholder: {
    color: '#999',
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
    marginBottom: 20,
    backgroundColor: '#0D6EFD',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#90b8f8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllButton: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#28a745',
    borderRadius: 5,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#555',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },

  // Dropdown styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    marginTop: 180,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    maxHeight: 400,
  },
  dropdownHeader: {
    backgroundColor: '#0D6EFD',
    padding: 12,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  dropdownTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
  },
  dropdownScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
  },
  dropdownLoading: {
    padding: 20,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#999',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successText: {
    color: '#155724',
    fontSize: 16,
    textAlign: 'center',
  },
  loginPromptContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#333',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default WebDevelopment;
