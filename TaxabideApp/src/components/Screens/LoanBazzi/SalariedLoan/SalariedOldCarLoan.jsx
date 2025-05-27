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
  SafeAreaView,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SalariedOldCarLoan({ navigation }) {
  // Basic Information State
  const [formData, setFormData] = useState({
    loanAmount: '',
    tenure: '12',
    firstName: '',
    middleName: '',
    lastName: '',
    mobile: '',
    dob: null,
    email: '',
    pan: '',
    employmentType: 'Salaried',
    companyName: '',
    companyType: '',
    annualIncome: '',
    residencePincode: '',
    pincode: '',
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  
  // Document states
const [documents, setDocuments] = useState({
    aadhaarFront: { uri: null, name: '' },
    aadhaarBack: { uri: null, name: '' },
    eAadhaar: { uri: null, name: '' },
    panImage: { uri: null, name: '' },
    photo: { uri: null, name: '' },
    salarySlip3Single: { uri: null, name: '' },
    salarySlip6Single: { uri: null, name: '' },
    salarySlip3Multiple: [],
    salarySlip6Multiple: [],
    bankStatement3Single: { uri: null, name: '' },
    bankStatement3Multiple: [],
    bankStatement6Single: { uri: null, name: '' },
    bankStatement6Multiple: [],
    form16: { uri: null, name: '' },
    form26AS: { uri: null, name: '' },
    employmentcertificatefromthecurrentemployer: { uri: null, name: '' },
    Appointmentletterfromthecurrentemployer: { uri: null, name: '' },
    certificateofexperience: { uri: null, name: '' },
    foreclosureLetter: { uri: null, name: '' },
    soaDocument: { uri: null, name: '' },
    canclecheque: { uri: null, name: '' },
    serviceCertificate: { uri: null, name: '' },
    voterID: { uri: null, name: '' },
    drivingLicense: { uri: null, name: '' },
    passport: { uri: null, name: '' },
    nregaCard: { uri: null, name: '' },
    itr1Years: { uri: null, name: '' },
    itr2Years: { uri: null, name: '' },
    itr3Years: { uri: null, name: '' },
    itr1YearsWith: { uri: null, name: '' },
    itr2YearsWith: { uri: null, name: '' },
    itr3YearsWith: { uri: null, name: '' },
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
    bankStatement6SecondarySingle: { uri: null, name: '' },
    bankStatement6SecondaryMultiple: [],
    bankStatement12SecondarySingle: { uri: null, name: '' },
    bankStatement12SecondaryMultiple: [],
    bankStatement3MonthsSecondarybank: { uri: null, name: '' },
    bankStatement6MonthofSecondarybanks: [],
    bankStatement3halfofSecondarybanks: { uri: null, name: '' },
    dealerQuotation: { uri: null, name: '' },
    performaInvoice: { uri: null, name: '' },
  });

  const formatDate = (date) => (date ? date.toLocaleDateString('en-GB') : '');

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Universal file picker that handles both images and documents
  const pickFile = async (documentKey, allowMultiple = false) => {
    try {
      Alert.alert(
        'Select File Type',
        'Choose the type of file you want to upload',
        [
          {
            text: 'Image',
            onPress: () => pickImageFile(documentKey, allowMultiple),
          },
          {
            text: 'Document',
            onPress: () => pickDocumentFile(documentKey, allowMultiple),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error in pickFile:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  // Pick image files using react-native-image-picker
  const pickImageFile = async (documentKey, allowMultiple = false) => {
    try {
      const options = {
        mediaType: 'photo',
        selectionLimit: allowMultiple ? 0 : 1,
        includeBase64: false,
      };

      const result = await launchImageLibrary(options);
      
      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        if (allowMultiple) {
          const newFiles = result.assets.map(asset => ({
            uri: asset.uri,
            name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg',
          }));
          
          setDocuments(prev => ({
            ...prev,
            [documentKey]: [...(prev[documentKey] || []), ...newFiles],
          }));
        } else {
          const asset = result.assets[0];
          setDocuments(prev => ({
            ...prev,
            [documentKey]: { 
              uri: asset.uri, 
              name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg'
            },
          }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Pick document files using react-native-document-picker
  const pickDocumentFile = async (documentKey, allowMultiple = false) => {
    try {
      const pickerResult = await DocumentPicker.pick({
        allowMultiSelection: allowMultiple,
        type: [DocumentPicker.types.allFiles],
      });

      const results = Array.isArray(pickerResult) ? pickerResult : [pickerResult];

        if (allowMultiple) {
        const newFiles = results.map(file => ({
            uri: file.uri,
            name: file.name || file.uri.split('/').pop() || 'document',
          }));
          
          setDocuments(prev => ({
            ...prev,
          [documentKey]: [...(prev[documentKey] || []), ...newFiles],
          }));
        } else {
        const file = results[0];
          setDocuments(prev => ({
            ...prev,
            [documentKey]: { 
              uri: file.uri, 
              name: file.name || file.uri.split('/').pop() || 'document' 
            },
          }));
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
      }
    }
  };

  // Remove file function
  const removeFile = (documentKey, index = null) => {
    setDocuments(prev => {
      if (index !== null) {
        // Remove from array
        const newArray = [...prev[documentKey]];
        newArray.splice(index, 1);
        return { ...prev, [documentKey]: newArray };
      } else {
        // Remove single file
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
      <View style={{ marginBottom: 15 }}>
        <Text style={styles.uploadLabel}>
          {label} {mandatory && <Text style={{ color: 'red' }}>*</Text>}
        </Text>
        <View style={{ marginBottom: 10 }} />
        
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
            {doc.uri.toLowerCase().includes('.jpg') || 
             doc.uri.toLowerCase().includes('.jpeg') || 
             doc.uri.toLowerCase().includes('.png') ? (
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
    const { loanAmount, firstName, lastName, mobile, dob, email, pan, residencePincode, pincode } = formData;
    
  if (!loanAmount.trim() || !firstName.trim() || !lastName.trim() || 
      !mobile.trim() || !dob || !email.trim() || !pan.trim() || 
      !residencePincode.trim() || !pincode.trim()) {
      Alert.alert('Error', 'Please fill all mandatory fields');
    return false;
  }
  
  if (!documents.panImage.uri || !documents.photo.uri || 
        !documents.aadhaarFront.uri || !documents.aadhaarBack.uri ||
        !documents.vehicleRegistration.uri || !documents.vehicleInsurance.uri) {
      Alert.alert('Error', 'Please upload all mandatory documents');
    return false;
  }
  
  return true;
};

  // Submit handler
const handleSubmit = () => {
  if (validateForm()) {
    Alert.alert(
      'Success',
      'Application submitted successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Old Car Loan Application</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.formContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>LOANBAZZI</Text>
        <View style={styles.userInfo} />
      </View>

      {/* Form Card */}
      <View style={styles.formCard}>
              <Text style={styles.title}>Old Car Loan (New)</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Fill Loan Application</Text>
        </View>

              {/* Basic Information */}
        <Text style={styles.label}>Loan Amount *</Text>
        <TextInput
          style={styles.input}
          placeholder="Loan amount"
          keyboardType="numeric"
                value={formData.loanAmount}
                onChangeText={(value) => handleInputChange('loanAmount', value)}
        />

        {/* Tenure */}
        <Text style={styles.label}>Tenure (Months)</Text>
        <View style={styles.pickerContainer}>
          <Picker
                  selectedValue={formData.tenure}
                  onValueChange={(value) => handleInputChange('tenure', value)}
            mode="dropdown"
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

              {/* Personal Information */}
        <Text style={styles.label}>First Name*</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
        />

        <Text style={styles.label}>Middle Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Middle Name"
                value={formData.middleName}
                onChangeText={(value) => handleInputChange('middleName', value)}
        />

        <Text style={styles.label}>Last Name*</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
        />

        {/* Mobile */}
        <Text style={styles.label}>Mobile Number*</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit Mobile Number"
          keyboardType="numeric"
          maxLength={10}
                value={formData.mobile}
                onChangeText={(value) => handleInputChange('mobile', value)}
        />

        {/* DOB */}
        <Text style={styles.label}>Date of Birth (DOB)*</Text>
        <TouchableOpacity onPress={() => setShowDobPicker(true)}>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/yyyy"
                  value={formData.dob ? formatDate(formData.dob) : ''}
            editable={false}
          />
        </TouchableOpacity>
        {showDobPicker && (
          <DateTimePicker
                  value={formData.dob || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDobPicker(false);
                    if (selectedDate) handleInputChange('dob', selectedDate);
            }}
          />
        )}

        {/* Email */}
        <Text style={styles.label}>Email Id Personal*</Text>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          keyboardType="email-address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
        />

        {/* PAN */}
        <Text style={styles.label}>PAN*</Text>
        <TextInput
          style={styles.input}
          placeholder="PAN Number (e.g., ABCDE1234F)"
          maxLength={10}
          autoCapitalize="characters"
                value={formData.pan}
                onChangeText={(value) => handleInputChange('pan', value)}
        />

        {/* Employment Type */}
              <Text style={styles.label}>Employment Type*</Text>
        <View style={styles.pickerContainer}>
          <Picker
                  selectedValue={formData.employmentType}
                  onValueChange={(value) => handleInputChange('employmentType', value)}
            style={styles.picker}
          >
            <Picker.Item label="Salaried" value="Salaried" />
          </Picker>
        </View>

              {/* Company Details */}
              <Text style={styles.label}>Company Name*</Text>
        <TextInput
          style={styles.input}
          placeholder="Company Name"
                value={formData.companyName}
                onChangeText={(value) => handleInputChange('companyName', value)}
        />

              <Text style={styles.label}>Company Type*</Text>
        <View style={styles.pickerContainer}>
          <Picker
                  selectedValue={formData.companyType}
                  onValueChange={(value) => handleInputChange('companyType', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select" value="" />
            <Picker.Item label="Private Limited Company" value="Private" />
            <Picker.Item label="One Person Company" value="OnePerson" />
            <Picker.Item label="Public Limited Company" value="PublicLimited" />
            <Picker.Item label="Joint-Venture Company" value="JointVenture" />
            <Picker.Item label="Partnership Firm" value="PartnershipFirm" />
            <Picker.Item label="Sole Proprietorship" value="Sole Proprietorship" />
            <Picker.Item label="Branch Office" value="Branch Office" />
            <Picker.Item label="Non-Government Organization(NGO)" value="NGO" />
          </Picker>
        </View>

        {/* Annual Income */}
        <Text style={styles.label}>Annual Income/Monthly Salary </Text>
        <TextInput
          style={styles.input}
          placeholder="Annual Income / Monthly Salary"
          keyboardType="numeric"
                value={formData.annualIncome}
                onChangeText={(value) => handleInputChange('annualIncome', value)}
        />

        {/* Residence Pin Code */}
        <Text style={styles.label}>Residence Pin Code*</Text>
        <TextInput
          style={styles.input}
          placeholder="Residence Pin Code"
          keyboardType="numeric"
                value={formData.residencePincode}
                onChangeText={(value) => handleInputChange('residencePincode', value)}
          maxLength={6}
        />

        {/* Pin Code */}
        <Text style={styles.label}>Pin Code*</Text>
        <TextInput
          style={styles.input}
          placeholder="Pin Code"
          keyboardType="numeric"
                value={formData.pincode}
                onChangeText={(value) => handleInputChange('pincode', value)}
          maxLength={6}
        />

        {/* Documents Section */}
        <View style={{ marginTop: 30 }}>
                <Text style={styles.sectionTitle}>Available Documents</Text>
          
          {/* PAN Card */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>Pan Card</Text>
            <View style={styles.mandatoryLabel}>
              <Text style={styles.mandatoryText}>Mandatory</Text>
            </View>
            {renderFileInput('PAN Card', 'panImage', false, true)}
          </View>

          {/* Photo */}
          <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>Photo </Text>
            <View style={styles.photoDescBox}>
              <Text style={styles.photoDescText}>
                Passport size latest color photograph, पासपोर्ट साइज नवीनतम रंगीन फोटो
              </Text>
            </View>
            {renderFileInput('Photo', 'photo', false, true)}
          </View>

          {/* Aadhaar Card */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>Aadhaar Card (mandatory)</Text>
            <View style={styles.aadhaarDescBox}>
              <Text style={styles.aadhaarDescText}>
                An Aadhaar Card is mandatory. All documents must be clear and legible.
                आधार कार्ड अनिवार्य है. सभी प्रयोग रंगीन और सुपाठ्य होने चाहिए।
              </Text>
            </View>
            {renderFileInput('Aadhaar Card (Front)', 'aadhaarFront', false, true)}
            {renderFileInput('Aadhaar Card (Back)', 'aadhaarBack', false, true)}
            {renderFileInput('e-Aadhaar', 'eAadhaar')}
            </View>

          {/* Bank Statements Section */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>Bank Statements Monthly/Yearly (Main Bank)</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Bank statements reflect the monthly expenses and the net savings, thereby helping the banks to have a
                general idea about the financial discipline of the applicant. Based on this evaluation banks make sure if the
                applicant is creditworthy or not.
              </Text>
              <Text style={styles.infoTextHindi}>
                बैंक स्टेटमेंट मासिक खर्चों और शुद्ध बचत को दर्शाते हैं, जिससे बैंकों को आवेदक के वित्तीय अनुशासन के बारे में सामान्य विचार
                रखने में मदद मिलती है। इस मूल्यांकन के आधार पर बैंक यह सुनिश्चित करते हैं कि आवेदक क्रेडिट योग्य है या नहीं।
              </Text>
            </View>
                  {renderFileInput('Bank Statement for 12 months (single file)', 'bankStatement3Single')}
                  {renderFileInput('Bank Statement for 12 months (multiple file)', 'bankStatement3Multiple', true)}
            {renderFileInput('Bank Statement for 6 months (single file)', 'bankStatement6Single')}
            {renderFileInput('Bank Statement for 6 months (multiple file)', 'bankStatement6Multiple', true)}
          </View>

                {/* Bank Statements in 3 months Section */}
                <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>Bank Statements in 3 Months Batch (Main Bank)</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Bank statements reflect the monthly expenses and the net savings, thereby helping the banks to have a general idea about the financial discipline of the applicant. 
                      Based on this evaluation banks make sure if the applicant is creditworthy or not.
                    </Text>
                    <Text style={styles.infoTextHindi}>
                      बैंक स्टेटमेंट मासिक खर्चों और शुद्ध बचत को दर्शाते हैं, जिससे बैंकों को आवेदक के वित्तीय अनुशासन के बारे में सामान्य विचार रखने में मदद मिलती है।
                      इस मूल्यांकन के आधार पर बैंक यह सुनिश्चित करते हैं कि आवेदक क्रेडिट योग्य है या नहीं।
                    </Text>
                  </View>
                  {renderFileInput('Bank Statement in 3 Months Batch for 1 year', 'bankStatement3Months')}
                  {renderFileInput('Bank Statement in 6 Months Batch for 1 year', 'bankStatement6Months', true)}
                  {renderFileInput('Bank Statement in 3 Months Batch for half year', 'bankStatement3half')}
                </View>

                {/* Business Ownership Proof */}
                <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>Business Ownership Proof</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Proof of business ownership is often required to prove that a sole operator has ownership of a business. 
                      There are a few ways to prove business ownership through the use of business documents and tax forms.
                    </Text>
                    <Text style={styles.infoTextHindi}>
                      व्यवसाय के स्वामित्व का प्रमाण अक्सर यह साबित करने के लिए आवश्यक होता है कि एकमात्र ऑपरेटर के पास व्यवसाय का स्वामित्व है। 
                      व्यावसायिक दस्तावेजों और कर रूपों के उपयोग के माध्यम से व्यवसाय के स्वामित्व को साबित करने के कुछ तरीके हैं।
                    </Text>
                  </View>
                  {renderFileInput('GST Certificate', 'gst')}
                  {renderFileInput('Trade License', 'tradelicense')}
                  {renderFileInput('Shop Act License', 'shopAct')}
                  {renderFileInput('Ghumasta Certificate', 'ghumasta')}
                  {renderFileInput('MSME Certificate', 'msme')}
                  {renderFileInput('Labour License', 'labourLicense')}
                  {renderFileInput('Panchayati online License', 'panchayatiLicense')}
                  {renderFileInput('BRN Number Certificate', 'brnNumber')}
                  {renderFileInput('PASARA License', 'pasaraLicense')}
                  {renderFileInput('FASSAI / FOSCOS License', 'fassaiLicense')}
                  {renderFileInput('Drug Licence', 'drugLicence')}
                </View>

          {/* Current/Past Loan Documents Section */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>Current/Past Loan Documents</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                      These documents are required only when the applicant demands the balance transfer and Top-up or in many cases, 
                      Banks and NBFCs demand these documents for processing the loan or for judging the eligibility of the applicant.
              </Text>
              <Text style={styles.infoTextHindi}>
                      इन दस्तावेजों की आवश्यकता केवल तभी होती है जब आवेदक बैलेंस ट्रांसफर और टॉप-अप की मांग करता है या कई मामलों में, 
                      बैंक और एनबीएफसी ऋण की प्रक्रिया के लिए या आवेदक की पात्रता का आकलन करने के लिए इन दस्तावेजों की मांग करते हैं।
              </Text>
            </View>
            {renderFileInput('Foreclosure Letter (only in Balance Transfer Case)', 'foreclosureLetter')}
            {renderFileInput('SOA (only in Top-up case)', 'soaDocument')}
          </View>

          {/* ITR without Balance sheet and P/L */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>ITR without Balance sheet and P/L</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                The gap between the returns should be more than 6 months and when returns are filed on the same day 
                or with a time gap of less than 6 months, they have to face negative remarks in their loan procedure.
              </Text>
              <Text style={styles.infoTextHindi}>
                रिटर्न के बीच का अंतर 6 महीने से अधिक होना चाहिए और जब रिटर्न उसी दिन या 6 महीने से कम के समय अंतराल के साथ दाखिल किया जाता है, 
                तो उन्हें अपनी ऋण प्रक्रिया में नकारात्मक टिप्पणियों का सामना करना पड़ता है।
              </Text>
            </View>
                  {renderFileInput('ITR without Balance Sheet and Profit and Loss Statement (1 years)', 'itr1Years')}
                  {renderFileInput('ITR without Balance Sheet and Profit and Loss Statement (2 years)', 'itr2Years')}
                  {renderFileInput('ITR without Balance Sheet and Profit and Loss Statement(3 years)', 'itr3Years')}
                </View>

                {/* ITR with Balance sheet and P/L */}
                <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>ITR with Balance sheet and P/L</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      The gap between the returns should be more than 6 months and when returns are filed on the same day 
                      or with a time gap of less than 6 months, they have to face negative remarks in their loan procedure.
                    </Text>
                    <Text style={styles.infoTextHindi}>
                      रिटर्न के बीच का अंतर 6 महीने से अधिक होना चाहिए और जब रिटर्न उसी दिन या 6 महीने से कम के समय अंतराल के साथ दाखिल किया जाता है, 
                      तो उन्हें अपनी ऋण प्रक्रिया में नकारात्मक टिप्पणियों का सामना करना पड़ता है।
                    </Text>
                  </View>
                  {renderFileInput('ITR with Balance Sheet and Profit and Loss Statement (1 years)', 'itr1YearsWith')}
                  {renderFileInput('ITR with Balance Sheet and Profit and Loss Statement (2 years)', 'itr2YearsWith')}
                  {renderFileInput('ITR with Balance Sheet and Profit and Loss Statement(3 years)', 'itr3YearsWith')}
          </View>

          {/* Car Loan Documents */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>Car Loan Documents</Text>
                  {renderFileInput('Dealer Quotation', 'dealerQuotation')}
                  {renderFileInput('Performa Invoice', 'performaInvoice')}
          </View>

          {/* Other Additional Documents Section */}
          <View style={styles.documentBox}>
            <Text style={styles.documentTitle}>Other Additional Documents</Text>
            {renderFileInput('Voter ID', 'voterID')}
            {renderFileInput('Driving License', 'drivingLicense')}
            {renderFileInput('Passport', 'passport')}
            {renderFileInput('NREGA Card', 'nregaCard')}
                </View>

                {/* Bank Statements Monthly/Yearly (Secondary Bank) */}
                <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>Bank Statements Monthly/Yearly (Secondary Bank)</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      The files are to be attached only when the business owner had more than one bank account account.
                    </Text>
                    <Text style={styles.infoTextHindi}>
                      फाइलों को केवल तभी संलग्न किया जाना है जब व्यवसाय के स्वामी के पास एक से अधिक बैंक खाते हों।
                    </Text>
                  </View>
                  {renderFileInput('Bank Statement of secondary bank account for 6 months (single file)', 'bankStatement6SecondarySingle')}
                  {renderFileInput('Bank Statement of secondary bank account for 6 months (multiple file)', 'bankStatement6SecondaryMultiple', true)}
                  {renderFileInput('Bank Statement of secondary bank account for 12 months (single file)', 'bankStatement12SecondarySingle')}
                  {renderFileInput('Bank Statement secondary bank account for 12 months (multiple file)', 'bankStatement12SecondaryMultiple', true)}
                </View>

                {/* Bank Statements in 3 Months Batch (Secondary Bank) */}
                <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>Bank Statements in 3 Months Batch (Secondary Bank)</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      The files are to be attached only when the business owner had more than one bank account account.
                    </Text>
                    <Text style={styles.infoTextHindi}>
                      फाइलों को केवल तभी संलग्न किया जाना है जब व्यवसाय के स्वामी के पास एक से अधिक बैंक खाते हों।
                    </Text>
                  </View>
                  {renderFileInput('Bank Statement of secondary bank in 3 Months Batch for 1 year', 'bankStatement3MonthsSecondarybank')}
                  {renderFileInput('Bank Statement of secondary bank 6 Months Batch for 1 year', 'bankStatement6MonthofSecondarybanks', true)}
                  {renderFileInput('Bank Statement of secondary bank 3 Months Batch for half year', 'bankStatement3halfofSecondarybanks')}
                </View>

                {/* Canceled Cheque of Business Account */}
                <View style={styles.documentBox}>
                  <Text style={styles.documentTitle}>Canceled Cheque of Business Account</Text>
                  {renderFileInput('Canceled Cheque of Business Account', 'canclecheque')}
                </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
               <Text style={styles.submitButtonText}>Submit Application</Text>
         </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#e1f5fe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0277bd',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  documentsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  documentBox: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  fileInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196f3',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  fileInputButtonText: {
    color: '#2196f3',
    fontWeight: '500',
    marginRight: 10,
  },
  verticalLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#2196f3',
    marginHorizontal: 8,
  },
  noFileText: {
    color: '#757575',
    flex: 1,
    flexWrap: 'wrap',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  documentPreview: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  documentPreviewText: {
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#ff5252',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2E183B',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadLabel: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 5,
  },
  multipleFilesContainer: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  fileItemText: {
    flex: 1,
    marginRight: 8,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#ff8f00',
    marginBottom: 8,
  },
  infoTextHindi: {
    fontSize: 13,
    color: '#ff8f00',
    fontStyle: 'italic',
  },
  mandatoryLabel: {
    backgroundColor: '#f44336',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  mandatoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoDescBox: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
  },
  photoDescText: {
    fontSize: 13,
    color: '#2e7d32',
  },
  aadhaarDescBox: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
  },
  aadhaarDescText: {
    fontSize: 13,
    color: '#1565c0',
  },
});