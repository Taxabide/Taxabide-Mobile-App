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
  PermissionsAndroid,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button as PaperButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import ProfileNavbar from '../NavBar/ProfileNavbar';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedClient } from '../../../redux/slices/clientsSlice';
import { submitCarInsuranceForm, resetCarInsuranceState } from '../../../redux/slices/carInsuranceSlice';
import ClientListSelector from '../../ClientSelection/ClientListSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CarInsurance = ({ navigation }) => {
  const dispatch = useDispatch();
  const selectedClient = useSelector(selectSelectedClient);
  const { isSubmitting, success, error } = useSelector(state => state.carInsurance);
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
  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');
  const [age, setAge] = useState('');
  const [vehicleType, setVehicleType] = useState(null);
  const [policyType, setPolicyType] = useState(null);
  const [rcPhoto, setRcPhoto] = useState([]);
  const [claim, setClaim] = useState(null);
  const [oldInsuranceExpiry, setOldInsuranceExpiry] = useState(null); 
  const [vehiclePhoto, setVehiclePhoto] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);

  // Effect to populate form when a client is selected
  useEffect(() => {
    if (selectedClient) {
      setName(selectedClient.name || '');
      setEmail(selectedClient.email || '');
      setPhone(selectedClient.phone || '');
      setExsistingClient(selectedClient.name || '');
      
      // Optionally set other fields if they're available in client data
      setGender(selectedClient.gender || '');
      setAge(selectedClient.age?.toString() || '');
      setPan(selectedClient.pan || '');
      setAadhar(selectedClient.aadhar || '');
    }
  }, [selectedClient]);

  // Effect to handle form submission response
  useEffect(() => {
    if (success) {
      Alert.alert(
        'Success',
        'Car insurance form submitted successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              clearForm();
              dispatch(resetCarInsuranceState());
              navigation.goBack();
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

  const handleClientSelection = (client) => {
    // This will be called when a client is selected from the modal
    setExsistingClient(client.name);
    // No need to manually update other fields, the useEffect will handle it
  };

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

  const handlePhoneChange = (value) => setPhone(value.replace(/[^0-9]/g, ''));
  const handleNomineeage = (value) => setNomineeage(value.replace(/[^0-9]/g, ''));
 
  const onChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setIsDateSelected(true);
    }
  };

  // Permission request for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API level 33+)
        if (parseInt(Platform.Version) >= 33) {
          // Check if the READ_MEDIA_IMAGES permission is available
          const permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
          if (permission) {
            const granted = await PermissionsAndroid.request(
              permission,
              {
                title: "Photos Permission",
                message: "Taxabide needs access to your photos",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          }
          // Fall back to READ_EXTERNAL_STORAGE if READ_MEDIA_IMAGES isn't available
          return await requestLegacyStoragePermission();
        }
        // For Android 10+ to 12 (API level 29-32)
        else if (parseInt(Platform.Version) >= 29) {
          return await requestLegacyStoragePermission();
        }
        // For older Android versions
        else {
          return await requestLegacyStoragePermission();
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        Alert.alert('Permission Error', 'Unable to request storage permissions');
        return false;
      }
    } else {
      return true; // iOS doesn't need this permission
    }
  };

  // Helper function for legacy storage permission
  const requestLegacyStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "Taxabide needs access to your storage",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        console.log('Storage permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const pickRcPhotos = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'To upload photos, please allow Taxabide to access your photos in the app settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openAppSettings() }
        ]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      selectionLimit: 0, // 0 means unlimited
      includeBase64: false,
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      } 
      
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setRcPhoto(response.assets.map(asset => asset.uri));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Something went wrong when picking images');
    }
  };

  const pickAadhaarPhotos = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'To upload photos, please allow Taxabide to access your photos in the app settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openAppSettings() }
        ]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      selectionLimit: 0, // 0 means unlimited
      includeBase64: false,
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      } 
      
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setAadhaarPhoto(response.assets.map(asset => asset.uri));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Something went wrong when picking images');
    }
  };

  const pickPanPhoto = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'To upload photos, please allow Taxabide to access your photos in the app settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openAppSettings() }
        ]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      } 
      
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setPanPhoto(response.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Something went wrong when picking images');
    }
  };

  const pickVehiclePhotos = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'To upload photos, please allow Taxabide to access your photos in the app settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openAppSettings() }
        ]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      selectionLimit: 0, // 0 means unlimited
      includeBase64: false,
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      } 
      
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setVehiclePhoto(response.assets.map(asset => asset.uri));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Something went wrong when picking images');
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setGender('');
    setRelation('');
    setDate(new Date());
    setIsDateSelected(false);
    setShowPicker(false);
    setNomineename('');
    setNomineeage('');
    setAadhaarPhoto([]);
    setPanPhoto(null);
    setRcPhoto([]);
    setExsistingClient('');
    setAadhar('');
    setPan('');
    setAge('');
    setVehicleType(null);
    setPolicyType(null);
    setVehiclePhoto([]);
    setClaim(null);
    setOldInsuranceExpiry(null);
  };

  const handleAddNewClient = () => {
    navigation.navigate('AddClient');
  };

  const handleSubmit = () => {
    if (
      !name ||
      !email ||
      !phone ||
      !gender ||
      !age ||
      !aadhar ||
      !pan ||
      !vehicleType ||
      !exsistingclient ||
      !panPhoto ||
      !aadhaarPhoto.length ||
      !vehiclePhoto.length ||
      !nomineeage ||
      !nomineename ||
      !relation ||
      !policyType ||
      !claim
    ) {
      Alert.alert('Error', 'Please fill in all required fields, including Vehicle Type and upload RC photos.');
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

    // Prepare form data for submission
    const formDataForSubmission = {
      name: name,
      email: email,
      phone: phone,
      gender: gender,
      vehicleType: vehicleType,
      policyType: policyType,
      registrationDate: isDateSelected ? date.toISOString().split('T')[0] : '',
      registrationNumber: aadhar,
      rcPhotos: rcPhoto,
      claim: claim,
      oldInsuranceExpiry: oldInsuranceExpiry,
      nomineeName: nomineename,
      nomineeAge: nomineeage,
      nomineeRelation: relation,
      vehiclePhotos: vehiclePhoto,
      aadhaarPhotos: aadhaarPhoto,
      panPhoto: panPhoto,
      clientId: selectedClient?.c_id || selectedClient?.id || '',
      age: age
    };

    console.log("Submitting form data:", formDataForSubmission);
    
    // Dispatch the form submission action
    dispatch(submitCarInsuranceForm(formDataForSubmission));
  };

  // Helper function to open app settings
  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Update the Submit button to show loading state during submission
  const renderSubmitButton = () => (
    <PaperButton
      mode="contained"
      onPress={handleSubmit}
      style={styles.submitButton}
      labelStyle={{ color: '#fff', fontSize: 16 }}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontSize: 16 }}>Submitting...</Text>
        </View>
      ) : (
        'Submit'
      )}
    </PaperButton>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileNavbar title="Car Insurance" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.heading}>Car Insurance</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
          />

          <Text style={styles.label}>Your Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your Email"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />

          {/* Gender Selection */}
          <Text style={styles.label}>Gender</Text>
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

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Age"
            keyboardType="numeric"
            maxLength={3}
          />

          {/* Vehicle Type Section */}
          <Text style={styles.label}>Select Vehicle Type</Text>
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
          <Text style={styles.label}>Policy Type</Text>
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

          <Text style={styles.label}>Registration Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.inputText}>
              {isDateSelected ? date.toLocaleDateString() : 'Select Date'}
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

          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            value={aadhar}
            onChangeText={setAadhar}
            placeholder="Enter Your Registration Number"
          />

          <Text style={styles.label}>PAN Number</Text>
          <TextInput
            style={styles.input}
            value={pan}
            onChangeText={setPan}
            placeholder="Enter Your PAN Number"
          />

          <Text style={styles.label}>(RC / Old Insurance) </Text>
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
          <Text style={styles.subtitle}>Claim</Text>
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
          <Text style={styles.subtitle}>Old Insurance Expiry Date</Text>
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

          <Text style={styles.label}>Nominee Name</Text>
          <TextInput
            style={styles.input}
            value={nomineename}
            onChangeText={setNomineename}
            placeholder="Nominee Name"
          />

          <Text style={styles.label}>Nominee Age</Text>
          <TextInput
            style={styles.input}
            value={nomineeage}
            onChangeText={handleNomineeage}
            placeholder="Nominee Age"
            keyboardType="phone-pad"
            maxLength={3}
          />

          <Text style={styles.label}>Nominee Relation</Text>
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

          <Text style={styles.label}>Vehicle Photo</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity style={styles.chooseFileButton} onPress={pickVehiclePhotos}>
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

          <Text style={styles.label}> Aadhaar Photos </Text>
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

          <Text style={styles.label}> PAN Photo</Text>
          <View style={styles.fileInputContainer}>
            <TouchableOpacity style={styles.chooseFileButton} onPress={pickPanPhoto}>
              <Text style={styles.chooseFileText}>Choose File</Text>
            </TouchableOpacity>
            <Text style={styles.fileNameText}>{panPhoto ? 'File Selected' : 'No file chosen'}</Text>
          </View>
          {panPhoto && <Image source={{ uri: panPhoto }} style={{ width: 200, height: 150, marginBottom: 20 }} />}

          <Text style={styles.label}>Choose Existing Client</Text>
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
            onPress={handleAddNewClient}
            style={[styles.submitButton, { backgroundColor: '#0D6EFD', borderColor: '#0D6EFD', marginBottom: 10 }]}
            labelStyle={{ color: '#ffffff', fontSize: 16 }}
          >
            Add Client
          </PaperButton>

          {renderSubmitButton()}

          <PaperButton
            mode="outlined"
            onPress={() => navigation.navigate('CarInsuranceTable')}
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

export default CarInsurance; 