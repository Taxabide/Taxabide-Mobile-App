import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
  ImageBackground,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {updateUser} from '../../../redux/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import ClientFooter from '../Footer/ClientFooter';
import LinearGradient from 'react-native-linear-gradient';
import ProfileNavbar from '../NavBar/ProfileNavbar';

const {width} = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'edit'
  const {user, isLoading: reduxLoading, error} = useSelector(state => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [updateApproach, setUpdateApproach] = useState('formdata'); // 'formdata', 'urlencoded', 'xhr'
  const [updateAttempt, setUpdateAttempt] = useState(0);
  const [showProfileImageOptions, setShowProfileImageOptions] = useState(false);
  
  // Ref for ScrollView
  const scrollViewRef = useRef(null);
  
  // Default user data structure
  const defaultUserData = {
    name: '',
    email: '',
    phone: '',
    mobile: '',
    pan: '',
    aadhaarNumber: '',
    pinCode: '',
    address: '',
    joinDate: '',
    userType: 'User',
    authorizedPartnerCenter: '',
    apcCode: '',
    allocatedArea: '',
    logo: '',
    profilePic: null,
  };

  // State for user data, initialized with default values
  const [userData, setUserData] = useState(defaultUserData);

  // For edit form state
  const [formData, setFormData] = useState({...userData});

  // For image selection
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);

  // Load user data from Redux when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('Starting to load user data');

        // Debug user object structure
        console.log('User object structure:', JSON.stringify(user, null, 2));

        // If user exists in Redux store, use that data
        if (user) {
          console.log(
            'User found in Redux. Fields available:',
            Object.keys(user).join(', '),
          );
          console.log('User ID value:', user.id);
          console.log('User ID (l_id) value:', user.l_id);
          console.log('User ID (user_id) value:', user.user_id);

          // Ensure we have a valid user object
          if (typeof user !== 'object') {
            console.error('Invalid user data format in Redux:', user);
            throw new Error('Invalid user data format');
          }

          // Get user ID - check multiple possible fields
          console.log(
            'User object in handleUpdate:',
            JSON.stringify(user, null, 2),
          );

          // Try to find the user ID, following the same approach as SignupScreen
          // In SignupScreen, we store data.user_id as userData.id, and data.l_id as userData.l_id
          const userId = user?.id || user?.user_id; // Try primary ID first
          const loginId = user?.l_id; // Login table ID

          if (!userId && !loginId) {
            console.error(
              'No user ID found in any field. Available fields:',
              Object.keys(user || {}),
            );
            Alert.alert(
              'User ID Error',
              'Could not determine your user ID. Please log out and log in again.',
            );
            setIsLoading(false);
            return;
          }

          console.log('Found user ID for update:', userId);
          console.log('Found login ID for update:', loginId);

          const mappedUserData = {
            ...defaultUserData,
            name: user.name || '',
            email: user.email || '',
            phone: user.mobile || user.phone || '', // Use mobile first, fallback to phone
            pan: user.pan || '',
            aadhaarNumber: user.aadhaar || '',
            address: user.address || '',
            pinCode: user.pinCode || '',
            authorizedPartnerCenter: user.apcName || '',
            apcCode: user.apcCode || '',
            allocatedArea: user.allocatedArea || '',
            profilePic: user.profilePic || null,
            logo: user.logo || '',
            joinDate: user.joinDate || new Date().toLocaleDateString(),
          };

          setUserData(mappedUserData);
          setFormData(mappedUserData);
          console.log('Loaded user data from Redux:', mappedUserData);
        } else {
          console.log('No user in Redux, checking AsyncStorage');
          // Fallback to AsyncStorage if Redux store is empty
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            try {
              const parsedUser = JSON.parse(storedUserData);
              console.log('User data found in AsyncStorage:', parsedUser);

              // Ensure we have a valid user object
              if (typeof parsedUser !== 'object') {
                console.error(
                  'Invalid user data format in AsyncStorage:',
                  parsedUser,
                );
                throw new Error('Invalid user data format in storage');
              }

              const mappedUserData = {
                ...defaultUserData,
                name: parsedUser.name || '',
                email: parsedUser.email || '',
                phone: parsedUser.mobile || parsedUser.phone || '',
                pan: parsedUser.pan || '',
                aadhaarNumber: parsedUser.aadhaar || '',
                address: parsedUser.address || '',
                pinCode: parsedUser.pinCode || '',
                authorizedPartnerCenter: parsedUser.apcName || '',
                apcCode: parsedUser.apcCode || '',
                allocatedArea: parsedUser.allocatedArea || '',
                profilePic: parsedUser.profilePic || null,
                logo: parsedUser.logo || '',
                joinDate:
                  parsedUser.joinDate || new Date().toLocaleDateString(),
              };

              setUserData(mappedUserData);
              setFormData(mappedUserData);
              console.log(
                'Loaded user data from AsyncStorage:',
                mappedUserData,
              );
            } catch (parseError) {
              console.error(
                'Error parsing user data from AsyncStorage:',
                parseError,
              );
              Alert.alert(
                'Data Error',
                'There was an error loading your profile data. Please log out and log in again.',
              );
            }
          } else {
            console.log('No user data found in AsyncStorage');
            // Keep default empty values
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  const handleChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  // Handle profile image selection
  const handleSelectProfileImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets.length > 0) {
        const source = {uri: response.assets[0].uri};
        setSelectedProfileImage(source);
        console.log('Selected profile image:', source);
      }
    });
  };

  // Function to remove profile image
  const handleRemoveProfileImage = async () => {
    setShowProfileImageOptions(false);
    
    try {
      // Get user ID
      const userId = user?.id || user?.user_id;
      const loginId = user?.l_id;
      
      if (!userId && !loginId) {
        Alert.alert('User ID Error', 'Could not determine your user ID.');
        return;
      }
      
      // Create form data for API request
      const apiFormData = new FormData();
      
      // Add the IDs from the user object
      if (loginId) {
        apiFormData.append('l_id', loginId);
      }
      if (userId) {
        apiFormData.append('user_id', userId);
      }
      
      // Set profile_photo to empty/null
      apiFormData.append('l_profile_photo', '');
      
      // Make the API request
      setIsLoading(true);
      const response = await fetch(
        'https://taxabide.in/api/edit-profile-api.php',
        {
          method: 'POST',
          body: apiFormData,
        }
      );
       console.log(">>>>>>>>>>>>response profile ",response)
      const responseText = await response.text();
      setIsLoading(false);
      
      // Process the response
      let success = false;
      try {
        const jsonResponse = JSON.parse(responseText);
        success = jsonResponse.success || jsonResponse.status === true;
      } catch (e) {
        success = responseText.includes('success') || responseText.includes('updated');
      }
      
      if (success) {
        // Update user context and states
        setSelectedProfileImage(null);
        
        // Update user context
        const updatedUser = {
          ...user,
          profilePic: null,
        };
        dispatch(updateUser(updatedUser));
        
        // Update local state
        const updatedUserData = {
          ...userData,
          profilePic: null,
        };
        setUserData(updatedUserData);
        
        Alert.alert('Success', 'Profile photo removed successfully');
      } else {
        Alert.alert('Error', 'Failed to remove profile photo. Please try again.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error removing profile photo:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Handle logo selection
  const handleSelectLogo = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets.length > 0) {
        const source = {uri: response.assets[0].uri};
        setSelectedLogo(source);
        console.log('Selected logo:', source);
      }
    });
  };

  // Add validateForm function before handleUpdate
  const validateForm = () => {
    // Full Name: required, min 2 chars, only letters and spaces
    if (!formData.name || formData.name.trim().length < 2 || !/^[A-Za-z ]+$/.test(formData.name.trim())) {
      return 'Please enter a valid full name (letters and spaces only, at least 2 characters).';
    }
    // Email: required, valid format
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    // Phone: required, 10 digits, starts with 6-9
    if (!formData.phone || !/^[6-9][0-9]{9}$/.test(formData.phone.trim())) {
      return 'Please enter a valid 10-digit phone number starting with 6-9.';
    }
    // PAN: optional, if present must match format
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim())) {
      return 'Please enter a valid PAN number (e.g., ABCDE1234F).';
    }
    // Aadhaar: optional, if present must be 12 digits
    if (formData.aadhaarNumber && !/^[0-9]{12}$/.test(formData.aadhaarNumber.trim())) {
      return 'Please enter a valid 12-digit Aadhaar number.';
    }
    // Pin code: optional, if present must be 6 digits
    if (formData.pinCode && !/^[0-9]{6}$/.test(formData.pinCode.trim())) {
      return 'Please enter a valid 6-digit pin code.';
    }
    // Address: optional, if present min 5 chars
    if (formData.address && formData.address.trim().length < 5) {
      return 'Please enter a valid address (at least 5 characters).';
    }
    // All other fields are optional, no strict validation
    return null;
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);

      // Validate all fields
      const validationError = validateForm();
      if (validationError) {
        Alert.alert('Error', validationError);
        setIsLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.name || !formData.email) {
        Alert.alert('Error', 'Name and email are required fields');
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // PAN validation (if provided)
      const panValue = (formData.pan || '').trim();
      if (panValue) {
        // PAN format: ABCDE1234F (5 letters followed by 4 numbers followed by 1 letter)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panValue)) {
          Alert.alert(
            'Error',
            'Please enter a valid PAN number (e.g., ABCDE1234F)',
          );
          setIsLoading(false);
          return;
        }
      }

      // Aadhaar validation (if provided)
      const aadhaarValue = (formData.aadhaarNumber || '').trim();
      if (aadhaarValue) {
        // Aadhaar should be 12 digits
        const aadhaarRegex = /^[0-9]{12}$/;
        if (!aadhaarRegex.test(aadhaarValue)) {
          Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
          setIsLoading(false);
          return;
        }
      }

      // Phone/Mobile validation (if provided)
      const phoneValue = (formData.phone || formData.mobile || '').trim();
      if (phoneValue) {
        // India phone numbers are typically 10 digits, may start with +91
        const phoneRegex = /^(\+?91)?[6-9][0-9]{9}$/;
        if (!phoneRegex.test(phoneValue.replace(/\s/g, ''))) {
          Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }
      }

      // Get user ID - check multiple possible fields
      if (!user) {
        Alert.alert(
          'Error',
          'You are not logged in. Please log in to update your profile.',
        );
        setIsLoading(false);
        return;
      }

      // Try to find the user ID, following the same approach as SignupScreen
      const userId = user?.id || user?.user_id; // Try primary ID first
      const loginId = user?.l_id; // Login table ID

      if (!userId && !loginId) {
        Alert.alert(
          'User ID Error',
          'Could not determine your user ID. Please log out and log in again.',
        );
        setIsLoading(false);
        return;
      }

      // Process the update
      await updateProfileWithFormData(
        userId,
        loginId,
        phoneValue,
        panValue,
        aadhaarValue,
      );
    } catch (error) {
      console.error('Error in update process:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile using FormData
  const updateProfileWithFormData = async (
    userId,
    loginId,
    phoneValue,
    panValue,
    aadhaarValue,
  ) => {
    try {
      // Create form data using the same field names as in SignupScreen
      const apiFormData = new FormData();

      // Add the IDs from the user object
      if (loginId) {
        apiFormData.append('l_id', loginId);
      }
      if (userId) {
        apiFormData.append('user_id', userId);
      }

      // Add all form fields mapped to the database column names
      apiFormData.append('l_name', formData.name.trim());
      apiFormData.append('l_email', formData.email.trim());
      apiFormData.append('l_number', formData.phone);
      apiFormData.append('l_address', (formData.address || '').trim());
      apiFormData.append('l_pin_code', (formData.pinCode || '').trim());
      apiFormData.append('l_pan_no', panValue);
      apiFormData.append('l_aadhar', aadhaarValue);
      apiFormData.append(
        'l_a_p_c_name',
        (formData.authorizedPartnerCenter || '').trim(),
      );
      apiFormData.append('l_a_p_c_code', (formData.apcCode || '').trim());
      apiFormData.append(
        'l_allocated_area',
        (formData.allocatedArea || '').trim(),
      );

      // Add profile image if selected
      if (selectedProfileImage) {
        const photoUri = selectedProfileImage.uri;
        const photoName = photoUri.substring(photoUri.lastIndexOf('/') + 1);
        const photoType = 'image/' + (photoName.split('.').pop() || 'jpeg');

        apiFormData.append('l_profile_photo', {
          uri:
            Platform.OS === 'android'
              ? photoUri
              : photoUri.replace('file://', ''),
          name: photoName,
          type: photoType,
        });
      }

      // Add logo if selected
      if (selectedLogo) {
        const logoUri = selectedLogo.uri;
        const logoName = logoUri.substring(logoUri.lastIndexOf('/') + 1);
        const logoType = 'image/' + (logoName.split('.').pop() || 'jpeg');

        apiFormData.append('l_logo', {
          uri:
            Platform.OS === 'android'
              ? logoUri
              : logoUri.replace('file://', ''),
          name: logoName,
          type: logoType,
        });
      }

      // Make the API request
      const response = await fetch(
        'https://taxabide.in/api/edit-profile-api.php',
        {
          method: 'POST',
          body: apiFormData,
        },
      );

      const responseText = await response.text();

      // Process the response
      let success = false;

      try {
        // Try to parse as JSON
        const jsonResponse = JSON.parse(responseText);
        success = jsonResponse.success || jsonResponse.status === true;

        if (!success) {
          Alert.alert(
            'Error',
            jsonResponse.message ||
              'Failed to update profile. Please try again.',
          );
          return false;
        }
      } catch (e) {
        // If not JSON, check for success text
        success =
          responseText.includes('success') || responseText.includes('updated');

        if (!success) {
          Alert.alert('Error', 'Failed to update profile. Please try again.');
          return false;
        }
      }

      if (success) {
        // Update local state
        setUserData({ ...defaultUserData, ...userContextData });
        setFormData({ ...defaultUserData, ...userContextData });

        // Update user context with the same structure as in SignupScreen
        const userContextData = {
          ...user,
          id: userId, // Database user ID
          l_id: loginId, // Login ID
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.phone,
          phone: formData.phone,
          pan: panValue,
          aadhaar: aadhaarValue,
          address: (formData.address || '').trim(),
          pinCode: (formData.pinCode || '').trim(),
          apcName: (formData.authorizedPartnerCenter || '').trim(),
          apcCode: (formData.apcCode || '').trim(),
          allocatedArea: (formData.allocatedArea || '').trim(),
          profilePic: selectedProfileImage
            ? selectedProfileImage.uri
            : user?.profilePic,
          logo: selectedLogo ? selectedLogo.uri : user?.logo,
        };

        // Save to AsyncStorage through context
        dispatch(updateUser(userContextData));

        // Show success message
        Alert.alert('Success', 'Profile updated successfully');

        // Switch back to view mode
        setActiveTab('view');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        'Failed to connect to the server. Please check your internet connection and try again.',
      );
      return false;
    }
  };

  // Function to handle "My Profile" click
  const handleMyProfileClick = () => {
    // Scroll to top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
    
    // Ensure we're in view mode
    setActiveTab('view');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileNavbar 
        navigation={navigation} 
        currentUser={userData} 
        updateUser={dispatch}
      />
      
      <View style={styles.dashboardLinkContainer}>
        <Text style={styles.viewProfileText}>View Profile</Text>
        <TouchableOpacity 
          style={styles.dashboardWrapper}
          onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={18} color="#555" />
          <Text style={styles.dashboardLink}>Dashboard </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}>
        {/* Banner Background */}
        <View style={styles.bannerContainer}>
          <ImageBackground
            source={require('../../assets/images/ProfileBG.png')}
            style={styles.banner}
            resizeMode="cover"
          />
        </View>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          {/* Profile Image that overlaps banner */}
          <View style={styles.profileImageContainer}>
            {selectedProfileImage ? (
              <Image
                source={selectedProfileImage}
                style={styles.profileImage}
              />
            ) : userData.profilePic ? (
              <Image
                source={{uri: userData.profilePic}}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={require('../../assets/images/profile.png')}
                style={styles.profileImage}
              />
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.profileEmail}>
              {userData.email}
            </Text>
          </View>
        </View>

        {/* Profile Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'view' && styles.activeTab]}
            onPress={() => setActiveTab('view')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'view' && styles.activeTabText,
              ]}>
              Personal Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'edit' && styles.activeTab]}
            onPress={() => setActiveTab('edit')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'edit' && styles.activeTabText,
              ]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'view' ? (
          // View Mode - Personal Info
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{userData.name || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>
                {userData.phone || '-'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Aadhaar Number</Text>
              <Text style={styles.infoValue}>
                {userData.aadhaarNumber || '-'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>PAN Number</Text>
              <Text style={styles.infoValue}>{userData.pan || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Pin code</Text>
              <Text style={styles.infoValue}>{userData.pinCode || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{userData.address || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Join Date</Text>
              <Text style={styles.infoValue}>{userData.joinDate || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {userData.userType || 'User'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Authorized Partner Center</Text>
              <Text style={styles.infoValue}>
                {userData.authorizedPartnerCenter || '-'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>APC Code</Text>
              <Text style={styles.infoValue}>{userData.apcCode || '-'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Allocated Area</Text>
              <Text style={styles.infoValue}>
                {userData.allocatedArea || '-'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Logo</Text>
              <View style={styles.logoValueContainer}>
                {userData.logo ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{uri: userData.logo}}
                      style={styles.viewLogoImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>-None-</Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          // Edit Mode - Form
          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <View style={styles.profileImageEditContainer}>
                <View style={styles.editProfileImageWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowProfileImageOptions(true)}>
                    {selectedProfileImage ? (
                      <Image
                        source={selectedProfileImage}
                        style={styles.editProfileImage}
                      />
                    ) : userData.profilePic ? (
                      <Image
                        source={{uri: userData.profilePic}}
                        style={styles.editProfileImage}
                      />
                    ) : (
                      <View style={styles.editProfileImagePlaceholder}>
                        <Icon name="account" size={40} color="#ccc" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editImageButton}
                    onPress={() => setShowProfileImageOptions(true)}>
                    <Icon name="camera" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileImageLabel}>Profile Image</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={text => handleChange('name', text)}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email}
                  onChangeText={text => handleChange('email', text)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.phone}
                  onChangeText={text => handleChange('phone', text)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Pin code</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.pinCode}
                  onChangeText={text => handleChange('pinCode', text)}
                  placeholder="Enter pin code"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>PAN Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.pan}
                  onChangeText={text => handleChange('pan', text)}
                  placeholder="Enter PAN number"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Aadhaar Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.aadhaarNumber}
                  onChangeText={text => handleChange('aadhaarNumber', text)}
                  placeholder="Enter Aadhaar number"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.address}
                  onChangeText={text => handleChange('address', text)}
                  placeholder="Enter address"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Authorized Partner Center</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.authorizedPartnerCenter}
                  onChangeText={text =>
                    handleChange('authorizedPartnerCenter', text)
                  }
                  placeholder="Enter Authorized Partner Center"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>APC Code</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.apcCode}
                  onChangeText={text => handleChange('apcCode', text)}
                  placeholder="Enter APC Code"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Allocated Area</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.allocatedArea}
                  onChangeText={text => handleChange('allocatedArea', text)}
                  placeholder="Enter Allocated Area"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Logo</Text>
                <View style={styles.logoUploadContainer}>
                  <TouchableOpacity
                    style={styles.logoUploadButton}
                    onPress={handleSelectLogo}>
                    <Text style={styles.logoUploadText}>Choose File</Text>
                  </TouchableOpacity>
                  <Text style={styles.logoUploadStatus}>
                    {selectedLogo
                      ? 'New file chosen'
                      : userData.logo
                      ? 'Current logo'
                      : 'No file chosen'}
                  </Text>
                </View>
                {selectedLogo && (
                  <Image
                    source={selectedLogo}
                    style={styles.logoPreview}
                    resizeMode="contain"
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdate}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
            <ClientFooter />
          </View>
        )}
      </ScrollView>
      
      {/* Profile Image Options Modal (WhatsApp style) */}
      {showProfileImageOptions && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowProfileImageOptions(false)}
          />
          <View style={styles.profileImageOptionsContainer}>
            <View style={styles.profileImageOptionsHeader}>
              <Text style={styles.profileImageOptionsTitle}>Profile photo</Text>
              <TouchableOpacity onPress={() => setShowProfileImageOptions(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Image Preview if available */}
            {(selectedProfileImage || userData.profilePic) && (
              <View style={styles.currentPhotoContainer}>
                <Image 
                  source={selectedProfileImage || {uri: userData.profilePic}}
                  style={styles.currentPhoto}
                  resizeMode="cover"
                />
              </View>
            )}
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowProfileImageOptions(false);
                  handleSelectProfileImage();
                }}>
                <Icon name="image" size={24} color="#662d91" />
                <Text style={styles.optionText}>Upload Photo</Text>
              </TouchableOpacity>
              
              {(selectedProfileImage || userData.profilePic) && (
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={handleRemoveProfileImage}>
                  <Icon name="delete" size={24} color="#ff4d4f" />
                  <Text style={styles.optionText}>Remove Photo</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => setShowProfileImageOptions(false)}>
                <Icon name="close-circle" size={24} color="#333" />
                <Text style={styles.optionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    height: 150,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  profileContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    marginTop: -75,
    marginBottom: 15,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#666',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#662d91',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  activeTabText: {
    color: '#662d91',
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  logoValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  viewLogoImage: {
    width: 80,
    height: 60,
    borderRadius: 4,
    marginLeft: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  formSection: {
    marginBottom: 20,
  },
  profileImageEditContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  editProfileImageWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  editProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editProfileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#662d91',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  removeEditImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileImageLabel: {
    fontSize: 14,
    color: '#666',
  },
  formField: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  logoUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoUploadButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoUploadText: {
    fontSize: 14,
    color: '#333',
  },
  logoUploadStatus: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  logoPreview: {
    width: '100%',
    height: 100,
    marginTop: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  updateButton: {
    backgroundColor: '#662d91',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dashboardLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  viewProfileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  dashboardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardLink: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  profileImageOptionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 15,
    paddingBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImageOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentPhotoContainer: {
    alignItems: 'center',
    padding: 20,
  },
  currentPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 20,
  },
});

export default ProfileScreen;
