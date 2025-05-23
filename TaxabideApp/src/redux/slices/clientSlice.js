import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/apiService';

// Fetch clients from API
export const fetchClients = createAsyncThunk(
  'client/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getClients();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

// Add a new client
export const addNewClient = createAsyncThunk(
  'client/addClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await api.addClient(clientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add client');
    }
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState: {
    clients: [],
    selectedClient: null,
    status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    addClientStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    addClientError: null,
  },
  reducers: {
    selectClient: (state, action) => {
      state.selectedClient = action.payload;
    },
    clearSelectedClient: (state) => {
      state.selectedClient = null;
    },
    // Add a reducer to reset the state
    resetClientState: (state) => {
      state.clients = [];
      state.selectedClient = null;
      state.status = 'idle';
      state.error = null;
      state.addClientStatus = 'idle';
      state.addClientError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchClients
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Handle addNewClient
      .addCase(addNewClient.pending, (state) => {
        state.addClientStatus = 'loading';
      })
      .addCase(addNewClient.fulfilled, (state, action) => {
        state.addClientStatus = 'succeeded';
        if (action.payload) {
          state.clients.push(action.payload);
        }
        state.addClientError = null;
      })
      .addCase(addNewClient.rejected, (state, action) => {
        state.addClientStatus = 'failed';
        state.addClientError = action.payload;
      });
  },
});

export const { selectClient, clearSelectedClient, resetClientState } = clientSlice.actions;

// Selectors with safe fallbacks
export const selectAllClients = (state) => state?.client?.clients || [];
export const selectClientById = (state, clientId) => 
  state?.client?.clients?.find(client => client?.id === clientId) || null;
export const selectClientStatus = (state) => state?.client?.status || 'idle';
export const selectClientError = (state) => state?.client?.error || null;
export const selectSelectedClient = (state) => state?.client?.selectedClient || null;

export default clientSlice.reducer; 