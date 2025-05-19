/**
 * API Utility Functions
 * Provides robust API calls with error handling
 */
import axios from 'axios';

// Base URL for API
const BASE_URL = 'https://taxabide.in/api/';

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Safe API request function with proper error handling
 * @param {Object} config - Axios request config
 * @param {Function} onUploadProgress - Optional callback for tracking upload progress
 * @return {Promise} Result of the API call
 */
export const apiRequest = async (config, onUploadProgress = null) => {
  // Log request details for debugging
  console.log(`API Request to: ${config.url}`, {
    method: config.method,
    data: config.data,
    params: config.params
  });
  
  try {
    // Add upload progress tracking if provided
    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }
    
    const response = await axiosInstance(config);
    console.log(`API Response from ${config.url}:`, response.data);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    // More detailed error logging
    console.error(`API Error for ${config.url}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    // Handle different types of errors
    if (error.response) {
      // The server responded with a status code outside of 2xx
      return { 
        success: false, 
        error: `Server error (${error.response.status}): ${error.response.data?.message || 'Unknown server error'}`, 
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      return { 
        success: false, 
        error: 'No response from server. Please check your internet connection.',
        networkError: true
      };
    } else {
      // Something happened in setting up the request
      return { 
        success: false, 
        error: error.message || 'Request failed'
      };
    }
  }
};

/**
 * Safe fetch wrapper for API data
 * @param {string} endpoint - API endpoint
 * @param {Object} params - URL parameters
 * @return {Promise} API response
 */
export const fetchData = async (endpoint, params = {}) => {
  return apiRequest({
    method: 'GET',
    url: endpoint,
    params
  });
};

/**
 * Safe post wrapper for API data
 * @param {string} endpoint - API endpoint
 * @param {Object} data - POST data
 * @param {Object} headers - Optional additional headers
 * @param {Function} onUploadProgress - Optional callback for tracking upload progress
 * @return {Promise} API response
 */
export const postData = async (endpoint, data, headers = {}, onUploadProgress = null) => {
  return apiRequest({
    method: 'POST',
    url: endpoint,
    data,
    headers: {
      ...axiosInstance.defaults.headers,
      ...headers
    }
  }, onUploadProgress);
};

/**
 * Safe form data post wrapper for API
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data to submit
 * @param {Function} onUploadProgress - Optional callback for tracking upload progress
 * @return {Promise} API response
 */
export const postFormData = async (endpoint, formData, onUploadProgress = null) => {
  return apiRequest({
    method: 'POST',
    url: endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }, onUploadProgress);
};

export default {
  fetchData,
  postData,
  postFormData
}; 