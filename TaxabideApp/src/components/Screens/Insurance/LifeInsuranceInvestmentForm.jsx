import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button as PaperButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ClientListSelector from '../../ClientSelection/ClientListSelector';
import { useSelector, useDispatch } from 'react-redux';
import { submitLifeInsuranceForm, resetLifeInsuranceState } from '../../../redux/slices/lifeInsuranceSlice';
import { selectSelectedClient, selectClient } from '../../../redux/slices/clientsSlice';

const LifeInsuranceInvestmentForm = ({ navigation }) => {
  // Redux hooks
  const dispatch = useDispatch();
  const selectedClient = useSelector(selectSelectedClient);
  const { isSubmitting, success, error } = useSelector(state => state.lifeInsurance);
  
  // Component state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [relation, setRelation] = useState('');
  const [date, setDate] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeAge, setNomineeAge] = useState('');
  const [investmentPlan, setInvestmentPlan] = useState('');
  const [investmentPerMonth, setInvestmentPerMonth] = useState('');
  const [investmentForYears, setInvestmentForYears] = useState('');
  const [withdrawAfterYears, setWithdrawAfterYears] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState([]);
  const [panPhoto, setPanPhoto] = useState(null);
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);

  // Input field handlers
  const handlePhoneChange = (value) => setPhone(value.replace(/[^0-9]/g, ''));
  const handleNomineeAge = (value) => setNomineeAge(value.replace(/[^0-9]/g, ''));
  const handlePincode = (value) => setPincode(value.replace(/[^0-9]/g, ''));
  const handleInvestmentPerMonth = (value) => setInvestmentPerMonth(value.replace(/[^0-9]/g, ''));
  const handleInvestmentForYears = (value) => setInvestmentForYears(value.replace(/[^0-9]/g, ''));
  const handleWithdrawAfterYears = (value) => setWithdrawAfterYears(value.replace(/[^0-9]/g, ''));
  const handleAge = (value) => setAge(value.replace(/[^0-9]/g, ''));

  // Get user ID on component mount
  useEffect(() => {
    getUserId();
  }, []);

  // Get the user ID from AsyncStorage
  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        const id = parsedData.l_id || parsedData.id || parsedData.user_id;
        console.log('Setting user ID:', id);
        setUserId(id);
        return id;
      }
      console.log('No user data found in AsyncStorage');
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  // Handle date picker changes
  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setIsDateSelected(true);
    }
  };

  // Format date for API
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Pick Aadhaar photos
  const pickAadhaarPhotos = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
      selectionLimit: 3,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Something went wrong when picking the image');
      } else if (response.assets && response.assets.length > 0) {
        setAadhaarPhoto(response.assets.map((asset) => asset.uri));
      }
    });
  };

  // Pick PAN photo
  const pickPanPhoto = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
      selectionLimit: 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Something went wrong when picking the image');
      } else if (response.assets && response.assets.length > 0) {
        setPanPhoto(response.assets[0].uri);
      }
    });
  };

  // Navigate to Add Client screen
  const navigateToAddClient = () => {
    navigation.navigate('AddClient');
  };

  // Effect to handle successful form submission
  useEffect(() => {
    if (success) {
      // Reset form fields
      setName('');
      setEmail('');
      setPhone('');
      setAadharNumber('');
      setPanNumber('');
      setAge('');
      setGender('');
      setPincode('');
      setInvestmentPlan('');
      setNomineeName('');
      setNomineeAge('');
      setRelation('');
      setInvestmentPerMonth('');
      setInvestmentForYears('');
      setWithdrawAfterYears('');
      setAadhaarPhoto([]);
      setPanPhoto(null);
      setDate(new Date());
      setIsDateSelected(false);
      
      Alert.alert(
        'Success',
        'Life insurance investment submitted successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              dispatch(resetLifeInsuranceState());
              // Navigate to the table view to see the newly added record
              navigation.navigate('LifeInsuranceInvestmentTable');
            } 
          }
        ]
      );
    }
  }, [success, dispatch, navigation]);

  // Effect to handle form submission errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Effect to populate form when a client is selected
  useEffect(() => {
    if (selectedClient) {
      setName(selectedClient.name || '');
      setEmail(selectedClient.email || '');
      setPhone(selectedClient.phone || '');
      // Optionally set other fields if available in client data
    }
  }, [selectedClient]);

  // Prepare form data for API submission
  const prepareFormData = async () => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('l_i_name', name);
    formData.append('l_i_email', email);
    formData.append('l_i_phone', phone);
    formData.append('l_i_aadhar', aadharNumber);
    formData.append('l_i_pan', panNumber);
    formData.append('l_i_age', age);
    formData.append('l_i_gender', gender);
    formData.append('l_i_pincode', pincode);
    formData.append('l_i_investment_plan', investmentPlan);
    formData.append('l_i_nominee_name', nomineeName);
    formData.append('l_i_nominee_age', nomineeAge);
    formData.append('l_i_nominee_relation', relation);
    formData.append('l_i_investment_per_month', investmentPerMonth);
    formData.append('l_i_investment_for_year', investmentForYears);
    formData.append('l_i_withdraw_after_year', withdrawAfterYears);
    if (selectedClient && selectedClient.id) {
      formData.append('l_i_client_id', selectedClient.id);
    }
    
    // Get the current user ID if not already set
    let currentUserId = userId;
    if (!currentUserId) {
      currentUserId = await getUserId();
    }
    
    // Add the user ID to form data using the database field name l_i_user_id
    if (currentUserId) {
      formData.append('l_i_user_id', currentUserId);
      console.log('Adding user ID to form data with field name l_i_user_id:', currentUserId);
    } else {
      console.warn('No user ID available for form submission');
    }

    // Add Aadhaar photos
    if (aadhaarPhoto.length > 0) {
      aadhaarPhoto.forEach((uri, index) => {
        const fileType = uri.split('.').pop();
        formData.append('l_i_aadhar_photo', {
          uri: uri,
          name: `aadhar_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });
    }

    // Add PAN photo
    if (panPhoto) {
      const fileType = panPhoto.split('.').pop();
      formData.append('l_i_pan_photo', {
        uri: panPhoto,
        name: `pan.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    return formData;
  };

  // Submit form via Redux
  const handleSubmit = async () => {
    // Validate fields
    if (
      !name ||
      !email ||
      !phone ||
      !aadharNumber ||
      !panNumber ||
      !age ||
      !gender ||
      !pincode ||
      !investmentPlan ||
      !nomineeName ||
      !nomineeAge ||
      !relation ||
      !investmentPerMonth ||
      !investmentForYears ||
      !withdrawAfterYears ||
      !aadhaarPhoto.length ||
      !panPhoto
    ) {
      Alert.alert('Error', 'Please fill in all required fields and upload all necessary photos.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    // Get current user ID if not already set
    let currentUserId = userId;
    if (!currentUserId) {
      currentUserId = await getUserId();
    }

    if (!currentUserId) {
      Alert.alert('Error', 'User ID not available. Please log out and log in again.');
      return;
    }

    // Prepare form data for submission through Redux - use exact DB field names
    const formData = {
      // Main DB fields as specified
      l_i_name: name,
      l_i_email: email,
      l_i_phone: phone,
      l_i_aadhar: aadharNumber,
      l_i_pan: panNumber,
      l_i_age: age,
      l_i_gender: gender,
      l_i_pincode: pincode,
      l_i_investment_plan: investmentPlan,
      l_i_nominee_name: nomineeName,
      l_i_nominee_age: nomineeAge,
      l_i_nominee_relation: relation,
      l_i_investment_per_month: investmentPerMonth,
      l_i_investment_for_year: investmentForYears,
      l_i_withdraw_after_year: withdrawAfterYears,
      l_i_user_id: currentUserId,
      l_i_client_id: null,
      l_i_add_date: new Date().toISOString().split('T')[0], // Add current date in YYYY-MM-DD format

      // These are handled specially for file upload
      aadhaarPhoto: aadhaarPhoto, // Will be processed to l_i_aadhar_photo
      panPhoto: panPhoto,         // Will be processed to l_i_pan_photo

      // Add any additional metadata that might be needed
      form_type: 'life_insurance_investment',
      source: 'mobile_app'
    };

    // Add client ID if available
    if (selectedClient) {
      // Try different possible client ID field names
      formData.l_i_client_id = selectedClient.c_id || 
                              selectedClient.id || 
                              selectedClient.client_id || 
                              '';
      console.log('Adding client ID to form data:', formData.l_i_client_id);
    }

    // Log form data for debugging
    console.log('Submitting form with all DB fields:', {
      l_i_name: formData.l_i_name,
      l_i_email: formData.l_i_email,
      l_i_phone: formData.l_i_phone,
      l_i_aadhar: formData.l_i_aadhar,
      l_i_pan: formData.l_i_pan,
      l_i_age: formData.l_i_age,
      l_i_gender: formData.l_i_gender,
      l_i_pincode: formData.l_i_pincode,
      l_i_investment_plan: formData.l_i_investment_plan,
      l_i_nominee_name: formData.l_i_nominee_name,
      l_i_nominee_age: formData.l_i_nominee_age,
      l_i_nominee_relation: formData.l_i_nominee_relation,
      l_i_investment_per_month: formData.l_i_investment_per_month,
      l_i_investment_for_year: formData.l_i_investment_for_year,
      l_i_withdraw_after_year: formData.l_i_withdraw_after_year,
      l_i_user_id: formData.l_i_user_id,
      l_i_client_id: formData.l_i_client_id,
      l_i_add_date: formData.l_i_add_date,
      aadhar_photos: aadhaarPhoto.length + ' files',
      pan_photo: panPhoto ? 'Selected' : 'Not selected'
    });
    
    // Dispatch the action to submit the form
    try {
      dispatch(submitLifeInsuranceForm(formData));
    } catch (error) {
      console.error('Error dispatching form submission:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    }
  };

  // Handle client selection
  const handleClientSelection = (client) => {
    // Dispatch the Redux action to update the selected client
    dispatch(selectClient(client));
    
    // Set any additional fields available in client data
    if (client) {
      if (client.aadhar) setAadharNumber(client.aadhar);
      if (client.pan) setPanNumber(client.pan);
      if (client.age) setAge(client.age.toString());
      if (client.gender) setGender(client.gender);
      
      // Close the modal
      setShowClientModal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.heading}>Life Insurance (Investment)</Text>

          <Text style={styles.label}>Full Name*</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
          />

          <Text style={styles.label}>Your Email*</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your Email"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone Number*</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>Aadhar Number*</Text>
          <TextInput 
            style={styles.input} 
            value={aadharNumber} 
            onChangeText={setAadharNumber} 
            placeholder="Enter Your Aadhar Number" 
            keyboardType="numeric"
            maxLength={12}
          />

          <Text style={styles.label}>PAN*</Text>
          <TextInput 
            style={styles.input} 
            value={panNumber} 
            onChangeText={setPanNumber} 
            placeholder="Enter Your PAN" 
            autoCapitalize="characters"
            maxLength={10}
          />

          <Text style={styles.label}>Age*</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={handleAge}
            placeholder="Enter Your Age"
            keyboardType="numeric"
            maxLength={3}
          />

          <Text style={styles.label}>Gender*</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setGender('Male')}
            >
              <View style={styles.outerCircle}>
                {gender === 'Male' && <View style={styles.innerCircle} />}
              </View>
              <Text style={styles.optionText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setGender('Female')}
            >
              <View style={styles.outerCircle}>
                {gender === 'Female' && <View style={styles.innerCircle} />}
              </View>
              <Text style={styles.optionText}>Female</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Date of Birth*</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.inputText}>
              {isDateSelected ? formatDate(date) : 'Select Date'}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color="#000" />
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={onChange}
            />
          )}

          <Text style={styles.label}>Pincode*</Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={handlePincode}
            placeholder="Enter Pincode"
            keyboardType="numeric"
            maxLength={6}
          />

          <Text style={styles.label}>Investment Plan*</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={investmentPlan} onValueChange={setInvestmentPlan}>
              <Picker.Item label="Select Plan" value="" />
              <Picker.Item label="Term" value="Term" />
              <Picker.Item label="Endowment" value="Endowment" />
              <Picker.Item label="Money Back" value="Money Back" />
              <Picker.Item label="Guaranteed Return" value="Guaranteed Return" />
              <Picker.Item label="Pension Plan" value="Pension Plan" />
            </Picker>
          </View>

          <Text style={styles.label}>Nominee Name*</Text>
          <TextInput 
            style={styles.input} 
            value={nomineeName} 
            onChangeText={setNomineeName} 
            placeholder="Nominee Name" 
          />

          <Text style={styles.label}>Nominee Age*</Text>
          <TextInput
            style={styles.input}
            value={nomineeAge}
            onChangeText={handleNomineeAge}
            placeholder="Nominee Age"
            keyboardType="numeric"
            maxLength={3}
          />

          <Text style={styles.label}>Nominee Relation*</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={relation} onValueChange={setRelation}>
              <Picker.Item label="--Select Relation--" value="" />
              <Picker.Item label="Self" value="Self" />
              <Picker.Item label="Spouse" value="Spouse" />
              <Picker.Item label="Son" value="Son" />
              <Picker.Item label="Daughter" value="Daughter" />
              <Picker.Item label="Mother" value="Mother" />
              <Picker.Item label="Father" value="Father" />
            </Picker>
          </View>

          <Text style={styles.label}>Investment Per Month*</Text>
          <TextInput
            style={styles.input}
            value={investmentPerMonth}
            onChangeText={handleInvestmentPerMonth}
            placeholder="Enter Investment Per Month"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Investment for (Years)*</Text>
          <TextInput
            style={styles.input}
            value={investmentForYears}
            onChangeText={handleInvestmentForYears}
            placeholder="Enter Investment Duration"
            keyboardType="numeric"
            maxLength={2}
          />

          <Text style={styles.label}>Withdraw After (Years)*</Text>
          <TextInput
            style={styles.input}
            value={withdrawAfterYears}
            onChangeText={handleWithdrawAfterYears}
            placeholder="Enter Withdraw After Years"
            keyboardType="numeric"
            maxLength={2}
          />

          <Text style={styles.label}>Upload Aadhaar Photos (Front and Back)*</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity style={styles.chooseFileButton} onPress={pickAadhaarPhotos}>
              <Text style={styles.chooseFileText}>Choose Files</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>
              {aadhaarPhoto.length > 0 ? `${aadhaarPhoto.length} file(s) selected` : 'No file chosen'}
            </Text>
          </View>

          {aadhaarPhoto.length > 0 &&
            aadhaarPhoto.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: 200, height: 150, marginBottom: 10 }}
              />
            ))}

          <Text style={styles.label}>PAN Photo*</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity style={styles.chooseFileButton} onPress={pickPanPhoto}>
              <Text style={styles.chooseFileText}>Choose File</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>{panPhoto ? 'File Selected' : 'No file chosen'}</Text>
          </View>
          {panPhoto && <Image source={{ uri: panPhoto }} style={{ width: 200, height: 150, marginBottom: 20 }} />}

          <Text style={styles.label}>Choose Existing Client*</Text>
          <TouchableOpacity 
            style={styles.clientSelector}
            onPress={() => setShowClientModal(true)}
          >
            <View style={styles.clientSelectorContent}>
              {selectedClient ? (
                <View>
                  <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
                  <Text style={styles.selectedClientEmail}>{selectedClient.email}</Text>
                  {selectedClient.phone && (
                    <Text style={styles.selectedClientEmail}>{selectedClient.phone}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.clientPlaceholder}>Tap to select an existing client</Text>
              )}
            </View>
            <View style={styles.clientIconContainer}>
              <MaterialIcons name="people" size={24} color="#487FFF" />
              <Text style={styles.selectClientText}>Select</Text>
            </View>
          </TouchableOpacity>

          {/* Client Selection Modal */}
          <ClientListSelector
            visible={showClientModal}
            onClose={() => setShowClientModal(false)}
            onClientSelected={handleClientSelection}
          />

          <PaperButton
            mode="outlined"
            onPress={navigateToAddClient}
            style={[styles.submitButton, { backgroundColor: '#0D6EFD', borderColor: '#0D6EFD', marginBottom: 10 }]}
            labelStyle={{ color: '#ffffff', fontSize: 16 }}
          >
            Add Client
          </PaperButton>

          <PaperButton
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            labelStyle={{ color: '#fff', fontSize: 16 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : 'Submit'}
          </PaperButton>

          <PaperButton
            mode="outlined"
            onPress={() => navigation.navigate('LifeInsuranceInvestmentTable')}
            style={[styles.submitButton, { backgroundColor: '#4CAF50', borderColor: '#4CAF50', marginTop: 15 }]}
            labelStyle={{ color: '#ffffff', fontSize: 16 }}
          >
            View Insurance Records
          </PaperButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: { 
    flex: 1, 
    padding: 20 
  },
  heading: { 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 25, 
    color: '#000', 
    marginTop: 20 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingBottom: 25 
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
    padding: 10,
    marginBottom: 20,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    paddingRight: 5,
  },
  outerCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { 
    fontSize: 16, 
    color: '#000' 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  fileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  chooseFileButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  chooseFileText: {
    color: '#000',
    fontSize: 14,
  },
  fileNameText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    marginLeft: 10,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#487FFF',
    borderRadius: 5,
  },
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 10,
    minHeight: 60,
  },
  clientSelectorContent: {
    flex: 1,
    paddingRight: 10,
  },
  clientPlaceholder: {
    color: '#888',
    fontSize: 15,
  },
  selectedClientName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  selectedClientEmail: {
    fontSize: 13,
    color: '#666',
  },
  clientIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectClientText: {
    fontSize: 12,
    color: '#487FFF',
    marginTop: 2,
  },
});

export default LifeInsuranceInvestmentForm; 