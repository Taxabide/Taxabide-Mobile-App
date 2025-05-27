import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

const CompanyBusinessLoan = ({ navigation }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [tenure, setTenure] = useState('12');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [employmentType, setEmploymentType] = useState('Salaried');
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [residencePincode, setResidencePincode] = useState('');
  const [pincode, setPincode] = useState('');

  // Document states
  const [documents, setDocuments] = useState({
    panImage: { uri: null, name: '' },
    bankStatement3Single: { uri: null, name: '' },
    bankStatement3Multiple: [],
    bankStatement6Single: { uri: null, name: '' },
    bankStatement6Multiple: [],
    canclecheque: { uri: null, name: '' },
    itr2Years: { uri: null, name: '' },
    itr3Years: { uri: null, name: '' },
    gst: { uri: null, name: '' },
    tradelicense: { uri: null, name: '' },
    shopAct: { uri: null, name: '' },
    ghumasta: { uri: null, name: '' },
    msme: { uri: null, name: '' },
    labourLicense: { uri: null, name: '' },
    panchayatiLicense: { uri: null, name: '' },
    brnNumber: { uri: null, name: '' },
    pasaraLicense: { uri: null, name: '' },
    fassaiLicense: { uri: null, name: '' },
    drugLicence: { uri: null, name: '' },
    bankStatement12SecondarySingle: { uri: null, name: '' },
    bankStatement12SecondaryMultiple: [],
    aoaDocuments: { uri: null, name: '' },
    moaDocuments: { uri: null, name: '' },
    llpDocument: { uri: null, name: '' },
    deedDocument: { uri: null, name: '' },
    partnerpan1: { uri: null, name: '' },
    partnerpan2: { uri: null, name: '' },
    partnerpan3: { uri: null, name: '' },
    partnerAadhar1: { uri: null, name: '' },
    partnerAadhar2: { uri: null, name: '' },
    partnerAadhar3: { uri: null, name: '' },
  });

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Pick image using react-native-image-picker
  const pickImage = async (documentKey, allowMultiple = false) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: allowMultiple ? 0 : 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.error) {
        Alert.alert('Error', 'Failed to pick image');
        return;
      }

      if (response.assets) {
        if (allowMultiple) {
          const newFiles = response.assets.map(asset => ({
            uri: asset.uri,
            name: asset.fileName || 'image.jpg',
          }));
          setDocuments(prev => ({
            ...prev,
            [documentKey]: [...(prev[documentKey] || []), ...newFiles],
          }));
        } else {
          const asset = response.assets[0];
          setDocuments(prev => ({
            ...prev,
            [documentKey]: {
              uri: asset.uri,
              name: asset.fileName || 'image.jpg',
            },
          }));
        }
      }
    });
  };

  // Pick document using react-native-document-picker
  const pickDocument = async (documentKey, allowMultiple = false) => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: allowMultiple,
      });

      if (allowMultiple) {
        const newFiles = results.map(result => ({
          uri: result.uri,
          name: result.name,
        }));
        setDocuments(prev => ({
          ...prev,
          [documentKey]: [...(prev[documentKey] || []), ...newFiles],
        }));
      } else {
        const result = results[0];
        setDocuments(prev => ({
          ...prev,
          [documentKey]: {
            uri: result.uri,
            name: result.name,
          },
        }));
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  // File picker function
  const pickFile = (documentKey, allowMultiple = false) => {
    Alert.alert(
      'Select File Type',
      'Choose the type of file you want to upload',
      [
        {
          text: 'Image',
          onPress: () => pickImage(documentKey, allowMultiple),
        },
        {
          text: 'Document',
          onPress: () => pickDocument(documentKey, allowMultiple),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Remove file function
  const removeFile = (documentKey, index = null) => {
    setDocuments(prev => {
      if (index !== null) {
        const newArray = [...prev[documentKey]];
        newArray.splice(index, 1);
        return { ...prev, [documentKey]: newArray };
      } else {
        return { ...prev, [documentKey]: { uri: null, name: '' } };
      }
    });
  };

  // Render file input component
  const renderFileInput = (label, documentKey, allowMultiple = false, mandatory = false) => {
    const doc = documents[documentKey];
    const hasFile = allowMultiple ? doc && doc.length > 0 : doc && doc.uri;
    const displayText = allowMultiple 
      ? (doc && doc.length > 0 ? `${doc.length} file(s) selected` : 'No files chosen')
      : (doc && doc.name ? doc.name : 'No file chosen');

    return (
      <View style={styles.fileInputContainer}>
        <Text style={styles.uploadLabel}>
          {label} {mandatory && <Text style={{ color: 'red' }}>*</Text>}
        </Text>
        
        <TouchableOpacity
          onPress={() => pickFile(documentKey, allowMultiple)}
          style={styles.fileInputButton}
        >
          <Text style={styles.fileInputButtonText}>
            {hasFile ? 'Change File' : 'Choose file'}
          </Text>
          {!hasFile && <View style={styles.verticalLine} />}
          <Text style={styles.noFileText}>{displayText}</Text>
        </TouchableOpacity>

        {/* Show preview for single files */}
        {!allowMultiple && doc && doc.uri && (
          <View style={styles.previewContainer}>
            {doc.uri.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? (
              <Image source={{ uri: doc.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.documentPreview}>
                <Text style={styles.documentPreviewText}>📄 {doc.name}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => removeFile(documentKey)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show preview for multiple files */}
        {allowMultiple && doc && doc.length > 0 && (
          <View style={styles.multipleFilesContainer}>
            {doc.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileItemText}>{file.name}</Text>
                <TouchableOpacity
                  onPress={() => removeFile(documentKey, index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Form validation
  const validateForm = () => {
    if (!loanAmount || !firstName || !lastName || !mobile || !email || !pan || 
        !residencePincode || !pincode || !companyName || !companyType) {
      Alert.alert('Error', 'Please fill all mandatory fields');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      // Add your submission logic here
      Alert.alert('Success', 'Application submitted successfully!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Business Loan</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Loan Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          
          <Text style={styles.label}>Loan Amount *</Text>
          <TextInput
            style={styles.input}
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
            placeholder="Enter loan amount"
          />

          <Text style={styles.label}>Tenure (Months) *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tenure}
              onValueChange={setTenure}
              style={styles.picker}
            >
              {[...Array(30)].map((_, i) => {
                const months = (i + 1) * 12;
                return (
                  <Picker.Item key={months} label={`${months} Months`} value={`${months}`} />
                );
              })}
            </Picker>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
          />

          <Text style={styles.label}>Middle Name</Text>
          <TextInput
            style={styles.input}
            value={middleName}
            onChangeText={setMiddleName}
            placeholder="Enter middle name"
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="numeric"
            maxLength={10}
            placeholder="Enter 10-digit mobile number"
          />

          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity onPress={() => setShowDobPicker(true)}>
            <TextInput
              style={styles.input}
              value={dob ? formatDate(dob) : ''}
              placeholder="DD/MM/YYYY"
              editable={false}
            />
          </TouchableOpacity>
          {showDobPicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDobPicker(false);
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email address"
          />

          <Text style={styles.label}>PAN Number *</Text>
          <TextInput
            style={styles.input}
            value={pan}
            onChangeText={setPan}
            placeholder="Enter PAN number"
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>

        {/* Company Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Details</Text>

          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter company name"
          />

          <Text style={styles.label}>Company Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={companyType}
              onValueChange={setCompanyType}
              style={styles.picker}
            >
              <Picker.Item label="Select Company Type" value="" />
              <Picker.Item label="Private Limited Company" value="Private" />
              <Picker.Item label="One Person Company" value="OnePerson" />
              <Picker.Item label="Public Limited Company" value="PublicLimited" />
              <Picker.Item label="Joint-Venture Company" value="JointVenture" />
              <Picker.Item label="Partnership Firm" value="PartnershipFirm" />
              <Picker.Item label="Sole Proprietorship" value="SoleProprietorship" />
              <Picker.Item label="Branch Office" value="BranchOffice" />
              <Picker.Item label="Non-Government Organization(NGO)" value="NGO" />
            </Picker>
          </View>

          <Text style={styles.label}>Annual Income *</Text>
          <TextInput
            style={styles.input}
            value={annualIncome}
            onChangeText={setAnnualIncome}
            keyboardType="numeric"
            placeholder="Enter annual income"
          />

          <Text style={styles.label}>Residence Pin Code *</Text>
          <TextInput
            style={styles.input}
            value={residencePincode}
            onChangeText={setResidencePincode}
            keyboardType="numeric"
            maxLength={6}
            placeholder="Enter residence pin code"
          />

          <Text style={styles.label}>Business Pin Code *</Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            maxLength={6}
            placeholder="Enter business pin code"
          />
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          
          {/* KYC Documents */}
          <View style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>KYC Documents</Text>
            {renderFileInput('PAN Card *', 'panImage', false, true)}
          </View>

          {/* Bank Statements */}
          <View style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>Bank Statements</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Bank statements reflect monthly expenses and net savings, helping banks evaluate financial discipline.
              </Text>
            </View>
            {renderFileInput('Last 3 Months Bank Statement', 'bankStatement3Single')}
            {renderFileInput('Last 3 Months Bank Statement (Multiple Files)', 'bankStatement3Multiple', true)}
            {renderFileInput('Last 6 Months Bank Statement', 'bankStatement6Single')}
            {renderFileInput('Last 6 Months Bank Statement (Multiple Files)', 'bankStatement6Multiple', true)}
          </View>

          {/* Business Documents */}
          <View style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>Business Documents</Text>
            {renderFileInput('GST Certificate', 'gst')}
            {renderFileInput('Trade License', 'tradelicense')}
            {renderFileInput('Shop Act License', 'shopAct')}
            {renderFileInput('MSME Certificate', 'msme')}
            {renderFileInput('Labour License', 'labourLicense')}
          </View>

          {/* Incorporation Documents */}
          <View style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>Incorporation Documents</Text>
            {renderFileInput('AOA (Articles of Association)', 'aoaDocuments')}
            {renderFileInput('MOA (Memorandum of Association)', 'moaDocuments')}
            {renderFileInput('LLP Agreement', 'llpDocument')}
            {renderFileInput('Partnership Deed', 'deedDocument')}
          </View>

          {/* Director/Partner KYC */}
          <View style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>Director/Partner KYC</Text>
            {renderFileInput('Director/Partner 1 PAN Card', 'partnerpan1')}
            {renderFileInput('Director/Partner 1 Aadhaar Card', 'partnerAadhar1')}
            {renderFileInput('Director/Partner 2 PAN Card', 'partnerpan2')}
            {renderFileInput('Director/Partner 2 Aadhaar Card', 'partnerAadhar2')}
            {renderFileInput('Director/Partner 3 PAN Card', 'partnerpan3')}
            {renderFileInput('Director/Partner 3 Aadhaar Card', 'partnerAadhar3')}
          </View>

          {/* Additional Documents */}
          <View style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>Additional Documents</Text>
            {renderFileInput('Cancelled Cheque', 'canclecheque')}
            {renderFileInput('ITR - 2 Years', 'itr2Years')}
            {renderFileInput('ITR - 3 Years', 'itr3Years')}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Application</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  fileInputContainer: {
    marginBottom: 16,
  },
  fileInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
  },
  fileInputButtonText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  verticalLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  noFileText: {
    color: '#757575',
    flex: 1,
  },
  previewContainer: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentPreview: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentPreviewText: {
    fontSize: 14,
    color: '#333333',
  },
  removeButton: {
    backgroundColor: '#FF5252',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2E183B',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  documentGroup: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#795548',
    lineHeight: 20,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
});

export default CompanyBusinessLoan; 