import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Initial state
const initialState = {
  clients: [],
  isLoading: false,
  error: null,
  success: false,
  selectedClient: null
};

// Helper function to get user ID from AsyncStorage
const getUserId = async () => {
  try {
    console.log('Getting user data from AsyncStorage...');
    const userData = await AsyncStorage.getItem('userData');
    console.log('userData from storage:', userData);
    
    if (!userData) {
      console.error('No userData found in AsyncStorage');
      return null;
    }
    
    try {
      const parsedData = JSON.parse(userData);
      const userId = parsedData.l_id || parsedData.id || parsedData.user_id || null;
      console.log('Parsed userId:', userId);
      return userId;
    } catch (parseError) {
      console.error('Error parsing userData JSON:', parseError);
      console.log('Raw userData content:', userData);
      return null;
    }
  } catch (error) {
    console.error('Error accessing AsyncStorage:', error);
    throw error;
  }
};

// Async thunk for fetching clients
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      // Get user ID
      let userId;
      try {
        userId = await getUserId();
        if (!userId) {
          console.error('User ID not available for fetching clients');
          return rejectWithValue('User ID not available. Please log in again.');
        }
      } catch (idError) {
        console.error('Error getting user ID:', idError);
        return rejectWithValue('Error retrieving user ID: ' + idError.message);
      }

      console.log('Fetching clients for user ID:', userId);
      const apiUrl = `https://taxabide.in/api/clients-list-api.php?user_id=${userId}`;
      console.log('API URL:', apiUrl);
      
      try {
        console.log('Starting fetch request...');
        const response = await fetch(apiUrl);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          console.error('Server response not OK:', response.status, response.statusText);
          return rejectWithValue(`Server error: ${response.status} ${response.statusText}`);
        }
        
        // Get the raw text response first for debugging
        const responseText = await response.text();
        console.log('Raw API response (first 200 chars):', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        // Try to parse the JSON - handle multiple scenarios
        let result;
        try {
          // Try standard JSON parse
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Standard JSON parse error:', parseError);
          
          // Check if response is empty
          if (!responseText.trim()) {
            console.error('Empty response received from API');
            return rejectWithValue('Server returned an empty response');
          }
          
          // Try handling non-standard responses
          try {
            // Try to fix common issues with the JSON
            const cleanedText = responseText
              .replace(/[\u0000-\u0019]+/g, '') // Remove control characters
              .trim();
              
            if (cleanedText.startsWith('[') && cleanedText.endsWith(']')) {
              // It's likely an array
              result = JSON.parse(cleanedText);
            } else if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
              // It's likely an object
              result = JSON.parse(cleanedText);
            } else {
              // Try to extract JSON from HTML or other formats
              const jsonMatch = cleanedText.match(/(\{.*\}|\[.*\])/s);
              if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
              } else {
                console.error('Could not extract valid JSON from response');
                return rejectWithValue('Invalid response format from server');
              }
            }
          } catch (fallbackError) {
            console.error('Fallback parsing also failed:', fallbackError);
            console.log('Invalid JSON response from API:', responseText);
            return rejectWithValue('Could not parse response from server');
          }
        }
        
        console.log('Response data type:', typeof result);
        console.log('Is array?', Array.isArray(result));
        
        // Handle the actual API response format
        if (Array.isArray(result)) {
          console.log('Received clients array directly:', result.length);
          return result; // Return the array directly
        } else if (result && typeof result === 'object') {
          // Case: {status: 'success', data: {client object}}
          if (result.status === 'success' && result.data && typeof result.data === 'object') {
            console.log('Found single client in result.data');
            
            // Check if data is a single client object (not an array)
            if (!Array.isArray(result.data)) {
              // Convert the single client object to an array with one item
              return [result.data];
            }
            // If data is already an array, return it
            return result.data;
          }
          
          // Handle API response with success/data properties
          if (result.success && result.data) {
            if (Array.isArray(result.data.data)) {
              console.log('Found client data as result.data.data array');
              return result.data.data;
            } else if (Array.isArray(result.data)) {
              console.log('Found client data as result.data array');
              return result.data;
            }
          }
          
          // Handle case when API returns an object with neither success nor expected data structure
          console.error('API returned unexpected format:', result);
          
          // Try to determine if we're dealing with an unconventional but usable response
          if (typeof result === 'object') {
            // If we have any properties that look like client data, create an array with this object
            if (result.c_id || result.c_name || result.id || result.name || 
                result.c_email || result.email || result.c_phone || result.phone) {
              console.log('Found client-like properties directly in result object');
              return [result];
            }
              
            // If there's a data property that might contain client info
            if (result.data && typeof result.data === 'object') {
              // Check if data property has client-like fields
              if (result.data.c_id || result.data.c_name || result.data.id || result.data.name) {
                console.log('Found client data in result.data');
                return [result.data];
              }
            }
          }
          
          if (result.message) {
            return rejectWithValue(result.message);
          } else {
            return rejectWithValue('API returned data in unknown format');
          }
        } else {
          console.error('API returned non-object, non-array result:', result);
          return rejectWithValue('Invalid API response format');
        }
      } catch (fetchError) {
        console.error('Error during fetch operation:', fetchError);
        return rejectWithValue(fetchError.message || 'Network error while fetching clients');
      }
    } catch (error) {
      console.error('Unexpected error in fetchClients:', error);
      return rejectWithValue(error.message || 'An unexpected error occurred');
    }
  }
);

// Async thunk for adding a client
export const addClient = createAsyncThunk(
  'clients/addClient',
  async (clientData, { rejectWithValue, dispatch }) => {
    try {
      // Validate input to ensure it's properly structured
      if (!clientData || typeof clientData !== 'object') {
        console.error('Invalid clientData provided:', clientData);
        return rejectWithValue('Invalid client data format');
      }

      // Ensure formData and files are objects
      if (!clientData.formData || typeof clientData.formData !== 'object') {
        console.error('Invalid formData in clientData:', clientData.formData);
        return rejectWithValue('Invalid form data format');
      }

      if (!clientData.files || typeof clientData.files !== 'object') {
        console.error('Invalid files in clientData:', clientData.files);
        return rejectWithValue('Invalid files format');
      }

      // Get user ID
      let userId;
      try {
        userId = await getUserId();
        if (!userId) {
          console.warn('User ID not available for adding client');
          return rejectWithValue('User ID not available');
        }
      } catch (idError) {
        console.error('Error getting user ID:', idError);
        return rejectWithValue('Error retrieving user ID');
      }

      console.log('Adding client for user ID:', userId);
      
      // Create FormData
      const formData = new FormData();
      
      // Add client data - with safer iteration
      try {
        const entries = Object.entries(clientData.formData);
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];
          const trimmedValue = value && typeof value === 'string' ? value.trim() : value;
          formData.append(`c_${key}`, trimmedValue);
        }
      } catch (formError) {
        console.error('Error processing form data:', formError);
        return rejectWithValue('Error processing form data: ' + formError.message);
      }
      
      // Add user ID
      formData.append('c_user_id', userId);
      
      // Add current date
      formData.append('c_add_date', new Date().toISOString().split('T')[0]);
      
      // Add files - with safer iteration
      try {
        const fileEntries = Object.entries(clientData.files);
        for (let i = 0; i < fileEntries.length; i++) {
          const [key, file] = fileEntries[i];
          if (file) {
            formData.append(`c_${key}`, {
              uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
              type: file.type || 'image/jpeg',
              name: file.name || `${key}_${Date.now()}.jpg`,
            });
          }
        }
      } catch (filesError) {
        console.error('Error processing files:', filesError);
        return rejectWithValue('Error processing files: ' + filesError.message);
      }
      
      // Log form data for debugging
      try {
        console.log('Submitting client data:', Object.fromEntries(formData));
      } catch (logError) {
        console.warn('Unable to log form data:', logError.message);
      }
      
      // Make API call
      try {
        console.log('Sending request to add client API...');
        const response = await fetch('https://taxabide.in/api/add-client-api.php', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (!response.ok) {
          console.error('Server returned error:', response.status, response.statusText);
          return rejectWithValue(`Server error: ${response.status}`);
        }
        
        // Log raw response for debugging
        const responseText = await response.text();
        console.log('Add client API raw response:', responseText);
        
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('Add client API parsed response:', result);
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          return rejectWithValue('Invalid response from server');
        }
        
        // Check if the response contains "success" as a message or status
        // even if it's in an unexpected format
        const responseTextLower = responseText.toLowerCase();
        if (responseTextLower.includes('success') || 
            responseTextLower.includes('inserted successfully') ||
            responseTextLower.includes('client added')) {
          console.log('Client added successfully based on response text');
          
          // After successful client addition, dispatch fetchClients to refresh the list
          setTimeout(() => {
            dispatch(fetchClients());
          }, 500);
          
          return true;
        }
        
        if (result.success || result.status === 'success') {
          console.log('Client added successfully, refreshing clients list');
          
          // After successful client addition, dispatch fetchClients to refresh the list
          setTimeout(() => {
            dispatch(fetchClients());
          }, 500);
          
          return true;
        } else {
          // Check if message contains success text despite status not being success
          if (result.message && 
             (result.message.toLowerCase().includes('success') || 
              result.message.toLowerCase().includes('inserted successfully'))) {
            console.log('Client added successfully despite error status');
            setTimeout(() => {
              dispatch(fetchClients());
            }, 500);
            return true;
          }
          
          console.error('API returned error message:', result.message || 'Unknown error');
          return rejectWithValue(result.message || 'Failed to add client');
        }
      } catch (apiError) {
        console.error('API error when adding client:', apiError);
        return rejectWithValue(apiError.message || 'Network error while adding client');
      }
    } catch (error) {
      console.error('Unexpected error in addClient:', error);
      return rejectWithValue('Unexpected error: ' + (error.message || 'Unknown error'));
    }
  }
);

// Create clients slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
    },
    resetError: (state) => {
      state.error = null;
    },
    resetClientsState: (state) => {
      state.clients = [];
      state.isLoading = false;
      state.error = null;
      state.success = false;
      state.selectedClient = null;
    },
    selectClient: (state, action) => {
      state.selectedClient = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch clients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        // Ensure action.payload is an array
        if (Array.isArray(action.payload)) {
          state.clients = action.payload;
        } else if (action.payload && typeof action.payload === 'object') {
          // Handle case of single client object
          state.clients = [action.payload];
        } else {
          console.warn('fetchClients.fulfilled received invalid payload:', action.payload);
          // Keep existing clients if payload is invalid
        }
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Don't clear clients array on error to preserve existing data
      });
    
    // Add client
    builder
      .addCase(addClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addClient.fulfilled, (state) => {
        state.isLoading = false;
        state.success = true;
        // We don't update clients here, as we'll trigger a fetchClients afterward
      })
      .addCase(addClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

// Export actions
export const { 
  resetSuccess, 
  resetError, 
  resetClientsState,
  selectClient
} = clientsSlice.actions;

// Selectors
export const selectSelectedClient = (state) => state.clients.selectedClient;

// Export reducer
export default clientsSlice.reducer; 