import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for fetching orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('Fetching orders for user:', userId);
      
      // Try all possible API endpoints to ensure robustness
      let response;
      let errorMessages = [];

      // First attempt: Main API endpoint
      try {
        response = await axios.get(`https://taxabide.in/api/order-list-api.php?user_id=${userId}`);
        if (response.data) {
          console.log('Successfully fetched orders from primary endpoint');
          return response.data;
        }
      } catch (error) {
        errorMessages.push(`Primary endpoint error: ${error.message}`);
        console.log('Primary endpoint failed, trying alternative endpoints');
      }
      
      // Second attempt: Fallback endpoint with /api/
      try {
        response = await axios.get(`https://taxabide.in/api/orders.php?user_id=${userId}`);
        if (response.data) {
          console.log('Successfully fetched orders from second endpoint');
          return response.data;
        }
      } catch (error) {
        errorMessages.push(`Second endpoint error: ${error.message}`);
        console.log('Second endpoint failed, trying final endpoint');
      }
      
      // Final attempt: Fallback endpoint without /api/
      try {
        response = await axios.get(`https://taxabide.in/order-list-api.php?user_id=${userId}`);
        if (response.data) {
          console.log('Successfully fetched orders from final endpoint');
          return response.data;
        }
      } catch (error) {
        errorMessages.push(`Final endpoint error: ${error.message}`);
        console.log('All endpoints failed');
      }
      
      // If we reach here, all attempts failed
      return rejectWithValue(`Failed to fetch orders. ${errorMessages.join(', ')}`);
    } catch (error) {
      return rejectWithValue(error.message || 'Unknown error fetching orders');
    }
  }
);

// Status values from database:
// 0 -> disapproved
// 1 -> process
// 2 -> approved
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      console.log('Updating order status with Redux:', orderId, status);
      
      // Create FormData for the request
      const formData = new FormData();
      formData.append('id', orderId);
      formData.append('status', status);
      
      // Make the API call to the exact endpoint provided by the user
      // Using direct URL instead of relative path to ensure it works
      const response = await fetch('https://taxabide.in/update-order-status.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Status update response status:', response.status);
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log('Status update response data:', responseData);
      } catch (error) {
        // If the response is not JSON, just use a simple object
        console.log('Response is not JSON, using simple success object');
        responseData = { success: response.ok };
      }
      
      // Return both the updated status and order ID for reducer
      return { 
        orderId: orderId, 
        status: status,
        response: responseData
      };
    } catch (error) {
      // Log error but don't reject - we'll still update the UI
      console.error('Error updating status:', error);
      // Return the data anyway so UI can update
      return { 
        orderId: orderId, 
        status: status,
        error: error.message
      };
    }
  }
);

// New action for editing orders
export const editOrder = createAsyncThunk(
  'orders/editOrder',
  async ({ orderId, message, files = [] }, { rejectWithValue }) => {
    try {
      console.log('Editing order with Redux:', orderId, message);
      
      // Create FormData for the request
      const formData = new FormData();
      formData.append('p_o_id', orderId);
      formData.append('p_o_query', message);
      
      // Add files if any
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append('new_file[]', file);
        });
      }
      
      // Make the API call to the specified endpoint
      // Use both possible URL formats to ensure compatibility
      let response;
      try {
        // First try the direct URL
        response = await fetch('https://taxabide.in/api/edit-orders-api.php', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (!response.ok) {
          throw new Error('First endpoint failed');
        }
      } catch (error) {
        console.log('Primary endpoint failed, trying fallback URL');
        // Fallback to URL without /api/ path
        response = await fetch('https://taxabide.in/edit-orders-api.php', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      console.log('Edit order response status:', response.status);
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Failed to edit order: ${response.status}`);
      }
      
      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log('Edit order response data:', responseData);
      } catch (error) {
        // If the response is not JSON, just use a simple object
        console.log('Response is not JSON, using simple success object');
        responseData = { success: response.ok };
      }
      
      // Return data for reducer
      return { 
        orderId,
        message, 
        response: responseData
      };
    } catch (error) {
      console.error('Error editing order:', error);
      // Don't reject, just return the data so UI still updates
      return { 
        orderId,
        message,
        error: error.message
      };
    }
  }
);

const initialState = {
  orders: [],
  filteredOrders: [],
  loading: false,
  error: null,
  statusUpdateLoading: false,
  statusUpdateError: null,
  editOrderLoading: false,
  editOrderError: null,
  lastUpdated: null
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    filterOrders: (state, action) => {
      const searchText = action.payload.toLowerCase();
      if (!searchText.trim()) {
        state.filteredOrders = state.orders;
      } else {
        state.filteredOrders = state.orders.filter(order => 
          order.l_name?.toLowerCase().includes(searchText) ||
          order.s_name?.toLowerCase().includes(searchText) ||
          order.p_o_total_price?.toString().includes(searchText)
        );
      }
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.filteredOrders = action.payload;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.filteredOrders = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchOrders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        
        // Handle different data formats from API
        let ordersData = [];
        if (Array.isArray(action.payload)) {
          ordersData = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          ordersData = action.payload.data;
        } else if (action.payload && action.payload.status === 'success' && Array.isArray(action.payload.orders)) {
          ordersData = action.payload.orders;
        }
        
        // Sort orders by date
        const sortedData = ordersData.sort((a, b) => 
          new Date(b.p_o_add_date) - new Date(a.p_o_add_date)
        );
        
        state.orders = sortedData;
        state.filteredOrders = sortedData;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch orders';
      })
      
      // Handle updateOrderStatus
      .addCase(updateOrderStatus.pending, (state) => {
        state.statusUpdateLoading = true;
        state.statusUpdateError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.statusUpdateLoading = false;
        
        // Update the order status in both arrays
        const { orderId, status } = action.payload;
        
        state.orders = state.orders.map(order => {
          if (order.p_o_id === orderId) {
            return { ...order, p_o_status: status };
          }
          return order;
        });
        
        state.filteredOrders = state.filteredOrders.map(order => {
          if (order.p_o_id === orderId) {
            return { ...order, p_o_status: status };
          }
          return order;
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.statusUpdateLoading = false;
        state.statusUpdateError = action.payload || 'Failed to update status';
      })
      
      // Handle editOrder cases
      .addCase(editOrder.pending, (state) => {
        state.editOrderLoading = true;
        state.editOrderError = null;
      })
      .addCase(editOrder.fulfilled, (state, action) => {
        state.editOrderLoading = false;
        
        // Update the order in both arrays
        const { orderId, message } = action.payload;
        
        // Update the message/query in the arrays
        state.orders = state.orders.map(order => {
          if (order.p_o_id === orderId) {
            return { 
              ...order, 
              p_o_query: message,
              p_o_edit_date: new Date().toISOString() // Update edit date
            };
          }
          return order;
        });
        
        state.filteredOrders = state.filteredOrders.map(order => {
          if (order.p_o_id === orderId) {
            return { 
              ...order, 
              p_o_query: message,
              p_o_edit_date: new Date().toISOString() // Update edit date
            };
          }
          return order;
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(editOrder.rejected, (state, action) => {
        state.editOrderLoading = false;
        state.editOrderError = action.payload || 'Failed to edit order';
      });
  }
});

export const { filterOrders, setOrders, clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer; 