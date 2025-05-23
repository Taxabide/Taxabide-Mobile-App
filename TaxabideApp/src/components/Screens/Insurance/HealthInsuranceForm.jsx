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
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Checkbox, RadioButton, Button as PaperButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ClientListSelector from '../../ClientSelection/ClientListSelector';

const HealthInsuranceForm = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [relation, setRelation] = useState('');
  const [date, setDate] = useState(null);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [nomineename, setNomineename] = useState('');
  const [nomineeage, setNomineeage] = useState('');
  const [sum, setSum] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadhaarPhotos, setAadhaarPhotos] = useState([]);
  const [panPhoto, setPanPhoto] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [existingClients, setExistingClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);

  const [members, setMembers] = useState({
    Self: false,
    Spouse: false,
    Son: false,
    Daughter: false,
    Mother: false,
    Father: false,
  });

  const [memberDetails, setMemberDetails] = useState({
    Self: '',
    Spouse: '',
    Son: '',
    Daughter: '',
    Mother: '',
    Father: '',
  });

  // Input validation handlers
  const handlePhoneChange = (value) => setPhone(value.replace(/[^0-9]/g, ''));
  const handleNomineeage = (value) => setNomineeage(value.replace(/[^0-9]/g, ''));
  const handlePincode = (value) => setPincode(value.replace(/[^0-9]/g, ''));
  const handlesum = (value) => setSum(value.replace(/[^0-9]/g, ''));

  // Date picker handlers
  const showDatePicker = () => setShowPicker(true);
  const hideDatePicker = () => setShowPicker(false);
  const handleDateChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setIsDateSelected(true);
    }
  };

  // Image picker for Aadhaar photos (multiple)
  const pickAadhaarPhotos = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 2, // Allow multiple selection (front and back)
      quality: 0.8,
    };

    try {
      const result = await launchImageLibrary(options);
      if (!result.didCancel && result.assets) {
        setAadhaarPhotos(result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        })));
      }
    } catch (err) {
      console.error('Error picking Aadhaar photos:', err);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Image picker for PAN photo (single)
  const pickPanPhoto = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 1,
      quality: 0.8,
    };

    try {
      const result = await launchImageLibrary(options);
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setPanPhoto({
          uri: result.assets[0].uri,
          type: result.assets[0].type,
          name: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
        });
      }
    } catch (err) {
      console.error('Error picking PAN photo:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Clear form fields
  const clearForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setGender('');
    setRelation('');
    setDate(null);
    setIsDateSelected(false);
    setNomineename('');
    setNomineeage('');
    setSum('');
    setPincode('');
    setAadhaarPhotos([]);
    setPanPhoto(null);
    setSelectedClient(null);
    setMembers({
      Self: false,
      Spouse: false,
      Son: false,
      Daughter: false,
      Mother: false,
      Father: false,
    });
    setMemberDetails({
      Self: '',
      Spouse: '',
      Son: '',
      Daughter: '',
      Mother: '',
      Father: '',
    });
  };

  // Navigate to Add Client screen
  const handleAddClient = () => {
    navigation.navigate('AddClient');
  };

  // Handle existing client selection
  const handleClientSelection = (client) => {
    setSelectedClient(client);
    setName(client.name || client.c_name || '');
    setEmail(client.email || client.c_email || '');
    setPhone(client.phone || client.c_phone || '');
    setPincode(client.pincode || client.c_pincode || '');
    setGender(client.gender || (client.c_gender?.toLowerCase()) || '');
    
    // Try to parse date if available
    if (client.dob || client.c_dob) {
      try {
        const dob = new Date(client.dob || client.c_dob);
        if (!isNaN(dob.getTime())) { // Check if valid date
          setDate(dob);
          setIsDateSelected(true);
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
  };

  // Fetch existing clients
  const fetchExistingClients = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found. Please login again.');
        setLoading(false);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const userId = parsedUserData.l_id || parsedUserData.id || parsedUserData.user_id;

      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please login again.');
        setLoading(false);
        return;
      }

      // Create FormData for request
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('action', 'list');

      // Make API request to get clients
      const response = await fetch('https://taxabide.in/api/client-list-api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          ...(parsedUserData.token ? {'Authorization': `Bearer ${parsedUserData.token}`} : {})
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      if (Array.isArray(data)) {
        setExistingClients(data);
      } else if (data && data.status === 'success' && Array.isArray(data.data)) {
        setExistingClients(data.data);
      } else if (data && typeof data === 'object') {
        setExistingClients([data]);
      } else {
        setExistingClients([]);
        Alert.alert('Info', 'No clients found');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to fetch existing clients');
    } finally {
      setLoading(false);
    }
  };

  // Submit form data to API
  const handleSubmit = async () => {
    // Form validation
    if (!name || !email || !phone || !gender || !date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!nomineename || !nomineeage || !relation) {
      Alert.alert('Error', 'Please fill in nominee details');
      return;
    }

    if (!sum) {
      Alert.alert('Error', 'Please enter sum insured amount');
      return;
    }

    if (pincode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    try {
      setLoading(true);
      
      // Get user ID from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found. Please login again.');
        setLoading(false);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const userId = parsedUserData.l_id || parsedUserData.id || parsedUserData.user_id;

      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please login again.');
        setLoading(false);
        return;
      }

      // Create FormData for API request
      const formData = new FormData();
      
      // Add data using exact DB field names
      formData.append('h_i_n_name', name);
      formData.append('h_i_n_email', email);
      formData.append('h_i_n_phone', phone);
      formData.append('h_i_n_gender', gender);
      
      // Add user ID with ALL possible field names to ensure it's recognized
      formData.append('h_i_n_user_id', userId); // Primary DB field name for user ID
      formData.append('user_id', userId);       // Alternative field name
      formData.append('l_id', userId);          // Another possible field name
      
      // Add selected members
      Object.keys(members).forEach(key => {
        if (members[key]) {
          formData.append('h_i_n_member[]', key);
        }
      });
      
      // Add member details
      if (members.Self) formData.append('h_i_n_self_detail', memberDetails.Self || '');
      if (members.Spouse) formData.append('h_i_n_spouse_detail', memberDetails.Spouse || '');
      if (members.Son) formData.append('h_i_n_son_detail', memberDetails.Son || '');
      if (members.Daughter) formData.append('h_i_n_daughter_detail', memberDetails.Daughter || '');
      if (members.Mother) formData.append('h_i_n_mother_detail', memberDetails.Mother || '');
      if (members.Father) formData.append('h_i_n_father_detail', memberDetails.Father || '');
      
      // Add nominee details
      formData.append('h_i_n_nominee_name', nomineename);
      formData.append('h_i_n_nominee_age', nomineeage);
      formData.append('h_i_n_nominee_relation', relation);
      
      // Add date of birth and other details
      formData.append('h_i_n_dob', date ? date.toISOString().split('T')[0] : '');
      formData.append('h_i_n_sum_insured', sum);
      formData.append('h_i_n_pincode', pincode);
      
      // Add client ID if an existing client was selected
      if (selectedClient) {
        const clientId = selectedClient.c_id || selectedClient.id || selectedClient.client_id || '';
        if (clientId) {
          formData.append('h_i_n_client_id', clientId);
        }
      }
      
      // Add current date for the add_date field
      formData.append('h_i_n_add_date', new Date().toISOString().split('T')[0]);
      
      // Add document images
      aadhaarPhotos.forEach((photo, index) => {
        formData.append(`h_i_n_aadhar_photo[${index}]`, photo);
      });
      
      if (panPhoto) {
        formData.append('h_i_n_pan_photo', panPhoto);
      }

      // Add authentication data
      if (parsedUserData.token) {
        formData.append('token', parsedUserData.token);
      }
      
      if (parsedUserData.api_key) {
        formData.append('api_key', parsedUserData.api_key);
      }
      
      // Log form data for debugging
      console.log('FormData prepared for submission with user ID:', userId);
      console.log('DB fields being sent:', 
        'h_i_n_name, h_i_n_email, h_i_n_phone, h_i_n_gender, h_i_n_user_id, ' +
        'h_i_n_nominee_name, h_i_n_nominee_age, h_i_n_nominee_relation, h_i_n_sum_insured, ' +
        'h_i_n_dob, h_i_n_pincode, h_i_n_client_id, h_i_n_add_date');
      
      // Submit form data to API
      const response = await fetch('https://taxabide.in/api/add-health-insurance-new-api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(parsedUserData.token ? {'Authorization': `Bearer ${parsedUserData.token}`} : {})
        }
      });

      const responseText = await response.text();
      console.log('API Response:', responseText);
      
      try {
        const responseData = JSON.parse(responseText);
        
        if (responseData.status === 'success') {
          Alert.alert('Success', 'Health insurance application submitted successfully', [
            { text: 'OK', onPress: () => navigation.navigate('HealthInsuranceTable') }
          ]);
          clearForm();
        } else {
          // Handle API errors
          const errorMsg = responseData.message || 'Failed to submit application';
          console.error('API returned error:', errorMsg);
          
          // Try alternative submission if normal submission fails
          if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('user')) {
            console.log('Trying alternative submission approach without images');
            await tryAlternativeSubmission(userId, parsedUserData);
          } else {
            Alert.alert('Error', errorMsg);
          }
        }
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        
        // Check if response contains success message despite JSON parse error
        if (responseText.includes('success')) {
          Alert.alert('Success', 'Health insurance application submitted successfully', [
            { text: 'OK', onPress: () => navigation.navigate('HealthInsuranceTable') }
          ]);
          clearForm();
        } else {
          Alert.alert('Error', 'Failed to submit application. Please try again later.');
        }
      }
    } catch (error) {
      console.error('API submission error:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Alternative submission method without images
  const tryAlternativeSubmission = async (userId, parsedUserData) => {
    try {
      console.log('Attempting alternative submission with basic fields');
      const basicFormData = new FormData();
      
      // Add only the essential fields
      basicFormData.append('h_i_n_name', name);
      basicFormData.append('h_i_n_email', email);
      basicFormData.append('h_i_n_phone', phone);
      basicFormData.append('h_i_n_gender', gender);
      basicFormData.append('h_i_n_user_id', userId);
      basicFormData.append('user_id', userId);
      basicFormData.append('l_id', userId);
      
      // Add nominee details which are required
      basicFormData.append('h_i_n_nominee_name', nomineename);
      basicFormData.append('h_i_n_nominee_age', nomineeage);
      basicFormData.append('h_i_n_nominee_relation', relation);
      basicFormData.append('h_i_n_sum_insured', sum);
      basicFormData.append('h_i_n_dob', date ? date.toISOString().split('T')[0] : '');
      basicFormData.append('h_i_n_pincode', pincode);
      
      const response = await fetch('https://taxabide.in/api/add-health-insurance-new-api.php', {
        method: 'POST',
        body: basicFormData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          ...(parsedUserData.token ? {'Authorization': `Bearer ${parsedUserData.token}`} : {})
        }
      });
      
      const responseText = await response.text();
      console.log('Alternative submission response:', responseText);
      
      if (responseText.includes('success')) {
        Alert.alert('Success', 'Health insurance application submitted successfully (alternative method)', [
          { text: 'OK', onPress: () => navigation.navigate('HealthInsuranceTable') }
        ]);
        clearForm();
        return true;
      } else {
        console.error('Alternative submission failed');
        Alert.alert('Error', 'Failed to submit application. Please try again later.');
        return false;
      }
    } catch (error) {
      console.error('Alternative submission error:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again later.');
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.heading}>Health Insurance (New)</Text>

          <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" />

          <Text style={styles.label}>Your Email <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your Email"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
          <View style={styles.genderRow}>
            <RadioButton
              value="male"
              status={gender === 'male' ? 'checked' : 'unchecked'}
              onPress={() => setGender('male')}
              color="#0D6EFD"
            />
            <Text style={styles.genderLabel}>Male</Text>
            <RadioButton
              value="female"
              status={gender === 'female' ? 'checked' : 'unchecked'}
              onPress={() => setGender('female')}
              color="#0D6EFD"
            />
            <Text style={styles.genderLabel}>Female</Text>
          </View>

          <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.dateInput} onPress={showDatePicker}>
            <Text style={[styles.inputText, !isDateSelected && { color: '#999' }]}>
              {isDateSelected ? date.toLocaleDateString('en-US') : 'mm/dd/yyyy'}
            </Text>
            <MaterialIcons name="calendar-today" size={24} color="#666" />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={styles.label}>Members</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
            {Object.keys(members).map((member) => (
              <View
                key={member}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 10 }}
              >
                <Checkbox
                  status={members[member] ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setMembers(prev => ({
                      ...prev,
                      [member]: !prev[member]
                    }));
                  }}
                  color="#0D6EFD"
                />
                <Text style={styles.checkboxLabel}>{member}</Text>
              </View>
            ))}
          </View>

          {Object.keys(members).map((member) => {
            if (!members[member]) return null;

            return (
              <View key={member} style={{ marginBottom: 15 }}>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter details for ${member} eg(name,dob)`}
                  value={memberDetails[member]}
                  onChangeText={(text) =>
                    setMemberDetails((prev) => ({
                      ...prev,
                      [member]: text,
                    }))
                  }
                />
              </View>
            );
          })}

          <Text style={styles.label}>Nominee Name <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} value={nomineename} onChangeText={setNomineename} placeholder="Nominee Name" />

          <Text style={styles.label}>Nominee Age <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={nomineeage}
            onChangeText={handleNomineeage}
            placeholder="Nominee Age"
            keyboardType="phone-pad"
            maxLength={2}
          />

          <Text style={styles.label}>Nominee Relation <Text style={styles.required}>*</Text></Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={relation} onValueChange={(value) => setRelation(value)}>
              <Picker.Item label="--Select Relation--" value="" />
              <Picker.Item label="Self" value="Self" />
              <Picker.Item label="Spouse" value="Spouse" />
              <Picker.Item label="Son" value="Son" />
              <Picker.Item label="Daughter" value="Daughter" />
              <Picker.Item label="Mother" value="Mother" />
              <Picker.Item label="Father" value="Father" />
            </Picker>
          </View>

          <Text style={styles.label}>Sum Insured <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={sum}
            onChangeText={handlesum}
            placeholder="Insured Amount"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Pincode <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={handlePincode}
            placeholder="Enter Pincode"
            keyboardType="phone-pad"
            maxLength={6}
          />

          <Text style={styles.label}>Upload Aadhaar Photos (Front and Back)</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity style={styles.chooseFileButton} onPress={pickAadhaarPhotos}>
              <Text style={styles.chooseFileText}>Choose Files</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>
              {aadhaarPhotos.length > 0 ? `${aadhaarPhotos.length} file(s) selected` : 'No file chosen'}
            </Text>
          </View>

          {aadhaarPhotos.length > 0 && (
            <View style={styles.previewImagesContainer}>
              {aadhaarPhotos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo.uri }}
                  style={styles.previewImage}
                />
              ))}
            </View>
          )}

          <Text style={styles.label}>Upload PAN Photo</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity style={styles.chooseFileButton} onPress={pickPanPhoto}>
              <Text style={styles.chooseFileText}>Choose File</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>{panPhoto ? 'File Selected' : 'No file chosen'}</Text>
          </View>
          
          {panPhoto && (
            <Image 
              source={{ uri: panPhoto.uri }} 
              style={styles.previewImage} 
            />
          )}

          <Text style={styles.label}>Choose Existing Client</Text>
          <TouchableOpacity 
            style={styles.clientSelector}
            onPress={() => setShowClientModal(true)}
          >
            <View style={styles.clientSelectorContent}>
              {selectedClient ? (
                <View>
                  <Text style={styles.selectedClientName}>{selectedClient.name || selectedClient.c_name}</Text>
                  <Text style={styles.selectedClientEmail}>{selectedClient.email || selectedClient.c_email}</Text>
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

          {/* Add Client Button */}
          <PaperButton
            mode="outlined"
            onPress={handleAddClient}
            style={[styles.addClientButton]}
            labelStyle={{ color: '#0D6EFD', fontSize: 16 }}
          >
            Add New Client
          </PaperButton>

          {/* Submit Button */}
          <PaperButton
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            labelStyle={{ color: '#fff', fontSize: 16 }}
            loading={loading}
            disabled={loading}
          >
            Submit
          </PaperButton>

          {/* View Records Button */}
          <PaperButton
            mode="outlined"
            onPress={() => navigation.navigate('HealthInsuranceTable')}
            style={[styles.viewRecordsButton]}
            labelStyle={{ color: '#487FFF', fontSize: 16 }}
            icon="format-list-bulleted"
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
    marginBottom: 20, 
    color: '#000', 
    marginTop: 20 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingBottom: 20 
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    color: '#333' 
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 9,
    marginBottom: 15,
  },
  genderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  genderLabel: { 
    marginRight: 20, 
    fontSize: 16, 
    color: '#333' 
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
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
    marginBottom: 15,
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
    marginBottom: 15,
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
  previewImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  previewImage: {
    width: 150,
    height: 150,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#487FFF',
    borderRadius: 5,
    padding: 5,
  },
  addClientButton: {    marginTop: 20,    borderColor: '#0D6EFD',    borderRadius: 5,    padding: 5,  },  viewRecordsButton: {    marginTop: 15,    borderColor: '#487FFF',    borderRadius: 5,    padding: 5,  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    marginBottom: 25,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clientItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clientDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default HealthInsuranceForm; 