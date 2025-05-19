import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import clientsReducer from './slices/clientsSlice';
import ordersReducer from './slices/ordersSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    clients: clientsReducer,
    orders: ordersReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store; 