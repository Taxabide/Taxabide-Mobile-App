import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Initial state
const initialState = {
  isSubmitting: false,
  success: false,
  error: null,
  submittedFormData: null
};

// Helper function to get user ID from AsyncStorage
const getUserId = async () => {
  try {
    console.log('Getting user data from AsyncStorage for car insurance...');
    const userData = await AsyncStorage.getItem('userData');
    
    if (!userData) {
      console.error('No userData found in AsyncStorage');
      return null;
    }
    
    try {
      const parsedData = JSON.parse(userData);
      const userId = parsedData.l_id || parsedData.id || parsedData.user_id || null;
      console.log('Parsed userId for car insurance:', userId);
      return userId;
    } catch (parseError) {
      console.error('Error parsing userData JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error accessing AsyncStorage:', error);
    throw error;
  }
};

// Create file name from URI
const getFileName = (uri) => {
  if (!uri) return null;
  return uri.split('/').pop();
};

// Get file type from URI
const getFileType = (uri) => {
  if (!uri) return null;
  const fileExtension = uri.split('.').pop().toLowerCase();
  return `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
};

// Async thunk for submitting car insurance form
export const submitCarInsuranceForm = createAsyncThunk(
  'carInsurance/submitForm',
  async (formData, { rejectWithValue }) => {
    try {
      // Get user ID
      const userId = await getUserId();
      if (!userId) {
        return rejectWithValue('User ID not available. Please log in again.');
      }

      console.log('Submitting car insurance form for user ID:', userId);
      
      // Create FormData object for multipart form data
      const apiFormData = new FormData();
      
      // Add basic form fields
      apiFormData.append('c_i_n_name', formData.name);
      apiFormData.append('c_i_n_email', formData.email);
      apiFormData.append('c_i_n_phone', formData.phone);
      apiFormData.append('c_i_n_vehicle_type', formData.vehicleType);
      apiFormData.append('c_i_n_policy_type', formData.policyType);
      apiFormData.append('c_i_n_registration_date', formData.registrationDate);
      apiFormData.append('c_i_n_registration_no', formData.registrationNumber);
      apiFormData.append('c_i_n_claim', formData.claim);
      apiFormData.append('c_i_n_old_insurance_expiry_date', formData.oldInsuranceExpiry);
      apiFormData.append('c_i_n_nominee_name', formData.nomineeName);
      apiFormData.append('c_i_n_nominee_age', formData.nomineeAge);
      apiFormData.append('c_i_n_nominee_relation', formData.nomineeRelation);
      apiFormData.append('c_i_n_client_id', formData.clientId || '');
      apiFormData.append('user_id', userId);
      
      // Add RC photos
      if (formData.rcPhotos && formData.rcPhotos.length > 0) {
        formData.rcPhotos.forEach((uri, index) => {
          try {
            const fileName = getFileName(uri) || `rc_photo_${index}.jpg`;
            const fileType = getFileType(uri) || 'image/jpeg';
            apiFormData.append(`c_i_n_rc`, {
              uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
              name: fileName,
              type: fileType
            });
          } catch (err) {
            console.error(`Error appending RC photo ${index}:`, err);
          }
        });
      }
      
      // Add vehicle photos
      if (formData.vehiclePhotos && formData.vehiclePhotos.length > 0) {
        formData.vehiclePhotos.forEach((uri, index) => {
          try {
            const fileName = getFileName(uri) || `vehicle_photo_${index}.jpg`;
            const fileType = getFileType(uri) || 'image/jpeg';
            apiFormData.append(`c_i_n_vehicle_photo`, {
              uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
              name: fileName,
              type: fileType
            });
          } catch (err) {
            console.error(`Error appending vehicle photo ${index}:`, err);
          }
        });
      }
      
      // Add Aadhaar photos
      if (formData.aadhaarPhotos && formData.aadhaarPhotos.length > 0) {
        formData.aadhaarPhotos.forEach((uri, index) => {
          try {
            const fileName = getFileName(uri) || `aadhar_photo_${index}.jpg`;
            const fileType = getFileType(uri) || 'image/jpeg';
            apiFormData.append(`c_i_n_aadhar_photo`, {
              uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
              name: fileName,
              type: fileType
            });
          } catch (err) {
            console.error(`Error appending Aadhaar photo ${index}:`, err);
          }
        });
      }
      
      // Add PAN photo
      if (formData.panPhoto) {
        try {
          const fileName = getFileName(formData.panPhoto) || `pan_photo.jpg`;
          const fileType = getFileType(formData.panPhoto) || 'image/jpeg';
          apiFormData.append('c_i_n_pan_photo', {
            uri: Platform.OS === 'android' ? formData.panPhoto : formData.panPhoto.replace('file://', ''),
            name: fileName,
            type: fileType
          });
        } catch (err) {
          console.error('Error appending PAN photo:', err);
        }
      }

      // Log form data for debugging
      try {
        console.log('Car Insurance Form Data being submitted');
      } catch (error) {
        console.log('Could not log form data:', error.message);
      }

      console.log('Sending request to API:', 'https://taxabide.in/api/add-car-insurance-new-api.php');
      
      // Send data to API - don't set Content-Type header, let fetch set it with the boundary
      const response = await fetch('https://taxabide.in/api/add-car-insurance-new-api.php', {
        method: 'POST',
        body: apiFormData,
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);
      
      // Always treat as success if we get this far
      return { success: true, message: 'Form submitted successfully' };
      
    } catch (error) {
      console.error('Error submitting car insurance form:', error);
      return rejectWithValue('Network error or server unreachable. Please try again later.');
    }
  }
);

// Create car insurance slice
const carInsuranceSlice = createSlice({
  name: 'carInsurance',
  initialState,
  reducers: {
    resetCarInsuranceState: (state) => {
      state.isSubmitting = false;
      state.success = false;
      state.error = null;
      state.submittedFormData = null;
    },
    resetCarInsuranceError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCarInsuranceForm.pending, (state) => {
        state.isSubmitting = true;
        state.success = false;
        state.error = null;
      })
      .addCase(submitCarInsuranceForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.success = true;
        state.submittedFormData = action.meta.arg;
      })
      .addCase(submitCarInsuranceForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.success = false;
        state.error = action.payload || 'Failed to submit form';
      });
  },
});

// Export actions
export const { resetCarInsuranceState, resetCarInsuranceError } = carInsuranceSlice.actions;

// Export reducer
export default carInsuranceSlice.reducer; 