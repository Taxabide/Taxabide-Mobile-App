import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility functions for authentication and user data
 */
const authUtils = {
  /**
   * Check if user is logged in
   * @returns {Promise<boolean>} True if user is logged in, false otherwise
   */
  isLoggedIn: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  /**
   * Get user data from AsyncStorage
   * @returns {Promise<Object|null>} User data object or null if not found
   */
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Get user ID from stored user data
   * @returns {Promise<string|null>} User ID or null if not found
   */
  getUserId: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        // Return user ID from different possible properties
        return parsedData.l_id || parsedData.id || parsedData.user_id || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  /**
   * Save user data to AsyncStorage
   * @param {Object} userData - User data to save
   * @returns {Promise<boolean>} Success status
   */
  saveUserData: async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  },

  /**
   * Clear user data from AsyncStorage (logout)
   * @returns {Promise<boolean>} Success status
   */
  clearUserData: async () => {
    try {
      await AsyncStorage.removeItem('userData');
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }
};

export default authUtils; 