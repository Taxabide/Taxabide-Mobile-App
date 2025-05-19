import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  BackHandler,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import ClientFooter from '../Footer/ClientFooter';
import ClientsTable from './ClientsTable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileNavbar from '../NavBar/ProfileNavbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {Easing} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {
  fetchClients,
  addClient,
  resetSuccess,
  resetError,
  resetClientsState,
} from '../../../redux/slices/clientsSlice';

const API_URL = 'https://taxabide.in/api/add-client-api.php';
const CLIENTS_LIST_API_URL = 'https://taxabide.in/api/clients-list-api.php';

const AddClient = ({onAddClient = null, navigation}) => {
  const dispatch = useDispatch();

  // Get data from Redux store
  const {user} = useSelector(state => state.user);
  const {clients, isLoading, error, success} = useSelector(
    state => state.clients,
  );

  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    aadhar: '',
    pan: '',
  };

  const initialFilesState = {
    pan_photo: null,
    aadhar_photo: null,
    photo: null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [files, setFiles] = useState(initialFilesState);
  const [errors, setErrors] = useState({});
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Debug logging
  useEffect(() => {
    if (error) {
      console.warn('Client fetch/add error:', error);
    }
  }, [error]);

  useEffect(() => {
    console.log('Current clients data:', clients);
    console.log('Clients data type:', typeof clients);
    console.log('Is clients array?', Array.isArray(clients));
    console.log('Clients length:', clients ? clients.length : 0);
  }, [clients]);

  // Handle input changes
  const handleInputChange = useCallback(
    (key, value) => {
      setFormData(prev => ({...prev, [key]: value}));
      // Clear error for this field when user starts typing
      if (errors[key]) {
        setErrors(prev => ({...prev, [key]: null}));
      }
    },
    [errors],
  );

  // Add client from parent component if needed
  const addClientFromParent = useCallback((clientData, clientFiles) => {
    if (clientData) {
      setFormData(clientData);
    }
    if (clientFiles) {
      setFiles(clientFiles);
    }
  }, []);

  // Fetch clients when component mounts and on focus
  useFocusEffect(
    useCallback(() => {
      // Only fetch if we haven't already or if there's an error
      if (!initialFetchDone || error) {
        console.log('Dispatching fetchClients from useFocusEffect');
        dispatch(fetchClients())
          .unwrap()
          .then(() => {
            setInitialFetchDone(true);
          })
          .catch(err => {
            console.error('Error fetching clients in useFocusEffect:', err);
            // Don't set initialFetchDone to true here, to allow retry
          });
      }
    }, [dispatch, initialFetchDone, error]),
  );

  // Initial client fetch on mount
  useEffect(() => {
    console.log('Dispatching initial fetchClients');
    // Check for user data first
    AsyncStorage.getItem('userData')
      .then(userData => {
        if (!userData) {
          console.error('No user data found in AsyncStorage');
          Alert.alert(
            'Authentication Error',
            'Please log in again to continue',
            [{text: 'OK', onPress: () => navigation.navigate('SignIn')}],
          );
          return;
        }

        console.log('User data exists, proceeding with client fetch');
        dispatch(fetchClients())
          .unwrap()
          .then(() => {
            setInitialFetchDone(true);
          })
          .catch(err => {
            console.error('Error fetching clients in initial load:', err);
            // Still set initialFetchDone to avoid endless retries
            setInitialFetchDone(true);
          });
      })
      .catch(err => {
        console.error('Error checking AsyncStorage for user data:', err);
      });
  }, [dispatch, navigation]);

  // Handle success effect for animation
  useEffect(() => {
    if (success) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  }, [success, scaleAnim]);

  // Effect to handle add client callback
  useEffect(() => {
    if (onAddClient) {
      onAddClient(addClientFromParent);
    }
  }, [onAddClient, addClientFromParent]);

  const handleChooseFile = async type => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false, // Set to true if you need base64 data
      };

      const result = await ImagePicker.launchImageLibrary(options);

      if (!result.didCancel && result.assets?.length > 0) {
        const file = result.assets[0];

        // Verify the file was received correctly
        if (!file.uri) {
          throw new Error('No image URI received from picker');
        }

        // Log the selected file info for debugging
        console.log(`Selected ${type} image:`, {
          uri: file.uri,
          type: file.type,
          fileName: file.fileName,
          fileSize: file.fileSize,
        });

        setFiles(prev => ({
          ...prev,
          [type]: {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.fileName || `${type}_${Date.now()}.jpg`,
          },
        }));

        // Clear error for this field
        if (errors[type]) {
          setErrors(prev => ({...prev, [type]: null}));
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to pick image: ' + (error.message || 'Unknown error'),
      );
      console.error('Image picker error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const {name, email, phone, aadhar, pan} = formData;

    // Required fields
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!aadhar.trim()) newErrors.aadhar = 'Aadhar number is required';
    if (!pan.trim()) newErrors.pan = 'PAN is required';

    // File validation
    if (!files.pan_photo) newErrors.pan_photo = 'PAN photo is required';
    if (!files.aadhar_photo)
      newErrors.aadhar_photo = 'Aadhar photo is required';
    if (!files.photo) newErrors.photo = 'Photo is required';

    // Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    const phoneRegex = /^\d{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    // Aadhar validation (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (aadhar && !aadharRegex.test(aadhar)) {
      newErrors.aadhar = 'Aadhar must be 12 digits';
    }

    // PAN validation (10 alphanumeric)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (pan && !panRegex.test(pan)) {
      newErrors.pan = 'Invalid PAN format (ABCDE1234F)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFiles(initialFilesState);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to add a client');
      return;
    }

    // Clear any previous errors
    dispatch(resetError());

    // Create safe copies of form data to prevent issues
    const safeFormData = {...formData};
    const safeFiles = {...files};

    // Dispatch addClient action with form data and files
    console.log('Submitting client with data:', safeFormData);
    dispatch(addClient({formData: safeFormData, files: safeFiles}))
      .unwrap()
      .then(() => {
        console.log('Client added successfully');
        // Reset form immediately on success
        resetForm();

        // Show simple alert instead of full success screen
        Alert.alert('Success', 'Client added successfully!', [{text: 'OK'}]);

        // Reset success state and fetch updated clients list
        dispatch(resetSuccess());
        dispatch(fetchClients());
      })
      .catch(err => {
        console.error('Failed to add client:', err);

        // Check if error message is actually a success message
        if (
          typeof err === 'string' &&
          (err.includes('success') ||
            err.toLowerCase().includes('inserted') ||
            err.toLowerCase().includes('added'))
        ) {
          // This is actually a success case
          console.log('Detected success message in error response');
          resetForm();
          Alert.alert('Success', 'Client added successfully!', [{text: 'OK'}]);
          // Reset success state and fetch updated clients list
          dispatch(resetSuccess());
          dispatch(fetchClients());
          return;
        }

        // This is a genuine error
        Alert.alert(
          'Error',
          typeof err === 'string'
            ? err
            : 'Failed to add client. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: () => {}, // Just dismiss
            },
            {
              text: 'Contact Support',
              onPress: () =>
                Alert.alert(
                  'Contact Support',
                  'Please contact support at support@taxabide.in if this issue persists.',
                ),
            },
          ],
        );
      });
  };

  const renderFileStatus = fileType => {
    const file = files[fileType];
    if (file) {
      // Truncate long filenames
      const name = file.name || 'File selected';
      return name.length > 20 ? name.substring(0, 17) + '...' : name;
    }
    return 'No file chosen';
  };

  const formFields = [
    {label: 'Full Name', key: 'name', placeholder: 'Enter full name'},
    {
      label: 'Email',
      key: 'email',
      keyboardType: 'email-address',
      placeholder: 'example@email.com',
    },
    {
      label: 'Phone Number',
      key: 'phone',
      keyboardType: 'phone-pad',
      placeholder: '10-digit number',
    },
    {
      label: 'Aadhar Number',
      key: 'aadhar',
      keyboardType: 'numeric',
      placeholder: '12-digit Aadhar',
    },
    {
      label: 'PAN',
      key: 'pan',
      placeholder: 'ABCDE1234F',
      autoCapitalize: 'characters',
    },
  ];

  const fileFields = [
    {label: 'Upload PAN', type: 'pan_photo'},
    {label: 'Upload Aadhar', type: 'aadhar_photo'},
    {label: 'Profile Photo', type: 'photo'},
  ];

  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Use simple goBack instead of reset
        navigation.goBack();
        return true;
      };

      // The addEventListener returns a function to remove the event listener
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Return the function to unsubscribe on cleanup
      return () => subscription.remove();
    }, [navigation]),
  );

  // Reset success state when component unmounts
  useEffect(() => {
    return () => {
      if (success) {
        dispatch(resetSuccess());
      }
    };
  }, [success, dispatch]);

  // Function to check if clients data is valid
  const validateClientsData = useCallback(data => {
    if (!data) return false;
    if (!Array.isArray(data)) return false;

    // Additional check for client data validity
    if (data.length === 0) return false;

    // Make sure at least the first item has some expected properties
    const firstItem = data[0];
    return (
      typeof firstItem === 'object' &&
      (firstItem.c_id || firstItem.c_name || firstItem.id || firstItem.name)
    );
  }, []);

  // Add an explicit refresh function for the clients list
  const refreshClientsList = useCallback(() => {
    console.log('Manually refreshing clients list...');
    // Reset everything first
    dispatch(resetError());
    dispatch(resetClientsState());
    // Then fetch fresh data
    dispatch(fetchClients())
      .unwrap()
      .then(() => {
        console.log('Clients list refreshed successfully');
      })
      .catch(err => {
        console.error('Error refreshing clients list:', err);
      });
  }, [dispatch]);

  // Auto-reset success state to avoid showing the success UI
  useEffect(() => {
    if (success) {
      // Reset success immediately to prevent any success UI from showing
      dispatch(resetSuccess());
    }
  }, [success, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <ProfileNavbar navigation={navigation} title="Add Client" />
      {/* Breadcrumb navigation */}
      <View style={styles.breadcrumbContainer}>
        <Text style={styles.breadcrumbTitle}>Add Client</Text>
        <Icon
          name="home-outline"
          size={18}
          color="#6B7280"
          style={styles.breadcrumbHomeIcon}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.breadcrumbDashboard}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>-</Text>
        <Text style={styles.breadcrumbCurrent}>Add Client</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Add Client</Text>

            {formFields.map(field => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors[field.key] ? styles.inputError : null,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={field.keyboardType || 'default'}
                  value={formData[field.key]}
                  onChangeText={text => handleInputChange(field.key, text)}
                  autoCapitalize={field.autoCapitalize || 'none'}
                />
                {errors[field.key] && (
                  <Text style={styles.errorText}>{errors[field.key]}</Text>
                )}
              </View>
            ))}

            {fileFields.map(fileInput => (
              <View key={fileInput.type} style={styles.inputGroup}>
                <Text style={styles.label}>{fileInput.label}</Text>
                <TouchableOpacity
                  style={[
                    styles.fileButton,
                    errors[fileInput.type] ? styles.fileButtonError : null,
                  ]}
                  onPress={() => handleChooseFile(fileInput.type)}>
                  <Text style={styles.fileButtonText}>Choose File</Text>
                </TouchableOpacity>

                {files[fileInput.type] ? (
                  <View style={styles.filePreviewContainer}>
                    <Image
                      source={{uri: files[fileInput.type].uri}}
                      style={styles.filePreview}
                      resizeMode="cover"
                    />
                    <Text style={styles.fileStatusText}>
                      {renderFileStatus(fileInput.type)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.fileStatusText}>
                    {renderFileStatus(fileInput.type)}
                  </Text>
                )}

                {errors[fileInput.type] && (
                  <Text style={styles.errorText}>{errors[fileInput.type]}</Text>
                )}
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={resetForm}
                disabled={isLoading}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}
          </View>

          {/* Client list section */}
          <View style={styles.clientListSection}>
            <View style={styles.clientListHeader}>
              <Text style={styles.clientListTitle}>
                {validateClientsData(clients) && clients.length > 0
                  ? `Your Clients (${clients.length})`
                  : 'Your Clients'}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={refreshClientsList}>
                <Icon name="refresh" size={18} color="#1f1787" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {isLoading && !clients.length ? (
              <View style={styles.clientsLoadingContainer}>
                <ActivityIndicator size="large" color="#1f1787" />
                <Text style={styles.clientsLoadingText}>
                  Loading clients...
                </Text>
              </View>
            ) : validateClientsData(clients) && clients.length > 0 ? (
              <View style={styles.clientTableContainer}>
                <ClientsTable clientsdata={clients} filesdata={files} />
              </View>
            ) : error ? (
              <View style={styles.clientsErrorContainer}>
                <Icon name="alert-circle-outline" size={30} color="#EF4444" />
                <Text style={styles.clientsErrorTitle}>
                  Unable to Load Clients
                </Text>
                <Text style={styles.clientsErrorText}>{error}</Text>
                <View style={styles.errorButtonsContainer}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      // Clear error first
                      dispatch(resetError());
                      // Then try fetching again
                      console.log('Retrying client fetch...');
                      dispatch(fetchClients());
                    }}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contactSupportButton}
                    onPress={() =>
                      Alert.alert(
                        'Contact Support',
                        'Please contact support at support@taxabide.in if this issue persists.',
                      )
                    }>
                    <Text style={styles.contactSupportText}>
                      Contact Support
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noClientsContainer}>
                <Icon
                  name="account-multiple-outline"
                  size={50}
                  color="#9CA3AF"
                />
                <Text style={styles.noClientsText}>No clients found</Text>
                <Text style={styles.noClientsSubtext}>
                  Add your first client using the form above
                </Text>
              </View>
            )}
          </View>

          <ClientFooter navigation={navigation} activeTab="AddClient" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Define styles here...
const styles = StyleSheet.create({
  clientsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientsLoadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  clientsErrorContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    alignItems: 'center',
  },
  clientsErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B91C1C',
    marginTop: 8,
    marginBottom: 4,
  },
  clientsErrorText: {
    color: '#B91C1C',
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  retryButton: {
    marginHorizontal: 8,
    backgroundColor: '#1f1787',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contactSupportButton: {
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  contactSupportText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  noClientsContainer: {
    padding: 30,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noClientsText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  noClientsSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 6,
  },
  errorMessage: {
    color: '#B91C1C',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  breadcrumbTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 16,
  },
  breadcrumbHomeIcon: {
    marginRight: 8,
  },
  breadcrumbDashboard: {
    fontSize: 14,
    color: '#6B7280',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  fileButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fileButtonError: {
    borderColor: '#EF4444',
  },
  fileButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  filePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  filePreview: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  fileStatusText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  resetButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1f1787',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confetti: {
    fontSize: 30,
    marginBottom: 16,
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
  clientListSection: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  clientListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  refreshButtonText: {
    marginLeft: 4,
    color: '#1f1787',
    fontWeight: '500',
    fontSize: 14,
  },
  clientListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 8,
  },
  clientTableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

export default AddClient;
