import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL should be configured in an environment variable in a real app
const BASE_URL = 'https://taxabide-api.yourdomain.com/api'; // Replace with your actual API URL

// Sample mock data for development - remove this in production
const MOCK_DATA = {
  clients: [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '9876543210', gender: 'Male', age: '35', pan: 'ABCDE1234F' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '8765432109', gender: 'Female', age: '28', pan: 'FGHIJ5678K' },
    { id: 3, name: 'Robert Johnson', email: 'robert@example.com', phone: '7654321098', gender: 'Male', age: '42', pan: 'KLMNO9101P' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '6543210987', gender: 'Female', age: '31', pan: 'QRSTU2345V' },
    { id: 5, name: 'Michael Brown', email: 'michael@example.com', phone: '5432109876', gender: 'Male', age: '39', pan: 'WXYZA6789B' },
    { id: 6, name: 'Emily Davis', email: 'emily@example.com', phone: '4321098765', gender: 'Female', age: '27', pan: 'CDEFG1234H' },
    { id: 7, name: 'David Miller', email: 'david@example.com', phone: '3210987654', gender: 'Male', age: '45', pan: 'IJKLM5678N' },
    { id: 8, name: 'Sophia Wilson', email: 'sophia@example.com', phone: '2109876543', gender: 'Female', age: '33', pan: 'OPQRS9101T' },
    { id: 9, name: 'James Taylor', email: 'james@example.com', phone: '1098765432', gender: 'Male', age: '29', pan: 'UVWXY2345Z' },
    { id: 10, name: 'Olivia Anderson', email: 'olivia@example.com', phone: '0987654321', gender: 'Female', age: '36', pan: 'ABCDE6789F' }
  ]
};

// Use environment variables to determine if mock mode is enabled
const USE_MOCK_API = true; // Set to false when connecting to real API

// Configuration
const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiService.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Mock API implementation
const mockApi = {
  get: (endpoint) => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        if (endpoint === '/clients') {
          resolve({ data: MOCK_DATA.clients });
        } else {
          resolve({ data: null });
        }
      }, 500);
    });
  },
  
  post: (endpoint, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/clients') {
          const newClient = {
            id: MOCK_DATA.clients.length + 1,
            ...data
          };
          MOCK_DATA.clients.push(newClient);
          resolve({ data: newClient });
        } else {
          resolve({ data: null });
        }
      }, 500);
    });
  }
};

// Exported API functions
export const api = {
  // Clients
  getClients: () => {
    return USE_MOCK_API ? mockApi.get('/clients') : apiService.get('/clients');
  },
  
  addClient: (clientData) => {
    return USE_MOCK_API ? mockApi.post('/clients', clientData) : apiService.post('/clients', clientData);
  },
  
  // Add more API endpoints as needed
};

export default api; 