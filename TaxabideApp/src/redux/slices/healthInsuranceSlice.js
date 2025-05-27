import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
  healthInsuranceData: [],
  isLoading: false,
  error: null,
  successMessage: null
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

// Async thunk for fetching health insurance data
export const fetchHealthInsuranceData = createAsyncThunk(
  'healthInsurance/fetchData',
  async (providedUserId = null, { rejectWithValue }) => {
    try {
      // Get auth data and user ID
      const { userId, parsedUserData } = await getAuthData();
      // Use provided user ID if available, otherwise use the one from auth data
      const effectiveUserId = providedUserId || userId;
      
      console.log('Fetching health insurance data for user ID:', effectiveUserId);
      
      // Try with GET method first, with proper user ID parameters
      try {
        const url = `https://taxabide.in/api/health-insurance-new-list-api.php?user_id=${effectiveUserId}&h_i_n_user_id=${effectiveUserId}&l_id=${effectiveUserId}`;
        console.log('Attempting GET request to:', url);
        
        const getResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...(parsedUserData.token ? { 'Authorization': `Bearer ${parsedUserData.token}` } : {})
          }
        });
        
        const responseText = await getResponse.text();
        console.log('GET response preview:', responseText.substring(0, 150));
        
        if (responseText && !responseText.includes('Unauthorized') && !responseText.startsWith('<')) {
          try {
            const data = JSON.parse(responseText);
            
            if (Array.isArray(data)) {
              return data;
            } else if (data && data.status === 'success' && Array.isArray(data.data)) {
              return data.data;
            } else if (data && typeof data === 'object' && !data.error) {
              return [data];
            }
          } catch (error) {
            console.log('Error parsing GET response:', error);
          }
        }
      } catch (getError) {
        console.error('GET request failed:', getError);
      }
      
      // Fall back to POST method with more user ID parameters
      console.log('Falling back to POST method');
      const formData = new FormData();
      
      // Add user ID using ALL possible field names to ensure it's recognized
      formData.append('user_id', effectiveUserId);
      formData.append('h_i_n_user_id', effectiveUserId); // Primary DB field name
      formData.append('l_id', effectiveUserId);          // Another possible field name
      
      // Add all possible authentication tokens
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
      
      formData.append('action', 'list');
      formData.append('request_from', 'mobile_app');
      
      const response = await fetch('https://taxabide.in/api/health-insurance-new-list-api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          ...(parsedUserData.token ? { 'Authorization': `Bearer ${parsedUserData.token}` } : {})
        }
      });
      
      const responseText = await response.text();
      console.log('POST response preview:', responseText.substring(0, 150));
      
      try {
        const data = JSON.parse(responseText);
        
        if (data && data.status === 'error') {
          if (data.message === 'Unauthorized' || data.message?.includes('auth')) {
            return rejectWithValue('Authentication failed. Please logout and login again.');
          } else {
            return rejectWithValue(data.message || 'Failed to fetch insurance data');
          }
        } else if (Array.isArray(data)) {
          // Filter the data to only include records for this user
          return data.filter(record => {
            const recordUserId = record.h_i_n_user_id || record.user_id || record.l_id;
            return !recordUserId || String(recordUserId).trim() === String(effectiveUserId).trim();
          });
        } else if (data && data.status === 'success' && Array.isArray(data.data)) {
          // Filter the data to only include records for this user
          return data.data.filter(record => {
            const recordUserId = record.h_i_n_user_id || record.user_id || record.l_id;
            return !recordUserId || String(recordUserId).trim() === String(effectiveUserId).trim();
          });
        } else if (data && typeof data === 'object') {
          // If it's a single record, check if it belongs to this user
          const recordUserId = data.h_i_n_user_id || data.user_id || data.l_id;
          if (!recordUserId || String(recordUserId).trim() === String(effectiveUserId).trim()) {
            return [data];
          } else {
            return [];
          }
        } else {
          return rejectWithValue('Invalid data format received from server');
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        return rejectWithValue('Failed to parse server response');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch insurance data');
    }
  }
);

// Create the slice
const healthInsuranceSlice = createSlice({
  name: 'healthInsurance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    resetData: (state) => {
      state.healthInsuranceData = [];
      state.error = null;
      state.successMessage = null;
    },
    // For testing/development purposes
    setMockData: (state) => {
      state.healthInsuranceData = [
        {
          h_i_n_id: '1',
          h_i_n_name: 'John Doe',
          h_i_n_email: 'john@example.com',
          h_i_n_phone: '9876543210',
          h_i_n_gender: 'Male',
          h_i_n_member: JSON.stringify(['Self', 'Spouse']),
          h_i_n_self_detail: 'Age 35',
          h_i_n_spouse_detail: 'Age 33',
          h_i_n_son_detail: '',
          h_i_n_daughter_detail: '',
          h_i_n_mother_detail: '',
          h_i_n_father_detail: '',
          h_i_n_nominee_name: 'Jane Doe',
          h_i_n_nominee_age: '33',
          h_i_n_nominee_relation: 'Spouse',
          h_i_n_dob: '1988-05-15',
          h_i_n_sum_insured: '500000',
          h_i_n_pincode: '110001',
          h_i_n_add_date: '2023-01-10',
          h_i_n_aadhar_photo: 'aadhar1.jpg',
          h_i_n_pan_photo: 'pan1.jpg',
          h_i_n_client_id: 'CLIENT001'
        },
        {
          h_i_n_id: '2',
          h_i_n_name: 'Jane Smith',
          h_i_n_email: 'jane@example.com',
          h_i_n_phone: '8765432109',
          h_i_n_gender: 'Female',
          h_i_n_member: JSON.stringify(['Self', 'Spouse', 'Son']),
          h_i_n_self_detail: 'Age 38',
          h_i_n_spouse_detail: 'Age 40',
          h_i_n_son_detail: 'Age 10',
          h_i_n_daughter_detail: '',
          h_i_n_mother_detail: '',
          h_i_n_father_detail: '',
          h_i_n_nominee_name: 'Mike Smith',
          h_i_n_nominee_age: '40',
          h_i_n_nominee_relation: 'Spouse',
          h_i_n_dob: '1985-03-20',
          h_i_n_sum_insured: '750000',
          h_i_n_pincode: '110002',
          h_i_n_add_date: '2023-02-15',
          h_i_n_aadhar_photo: 'aadhar2.jpg',
          h_i_n_pan_photo: 'pan2.jpg',
          h_i_n_client_id: 'CLIENT002'
        }
      ];
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthInsuranceData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthInsuranceData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.healthInsuranceData = action.payload;
        state.successMessage = 'Health insurance data fetched successfully';
      })
      .addCase(fetchHealthInsuranceData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch health insurance data';
      });
  }
});

export const { clearError, clearSuccess, resetData, setMockData } = healthInsuranceSlice.actions;
export default healthInsuranceSlice.reducer; 