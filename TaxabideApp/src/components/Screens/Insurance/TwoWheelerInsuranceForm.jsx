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

const TwoWheelerInsuranceForm = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [relation, setRelation] = useState('');
  const [date, setDate] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [nomineename, setNomineename] = useState('');
  const [nomineeage, setNomineeage] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState([]);
  const [panPhoto, setPanPhoto] = useState(null);
  const [exsistingclient, setExsistingClient] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [pan, setPan] = useState('');
  const [age, setAge] = useState('');
  const [vehicleType, setVehicleType] = useState(null);
  const [policyType, setPolicyType] = useState(null);
  const [rcPhoto, setRcPhoto] = useState([]);
  const [claim, setClaim] = useState(null);
  const [oldInsuranceExpiry, setOldInsuranceExpiry] = useState(null); 
  const [vehiclePhoto, setVehiclePhoto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const vehicleTypes = [
    'Private Car',
    'Commercial Vehicle',
    'Three Wheeler',
    'School Bus',
    'PCV',
    'Tractor',
    'Misc D',
    'Two Wheeler',
  ];

  const PolicyTypes = ['Zero Debt', 'Comprehensive', 'TP Only', 'OD Only'];
  const yesNoOptions = ['Yes', 'No'];

  useEffect(() => {
    getUserId();
  }, []);

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        const id = parsedData.l_id || parsedData.id || parsedData.user_id;
        setUserId(id);
        return id;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  const handlePhoneChange = (value) => setPhone(value.replace(/[^0-9]/g, ''));
  const handleNomineeage = (value) => setNomineeage(value.replace(/[^0-9]/g, ''));
 
  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setIsDateSelected(true);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const pickRcPhotos = async () => {
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
        setRcPhoto(response.assets.map((asset) => asset.uri));
      }
    });
  };

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

  const pickVehiclePhotos = async () => {
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
        setVehiclePhoto(response.assets.map((asset) => asset.uri));
      }
    });
  };

  const clearForm = () => {
    // Navigate to AddClient screen
    navigation.navigate('AddClient');
  };

  const prepareFormData = async () => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('t_w_i_name', name);
    formData.append('t_w_i_email', email);
    formData.append('t_w_i_phone', phone);
    formData.append('t_w_i_vehicle_type', vehicleType || '');
    formData.append('t_w_i_policy_type', policyType || '');
    formData.append('t_w_i_registration_date', formatDate(date));
    formData.append('t_w_i_registration_no', registrationNo);
    formData.append('t_w_i_claim', claim || 'No');
    formData.append('t_w_i_old_insurance_expiry_date', oldInsuranceExpiry || 'No');
    formData.append('t_w_i_nominee_name', nomineename);
    formData.append('t_w_i_nominee_age', nomineeage);
    formData.append('t_w_i_nominee_relation', relation);
    formData.append('t_w_i_client_id', exsistingclient);
    formData.append('user_id', userId);

    // Add RC photos
    if (rcPhoto.length > 0) {
      rcPhoto.forEach((uri, index) => {
        const fileType = uri.split('.').pop();
        formData.append('t_w_i_rc', {
          uri: uri,
          name: `rc_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });
    }

    // Add Vehicle photos
    if (vehiclePhoto.length > 0) {
      vehiclePhoto.forEach((uri, index) => {
        const fileType = uri.split('.').pop();
        formData.append('t_w_i_vehicle_photo', {
          uri: uri,
          name: `vehicle_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });
    }

    // Add Aadhaar photo
    if (aadhaarPhoto.length > 0) {
      aadhaarPhoto.forEach((uri, index) => {
        const fileType = uri.split('.').pop();
        formData.append('t_w_i_aadhar_photo', {
          uri: uri,
          name: `aadhar_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });
    }

    // Add PAN photo
    if (panPhoto) {
      const fileType = panPhoto.split('.').pop();
      formData.append('t_w_i_pan_photo', {
        uri: panPhoto,
        name: `pan.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    return formData;
  };

  const handleSubmit = async () => {
    // Validate fields
    if (
      !name ||
      !email ||
      !phone ||
      !vehicleType ||
      !policyType ||
      !registrationNo ||
      !rcPhoto.length ||
      !nomineename ||
      !nomineeage ||
      !relation ||
      !vehiclePhoto.length ||
      !aadhaarPhoto.length ||
      !panPhoto ||
      !userId
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

    try {
      setLoading(true);
      const formData = await prepareFormData();
      console.log('Submitting form data:', formData);

      const response = await fetch('https://taxabide.in/api/add-bike-insurance-new-api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseText = await response.text();
      console.log('API Response:', responseText);
      
      try {
        const responseData = JSON.parse(responseText);
        if (responseData.status === 'success') {
          Alert.alert('Success', 'Two-wheeler insurance submitted successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', responseData.message || 'Failed to submit form. Please try again.');
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        if (responseText.includes('success')) {
          Alert.alert('Success', 'Two-wheeler insurance submitted successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', 'Failed to submit form. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to submit form. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelection = (client) => {
    setSelectedClient(client);
    setExsistingClient(client.name);
    setName(client.name || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    // Optionally set other fields if available in client data
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.heading}>Two Wheeler Insurance (Vehicle)</Text>

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

          {/* Vehicle Type Section */}
          <Text style={styles.label}>Select Vehicle Type*</Text>
          <View style={styles.radioGroup}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() => setVehicleType(type)}
              >
                <View style={styles.outerCircle}>
                  {vehicleType === type && <View style={styles.innerCircle} />}
                </View>
                <Text style={styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Policy Type Section */}
          <Text style={styles.label}>Policy Type*</Text>
          <View style={styles.radioGroup}>
            {PolicyTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() => setPolicyType(type)}
              >
                <View style={styles.outerCircle}>
                  {policyType === type && <View style={styles.innerCircle} />}
                </View>
                <Text style={styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Registration Date*</Text>
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

          <Text style={styles.label}>Registration Number*</Text>
          <TextInput
            style={styles.input}
            value={registrationNo}
            onChangeText={setRegistrationNo}
            placeholder="Enter Your Registration Number"
          />

          <Text style={styles.label}>(RC / Old Insurance)*</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity
              style={styles.chooseFileButton}
              onPress={pickRcPhotos}
            >
              <Text style={styles.chooseFileText}>Choose Files</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>
              {rcPhoto.length > 0
                ? `${rcPhoto.length} file(s) selected`
                : 'No file chosen'}
            </Text>
          </View>

          {rcPhoto.length > 0 &&
            rcPhoto.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: 200, height: 150, marginBottom: 10 }}
              />
            ))}

          {/* Claim Section */}
          <Text style={styles.subtitle}>Claim*</Text>
          <View style={styles.radioGroup}>
            {yesNoOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => setClaim(option)}
              >
                <View style={styles.outerCircle}>
                  {claim === option && <View style={styles.innerCircle} />}
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Old Insurance Expiry Date Section */}
          <Text style={styles.subtitle}>Old Insurance Expiry Date*</Text>
          <View style={styles.radioGroup}>
            {yesNoOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => setOldInsuranceExpiry(option)}
              >
                <View style={styles.outerCircle}>
                  {oldInsuranceExpiry === option && <View style={styles.innerCircle} />}
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nominee Name*</Text>
          <TextInput
            style={styles.input}
            value={nomineename}
            onChangeText={setNomineename}
            placeholder="Nominee Name"
          />

          <Text style={styles.label}>Nominee Age*</Text>
          <TextInput
            style={styles.input}
            value={nomineeage}
            onChangeText={handleNomineeage}
            placeholder="Nominee Age"
            keyboardType="phone-pad"
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

          <Text style={styles.label}>Vehicle Photo*</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity 
              style={styles.chooseFileButton} 
              onPress={pickVehiclePhotos}
            >
              <Text style={styles.chooseFileText}>Choose Files</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>
              {vehiclePhoto.length > 0
                ? `${vehiclePhoto.length} file(s) selected`
                : 'No file chosen'}
            </Text>
          </View>

          {vehiclePhoto.length > 0 &&
            vehiclePhoto.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: 200, height: 150, marginBottom: 10 }}
              />
            ))}

          <Text style={styles.label}>Aadhaar Photos*</Text>
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
            onPress={clearForm}
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
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : 'Submit'}
          </PaperButton>

          <PaperButton
            mode="outlined"
            onPress={() => navigation.navigate('TwoWheelerInsuranceTable')}
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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },

  heading: { fontSize: 18, textAlign: 'center', marginBottom: 25, color: '#000', marginTop: 20 },

  scrollContainer: { flexGrow: 1, paddingBottom: 25 },

  label: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },

  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 9,
    marginBottom: 25,
  },

  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  genderLabel: { marginRight: 20, fontSize: 16, color: '#333' },

  dateInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  inputText: { fontSize: 16, color: '#000' },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    marginBottom: 25,
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
    marginBottom: 25,  
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
    marginTop: 30,
    backgroundColor: '#487FFF',
    borderRadius: 5,
  },

  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 12,
  },

  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,  
  },

  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
    justifyContent: 'space-between', 
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',    
    marginBottom: 15, 
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
    marginRight: 6,
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
});

export default TwoWheelerInsuranceForm; 