import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (userId) => {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch('https://taxabide.in/api/order-list-api.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const text = await response.text();
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        return data.filter(item => 
          item.p_o_user_id && item.p_o_user_id.toString() === userId.toString()
        );
      }
      return [];
    } catch (error) {
      throw error;
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default orderSlice.reducer; 