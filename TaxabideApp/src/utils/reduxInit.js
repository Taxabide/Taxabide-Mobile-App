import { store } from '../redux/store';
import { resetClientsState } from '../redux/slices/clientsSlice';

/**
 * Initialize Redux store to ensure all slices are properly set up
 */
export const initializeReduxStore = () => {
  // Ensure client slice is initialized
  store.dispatch(resetClientsState());
  
  console.log('Redux store initialized');
  return true;
};

export default initializeReduxStore; 