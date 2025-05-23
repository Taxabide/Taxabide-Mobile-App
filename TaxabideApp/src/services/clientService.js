import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://taxabide.in/api/clients-list-api.php';

/**
 * Client Service - Handles fetching and processing client data
 */
class ClientService {
  /**
   * Get user ID from AsyncStorage
   * @returns {Promise<string|null>} User ID or null if not found
   */
  static async getUserId() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.error('No userData found in AsyncStorage');
        return null;
      }
      
      const parsedData = JSON.parse(userData);
      const userId = parsedData.l_id || parsedData.id || parsedData.user_id || null;
      return userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Fetch clients from the API
   * @returns {Promise<Array>} Array of clients or empty array if none found
   */
  static async fetchClients() {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        console.warn('No user ID available');
        return [];
      }

      const response = await fetch(`${API_URL}?user_id=${userId}`);
      
      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      // Check for error response from API
      if (data.status === 'error') {
        console.warn('API returned error:', data.message);
        return [];
      }
      
      // Handle different response formats
      let clients = [];
      
      if (Array.isArray(data)) {
        clients = data;
      } else if (data.data && Array.isArray(data.data)) {
        clients = data.data;
      } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        // Single client object
        clients = [data.data];
      } else if (typeof data === 'object' && Object.keys(data).length) {
        // Try to extract client data from unknown structure
        clients = this.extractClientsFromData(data);
      }
      
      return this.formatClients(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  /**
   * Try to extract client data from unknown API response structure
   * @param {Object} data - API response data
   * @returns {Array} Extracted client array or empty array if none found
   */
  static extractClientsFromData(data) {
    // Check if it's a single client object
    if (data.name || data.c_name || data.email || data.c_email) {
      return [data];
    }
    
    // Look for arrays in the data
    for (const key in data) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
    
    return [];
  }

  /**
   * Format client data to consistent structure with only name and email
   * @param {Array} clients - Raw client array from API
   * @returns {Array} Formatted client array
   */
  static formatClients(clients) {
    if (!Array.isArray(clients)) return [];
    
    return clients.map(client => {
      // Extract the ID from any possible property
      const id = client.id || client.c_id || client.client_id || Date.now().toString();
      
      // Extract name from any possible property
      const name = client.name || client.c_name || client.client_name || '(No Name)';
      
      // Extract email from any possible property
      const email = client.email || client.c_email || client.client_email || '';
      
      // Extract phone from any possible property (for internal reference)
      const phone = client.phone || client.c_phone || client.client_phone || '';
      
      return { id, name, email, phone };
    }).filter(client => client.name && client.name !== '(No Name)');
  }
}

export default ClientService; 