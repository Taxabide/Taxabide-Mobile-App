import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import clientsReducer from './slices/clientsSlice';
import carInsuranceReducer from './slices/carInsuranceSlice';
import healthInsuranceReducer from './slices/healthInsuranceSlice';
import lifeInsuranceReducer from './slices/lifeInsuranceSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    clients: clientsReducer,
    carInsurance: carInsuranceReducer,
    healthInsurance: healthInsuranceReducer,
    lifeInsurance: lifeInsuranceReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store; 