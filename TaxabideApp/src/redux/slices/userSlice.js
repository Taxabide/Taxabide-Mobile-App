import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state for the user slice
const initialState = {
  user: null,
  isLoading: false,
  error: null
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { email, password } = credentials;
      const emailParam = encodeURIComponent(email.trim());
      const passwordParam = encodeURIComponent(password.trim());
      const apiUrl = `https://taxabide.in/api/sign-in-api.php?email=${emailParam}&password=${passwordParam}`;
      
      const response = await fetch(apiUrl);
      const textResponse = await response.text();
      
      try {
        const result = JSON.parse(textResponse);
        
        if (result.success && result.data) {
          const user = result.data;
          
          const userData = {
            id: user.l_id || user.id || '',
            l_id: user.l_id || '',
            name: user.l_name?.trim() || '',
            email: user.l_email || email.trim(),
            mobile: user.l_number || user.l_mobile || '',
            pan: user.l_pan_no || user.pan || '',
          };
          
          // Store user data in AsyncStorage
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          
          return userData;
        } else {
          return rejectWithValue(result.message || 'Invalid login credentials.');
        }
      } catch (e) {
        return rejectWithValue('Invalid JSON response: ' + textResponse);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'An error occurred during login');
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('userData');
      return null;
    } catch (error) {
      return rejectWithValue(error.message || 'An error occurred during logout');
    }
  }
);

// Async thunk to restore user session
export const restoreUser = createAsyncThunk(
  'user/restore',
  async (_, { rejectWithValue }) => {
    try {
      // For now, we want to always show the sign-in screen, so we'll return null
      // even if there's stored user data
      return null;
      
      // Original implementation:
      // const jsonValue = await AsyncStorage.getItem('userData');
      // return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      return rejectWithValue('Failed to retrieve user data');
    }
  }
);

// Async thunk to update user data
export const updateUser = createAsyncThunk(
  'user/update',
  async (updatedData, { getState, rejectWithValue }) => {
    try {
      const currentUser = getState().user.user || {};
      const newUserData = { ...currentUser, ...updatedData };
      
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      console.log('User data updated:', newUserData);
      return newUserData;
    } catch (error) {
      console.error('Error updating user data:', error);
      return rejectWithValue(error.message || 'An error occurred during user update');
    }
  }
);

// Create the user slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
      
    // Restore user
    builder
      .addCase(restoreUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
      
    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer; 