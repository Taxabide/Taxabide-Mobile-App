/**
 * Network Utilities
 * Provides robust network status checking with fallbacks
 */

// Safely import NetInfo with fallback
let NetInfo;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (error) {
  console.log('NetInfo module not available, using fallback');
  // Fallback implementation
  NetInfo = {
    fetch: () => Promise.resolve({ isConnected: true }),
    addEventListener: () => {
      return () => {}; // Return unsubscribe function
    }
  };
}

/**
 * Check if the device is connected to the network
 * @return {Promise<boolean>} True if connected, false otherwise
 */
export const isNetworkConnected = async () => {
  try {
    const state = await NetInfo.fetch();
    return state?.isConnected ?? true; // Default to true if we can't determine
  } catch (error) {
    console.log('Error checking network connection:', error);
    return true; // Default to true if checking fails
  }
};

/**
 * Subscribe to network state changes
 * @param {Function} callback - Called when network state changes with a boolean indicating connected status
 * @return {Function} Unsubscribe function
 */
export const subscribeToNetworkChanges = (callback) => {
  try {
    return NetInfo.addEventListener(state => {
      callback(state?.isConnected ?? true);
    });
  } catch (error) {
    console.log('Error subscribing to network changes:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

export default {
  isNetworkConnected,
  subscribeToNetworkChanges
}; 