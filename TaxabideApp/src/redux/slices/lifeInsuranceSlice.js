import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
  lifeInsuranceData: [],
  isLoading: false,
  error: null,
  successMessage: null,
  isSubmitting: false,
  success: false,
  submissionData: null
};

// Helper function to get auth tokens
const getAuthData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      throw new Error('User data not available. Please login again.');
    }
    
    const parsedUserData = JSON.parse(userData);
    const userId = parsedUserData.l_id || parsedUserData.id || parsedUserData.user_id;
    
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }
    
    return { userId, parsedUserData };
  } catch (error) {
    throw error;
  }
};

// Async thunk for fetching life insurance data
export const fetchLifeInsuranceData = createAsyncThunk(
  'lifeInsurance/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const { userId, parsedUserData } = await getAuthData();
      
      console.log('Life Insurance API - Attempting to fetch with userId:', userId);
      
      // Try with comprehensive POST method first as it's most reliable
      try {
        const formData = new FormData();
        
        // Add all possible user identifiers
        formData.append('user_id', userId);
        formData.append('l_i_user_id', userId);
        formData.append('l_id', userId);
        formData.append('action', 'list');
        formData.append('request_from', 'mobile_app');
        
        // Add all available auth tokens
        if (parsedUserData.token) {
          formData.append('token', parsedUserData.token);
        }
        
        if (parsedUserData.api_key) {
          formData.append('api_key', parsedUserData.api_key);
        }
        
        if (parsedUserData.auth_token) {
          formData.append('auth_token', parsedUserData.auth_token);
        }
        
        if (parsedUserData.auth_key) {
          formData.append('auth_key', parsedUserData.auth_key);
        }
        
        // Fix: Safely log form data fields without using formData._parts
        console.log('Making POST API request with FormData object');
        
        // Try with fetch first
        const response = await fetch('https://taxabide.in/api/life-insurance-investment-list-api.php', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            ...(parsedUserData.token ? { 'Authorization': `Bearer ${parsedUserData.token}` } : {})
          }
        });
        
        const responseText = await response.text();
        console.log('Life Insurance POST response status:', response.status);
        console.log('Life Insurance POST response length:', responseText.length);
        console.log('Life Insurance POST response preview:', responseText.substring(0, 150) + (responseText.length > 150 ? '...' : ''));
        
        // Try to parse the response
        if (responseText && !responseText.startsWith('<')) {
          const data = JSON.parse(responseText);
          
          if (data && data.status === 'error') {
            console.log('API returned error status:', data.message);
            
            // Try alternate methods if unauthorized
            if (data.message === 'Unauthorized' || (data.message && data.message.includes('auth'))) {
              // Try GET method as fallback
              return await tryAlternativeMethod(userId, parsedUserData, rejectWithValue);
            } else {
              return rejectWithValue(data.message || 'Failed to fetch insurance data');
            }
          } else if (Array.isArray(data)) {
            console.log('Received array data with', data.length, 'items');
            
            if (data.length === 0) {
              // If empty array, return empty array but add a better error to display
              return rejectWithValue('No life insurance records found. Please add some records first.');
            }
            
            return data;
          } else if (data && data.status === 'success' && Array.isArray(data.data)) {
            console.log('Received success response with', data.data.length, 'items');
            
            if (data.data.length === 0) {
              // If empty array, return empty array but add a better error to display
              return rejectWithValue('No life insurance records found. Please add some records first.');
            }
            
            return data.data;
          } else if (data && typeof data === 'object') {
            console.log('Received single object data');
            return [data];
          } else {
            console.log('Invalid data format received from API, trying alternate method');
            return await tryAlternativeMethod(userId, parsedUserData, rejectWithValue);
          }
        } else {
          console.log('Invalid response format (HTML or empty), trying alternate method');
          return await tryAlternativeMethod(userId, parsedUserData, rejectWithValue);
        }
      } catch (parseError) {
        console.error('Error in POST request:', parseError);
        return await tryAlternativeMethod(userId, parsedUserData, rejectWithValue);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch insurance data');
    }
  }
);

// Helper function to try alternative API methods
const tryAlternativeMethod = async (userId, parsedUserData, rejectWithValue) => {
  try {
    console.log('Trying alternative fetch method with GET request');
    
    // Try GET method with comprehensive parameters
    const queryParams = new URLSearchParams({
      user_id: userId,
      l_i_user_id: userId,
      l_id: userId,
      action: 'list',
      request_from: 'mobile_app'
    });
    
    // Add auth tokens to query params
    if (parsedUserData.token) {
      queryParams.append('token', parsedUserData.token);
    }
    
    if (parsedUserData.api_key) {
      queryParams.append('api_key', parsedUserData.api_key);
    }
    
    console.log('Making GET request with params:', queryParams.toString());
    
    const response = await fetch(`https://taxabide.in/api/life-insurance-investment-list-api.php?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(parsedUserData.token ? { 'Authorization': `Bearer ${parsedUserData.token}` } : {})
      }
    });
    
    const responseText = await response.text();
    console.log('GET response status:', response.status);
    console.log('GET response length:', responseText.length);
    console.log('GET response preview:', responseText.substring(0, 150));
    
    // Handle the response
    if (responseText && !responseText.startsWith('<')) {
      try {
        const data = JSON.parse(responseText);
        
        if (Array.isArray(data)) {
          console.log('GET request returned array with', data.length, 'items');
          
          if (data.length === 0) {
            return rejectWithValue('No life insurance records found. Please add some records first.');
          }
          
          return data;
        } else if (data && data.status === 'success' && Array.isArray(data.data)) {
          console.log('GET request returned success with', data.data.length, 'items');
          
          if (data.data.length === 0) {
            return rejectWithValue('No life insurance records found. Please add some records first.');
          }
          
          return data.data;
        } else if (data && typeof data === 'object' && !data.error) {
          console.log('GET request returned single object');
          return [data];
        } else if (data && data.status === 'error') {
          console.log('GET request returned error:', data.message);
          return rejectWithValue(data.message || 'API returned an error');
        }
      } catch (error) {
        console.log('Error parsing GET response:', error);
      }
    }
    
    // Try direct URL with different format
    console.log('Trying alternative URL format');
    
    try {
      const altResponse = await fetch(`https://taxabide.in/api/life-insurance-investment-list-api.php?l_id=${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(parsedUserData.token ? { 'Authorization': `Bearer ${parsedUserData.token}` } : {})
        }
      });
      
      const altResponseText = await altResponse.text();
      console.log('Alternative URL response status:', altResponse.status);
      console.log('Alternative URL response length:', altResponseText.length);
      
      if (altResponseText && !altResponseText.startsWith('<')) {
        try {
          const altData = JSON.parse(altResponseText);
          
          if (Array.isArray(altData) && altData.length > 0) {
            return altData;
          } else if (altData && altData.status === 'success' && Array.isArray(altData.data) && altData.data.length > 0) {
            return altData.data;
          } else if (altData && typeof altData === 'object' && !altData.error) {
            return [altData];
          }
        } catch (err) {
          console.log('Error parsing alternative URL response:', err);
        }
      }
    } catch (altError) {
      console.log('Alternative URL request failed:', altError);
    }
    
    // All methods failed
    console.log('All API methods failed');
    return rejectWithValue('Unable to retrieve life insurance data. Please check your login status and try again.');
  } catch (error) {
    console.error('All API methods failed with error:', error);
    return rejectWithValue('Failed to fetch data. Please try again later.');
  }
};

// Async thunk for submitting life insurance form
export const submitLifeInsuranceForm = createAsyncThunk(
  'lifeInsurance/submitForm',
  async (formData, { rejectWithValue }) => {
    try {
      // Get user ID from AsyncStorage if not provided in formData
      const userId = formData.l_i_user_id;
      if (!userId) {
        const userData = await AsyncStorage.getItem('userData');
        const parsedUserData = userData ? JSON.parse(userData) : null;
        const storedUserId = parsedUserData?.l_id || parsedUserData?.id || parsedUserData?.user_id;
        
        if (!storedUserId) {
          return rejectWithValue('User ID not available. Please log in again.');
        }
        
        formData.l_i_user_id = storedUserId;
      }
      
      console.log('Submitting life insurance form with user ID:', formData.l_i_user_id);
      
      // Prepare the FormData object
      const apiFormData = new FormData();
      
      // Add user ID to form data with ALL possible field names to ensure it's recognized
      apiFormData.append('l_i_user_id', formData.l_i_user_id);
      apiFormData.append('user_id', formData.l_i_user_id);
      apiFormData.append('l_id', formData.l_i_user_id);
      
      // Define all the DB fields that need to be included
      const dbFields = [
        'l_i_name',
        'l_i_email',
        'l_i_phone',
        'l_i_aadhar',
        'l_i_pan',
        'l_i_age',
        'l_i_gender',
        'l_i_pincode',
        'l_i_investment_plan',
        'l_i_nominee_name',
        'l_i_nominee_age',
        'l_i_nominee_relation',
        'l_i_investment_per_month',
        'l_i_investment_for_year',
        'l_i_withdraw_after_year',
        'l_i_client_id',
        'l_i_add_date',
        'l_i_user_id'
      ];
      
      // Add all database fields explicitly to ensure they're included
      dbFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          apiFormData.append(field, formData[field]);
        }
      });
      
      // Handle the file uploads separately
      // Handle Aadhaar photos (multiple files)
      if (formData.aadhaarPhoto && Array.isArray(formData.aadhaarPhoto) && formData.aadhaarPhoto.length > 0) {
        formData.aadhaarPhoto.forEach((uri, index) => {
          const fileType = uri.split('.').pop();
          apiFormData.append('l_i_aadhar_photo', {
            uri: uri,
            name: `aadhar_${index}.${fileType}`,
            type: `image/${fileType}`,
          });
        });
      }
      
      // Handle PAN photo (single file)
      if (formData.panPhoto) {
        const fileType = formData.panPhoto.split('.').pop();
        apiFormData.append('l_i_pan_photo', {
          uri: formData.panPhoto,
          name: `pan.${fileType}`,
          type: `image/${fileType}`,
        });
      }
      
      // Add any additional metadata fields
      if (formData.form_type) {
        apiFormData.append('form_type', formData.form_type);
      }
      
      if (formData.source) {
        apiFormData.append('source', formData.source);
      }
      
      // Log form data for debugging - safely without using _parts
      console.log('Form data fields being sent:', dbFields.join(', '));
      console.log('User ID being sent:', formData.l_i_user_id);
      
      // Send the form data to the API
      const response = await fetch('https://taxabide.in/api/add-life-insurance-investment-api.php', {
        method: 'POST',
        body: apiFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const responseText = await response.text();
      console.log('API Response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.log('Response text:', responseText);
        
        // If response is not valid JSON but includes success
        if (responseText.includes('success')) {
          return { status: 'success', message: 'Form submitted successfully' };
        }
        
        // Try alternative submission if the primary method fails
        try {
          console.log('Trying alternative submission approach');
          return await tryAlternativeSubmission(formData, dbFields);
        } catch (altError) {
          console.error('Alternative submission failed:', altError);
          throw new Error('Failed to submit form. Please try again later.');
        }
      }
      
      if (responseData.status === 'success') {
        return responseData;
      } else {
        return rejectWithValue(responseData.message || 'Form submission failed');
      }
    } catch (error) {
      console.error('Error submitting life insurance form:', error);
      return rejectWithValue(error.message || 'An error occurred while submitting the form');
    }
  }
);

// Helper function for alternative submission approach
const tryAlternativeSubmission = async (formData, dbFields) => {
  // Try a simple fetch with just the essential fields
  const simpleFormData = new FormData();
  
  // Add all available fields from the db fields list
  dbFields.forEach(field => {
    if (formData[field] !== undefined && formData[field] !== null) {
      simpleFormData.append(field, formData[field]);
    }
  });
  
  // Try the submission with essential data
  const response = await fetch('https://taxabide.in/api/add-life-insurance-investment-api.php', {
    method: 'POST',
    body: simpleFormData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  const responseText = await response.text();
  console.log('Alternative submission response:', responseText);
  
  if (responseText.includes('success')) {
    return { status: 'success', message: 'Form submitted successfully (alternative method)' };
  }
  
  throw new Error('All submission attempts failed');
};

// Create the slice
const lifeInsuranceSlice = createSlice({
  name: 'lifeInsurance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    resetData: (state) => {
      state.lifeInsuranceData = [];
      state.error = null;
      state.successMessage = null;
    },
    resetLifeInsuranceState: (state) => {
      state.isSubmitting = false;
      state.success = false;
      state.error = null;
      state.submissionData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLifeInsuranceData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLifeInsuranceData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lifeInsuranceData = action.payload;
        state.successMessage = 'Life insurance data fetched successfully';
      })
      .addCase(fetchLifeInsuranceData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch life insurance data';
      })
      .addCase(submitLifeInsuranceForm.pending, (state) => {
        state.isSubmitting = true;
        state.success = false;
        state.error = null;
      })
      .addCase(submitLifeInsuranceForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.success = true;
        state.submissionData = action.payload;
      })
      .addCase(submitLifeInsuranceForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Form submission failed';
      });
  }
});

export const { clearError, clearSuccess, resetData, resetLifeInsuranceState } = lifeInsuranceSlice.actions;
export default lifeInsuranceSlice.reducer; 