/**
 * Loads custom fonts and resources for the application
 * This function returns a promise that resolves when resources are loaded
 * @returns {Promise} Promise that resolves when resources are loaded
 */
const loadFonts = async () => {
  try {
    // Simulate loading resources with a small delay
    // In a real app, you would load fonts using react-native-vector-icons configuration
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.warn('Error loading resources:', error);
    // Continue even if resource loading fails
    return true;
  }
};

export default loadFonts; 