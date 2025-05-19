import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Keyboard,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser as updateReduxUser } from '../../../redux/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileNavbar from '../NavBar/ProfileNavbar';
import apiService from '../../../utils/api';
import authUtils from '../../../utils/authUtils';
import { isNetworkConnected } from '../../../utils/networkUtils';

const ServiceList = ({navigation, route}) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStates, setSelectedStates] = useState({});
  const [selectedCategories, setSelectedCategories] = useState({});
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [localUserData, setLocalUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get current user from Redux
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
  // Function to fetch user data from AsyncStorage
  const fetchUserDataFromStorage = useCallback(async () => {
    try {
      // Use our auth utility instead of direct AsyncStorage access
      const userData = await authUtils.getUserData();
      if (userData) {
        console.log('User data from auth utils:', userData);
        setLocalUserData(userData);
        
        // If Redux store is empty but we have data, update Redux
        if (!user && userData) {
          console.log('Updating Redux store with data from auth utils');
          dispatch(updateReduxUser(userData));
        }
        
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, [user, dispatch]);
  
  // Load user data from AsyncStorage on component mount
  useEffect(() => {
    fetchUserDataFromStorage();
  }, [fetchUserDataFromStorage]);
  
  // Log user data to help debugging
  useEffect(() => {
    if (user) {
      console.log('Current signed-in user details from Redux:', JSON.stringify(user));
    } else if (localUserData) {
      console.log('Using local user data from AsyncStorage:', JSON.stringify(localUserData));
    } else {
      console.log('No user is currently signed in');
    }
  }, [user, localUserData]);

  // Handle route params search query on component mount
  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
  }, [route.params?.searchQuery]);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services whenever search query changes
  useEffect(() => {
    if (services.length > 0) {
      setSearchLoading(true);
      
      // Add a small delay to prevent excessive filtering on rapid typing
      const handler = setTimeout(() => {
        filterServices(searchQuery);
        setSearchLoading(false);
      }, 300);
      
      return () => clearTimeout(handler);
    }
  }, [searchQuery, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      console.log('Fetching services from API...');
      
      // Check network connectivity first
      const isConnected = await isNetworkConnected();
      if (!isConnected) {
        setError('No internet connection. Please check your network and try again.');
        setLoading(false);
        setInitialLoading(false);
        return;
      }
      
      // Use our robust API service
      const result = await apiService.fetchData('services-list-api.php');
      
      if (result.success && Array.isArray(result.data)) {
        // Process the data to ensure categories are properly formatted
        const processedServices = result.data.map(service => ({
          ...service,
          categories: Array.isArray(service.categories) ? service.categories : [],
        }));
        
        console.log(`Fetched ${processedServices.length} services successfully`);
        setServices(processedServices);
        
        if (searchQuery) {
          filterServices(searchQuery);
        } else {
          setFilteredServices(processedServices);
        }
      } else {
        console.error('Invalid API response format:', result.data);
        setError('Received invalid data format from API');
        setServices([]);
        setFilteredServices([]);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(`Failed to fetch services: ${err.message}`);
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const filterServices = useCallback((query) => {
    if (!query || query.trim() === '') {
      console.log('Empty query, showing all services');
      setFilteredServices(services);
      return;
    }

    console.log(`Filtering services with query: "${query}"`);
    const queryLower = query.toLowerCase().trim();
    
    const filtered = services.filter(service => {
      // Check service name
      if (service.s_name && service.s_name.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Check categories if they exist
      if (service.categories && Array.isArray(service.categories)) {
        return service.categories.some(category => 
          category.s_c_name && 
          category.s_c_name.toLowerCase().includes(queryLower)
        );
      }
      
      return false;
    });
    
    console.log(`Found ${filtered.length} matching services`);
    setFilteredServices(filtered);
  }, [services]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredServices(services);
    Keyboard.dismiss();
  };

  const handleStateChange = (serviceId, categoryId) => {
    // Find the selected category from the service
    const service = services.find(s => s.s_id === serviceId);
    if (!service || !service.categories) return;
    
    const selectedCategory = service.categories.find(c => c.s_c_id === categoryId);
    if (!selectedCategory) return;
    
    // Store both the state selection (by ID) and the full category object
    setSelectedStates({
      ...selectedStates,
      [serviceId]: categoryId
    });
    
    setSelectedCategories({
      ...selectedCategories,
      [serviceId]: selectedCategory
    });
    
    console.log(`Selected state for service ${serviceId}: ${selectedCategory.s_c_name}`);
  };

  const handlePlaceOrder = (item) => {
    // Check if this is a state type service and if state is selected
    const isStateService = item.s_type === 'state';
    const selectedCategoryId = selectedStates[item.s_id];
    const selectedCategory = selectedCategories[item.s_id];
    
    if (isStateService && !selectedCategoryId) {
      // Alert if state is required but not selected
      alert('Please select a state before placing the order');
      return;
    }
    
    // Find the matching category if not already selected
    let categoryData = selectedCategory;
    if (!categoryData && selectedCategoryId && item.categories) {
      categoryData = item.categories.find(c => c.s_c_id === selectedCategoryId);
    }
    
    const params = {
      serviceId: item.s_id,
      serviceName: item.s_name,
      servicePrice: item.s_price,
      categoryName: categoryData ? categoryData.s_c_name : null,
      categoryPrice: categoryData ? categoryData.s_c_price : null,
      selectedState: selectedCategoryId ? categoryData.s_c_name : null
    };
    
    console.log('Navigating to OrderScreen with params:', params);
    navigation.navigate('OrderScreen', params);
  };

  const renderServiceItem = ({item}) => {
    const isStateService = item.s_type === 'state';
    const hasCategories = item.categories && item.categories.length > 0;
    const selectedCategoryId = selectedStates[item.s_id];
    
    // Get the selected category details
    const selectedCategory = selectedCategoryId && item.categories 
      ? item.categories.find(c => c.s_c_id === selectedCategoryId)
      : null;

    // Calculate the total price (base price + category price if selected)
    const basePrice = parseFloat(item.s_price) || 0;
    const categoryPrice = selectedCategory ? parseFloat(selectedCategory.s_c_price) || 0 : 0;
    const totalPrice = basePrice + categoryPrice;

    return (
      <View style={styles.serviceCard}>
        <LinearGradient
          colors={['#1f1787', '#5c4db1', '#8a7ecc']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.serviceHeader}>
          <Text style={styles.serviceTitle}>{item.s_name}</Text>
          {selectedCategory && (
            <Text style={styles.selectedStateLabel}>
              Selected: {selectedCategory.s_c_name}
            </Text>
          )}
        </LinearGradient>

        <View style={styles.serviceBody}>
          <Text style={styles.servicePrice}>
            ₹{totalPrice.toFixed(2)}
          </Text>

          {isStateService && hasCategories && (
            <View style={styles.stateSelectContainer}>
              <Text style={styles.stateSelectLabel}>Select State</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStates[item.s_id] || ''}
                  onValueChange={(categoryId) => handleStateChange(item.s_id, categoryId)}
                  style={styles.statePicker}
                  mode="dropdown">
                  <Picker.Item 
                    label="-- Select State --" 
                    value="" 
                    style={styles.pickerPlaceholder}
                  />
                  {item.categories.map((category) => (
                    <Picker.Item
                      key={category.s_c_id}
                      label={`${category.s_c_name} (₹${parseFloat(category.s_c_price).toFixed(2)})`}
                      value={category.s_c_id}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
              
              {selectedCategory && (
                <View style={styles.selectedStateInfo}>
                  <Text style={styles.selectedStatePrice}>
                    State Price: ₹{parseFloat(selectedCategory.s_c_price).toFixed(2)}
                  </Text>
                  <Text style={styles.totalPriceLabel}>
                    Total Price: ₹{totalPrice.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.orderButton,
              isStateService && !selectedCategoryId ? styles.disabledButton : {},
              isStateService ? styles.orangeButton : {}
            ]}
            onPress={() => handlePlaceOrder(item)}
            disabled={isStateService && !selectedCategoryId}>
            <Text style={styles.orderButtonText}>
              {isStateService && !selectedCategoryId ? 'Select State First' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Function to get the current active user data
  const getCurrentUser = () => {
    return user || localUserData;
  };

  const toggleUserDetails = () => {
    setShowUserDetails(!showUserDetails);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserDataFromStorage();
    await fetchServices();
    setRefreshing(false);
  }, [fetchUserDataFromStorage]);

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f1787" />
        <Text>Loading services...</Text>
      </View>
    );
  }

  if (error && !services.length) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchServices} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfileNavbar 
        navigation={navigation}
        currentUser={getCurrentUser()}
        title="Services"
      />

      <View style={styles.mainContent}>
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Services Price List</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIconLeft} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchLoading ? (
            <ActivityIndicator size="small" color="#1f1787" style={styles.searchIndicator} />
          ) : searchQuery ? (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={handleClearSearch}
            >
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {filteredServices.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Icon name="file-search-outline" size={60} color="#c5c5c5" />
          <Text style={styles.noResultsText}>No services found</Text>
          <Text style={styles.noResultsSubText}>
            We couldn't find any services matching "{searchQuery}"
          </Text>
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceItem}
          keyExtractor={item => item.s_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1f1787']}
            />
          }
          ListFooterComponent={
            <View style={styles.listFooter}>
              <Text style={styles.resultCount}>
                Found {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 40,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B89DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
  },
  titleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f7fa',
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#212121',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 8,
  },
  searchIconLeft: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  searchIndicator: {
    marginRight: 8,
  },
  clearSearchButton: {
    padding: 8,
  },
  listContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  serviceHeader: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceBody: {
    padding: 16,
    backgroundColor: '#fff',
  },
  servicePrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f1787',
    marginBottom: 16,
  },
  prominentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#321095',
    marginBottom: 16,
    marginTop: 5,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stateSelectContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  stateSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 8,
    overflow: 'hidden',
  },
  statePicker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  selectedPickerDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 50,
  },
  selectedPickerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  clearSelectionButton: {
    padding: 5,
  },
  stateListContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 0,
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  stateList: {
    maxHeight: 250,
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  selectedStateItem: {
    backgroundColor: '#0064e1',
  },
  stateItemText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textTransform: 'uppercase',
  },
  stateItemPrice: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  selectedStateItemText: {
    color: '#ffffff',
  },
  orderButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'flex-end',
    elevation: 1,
  },
  orangeButton: {
    backgroundColor: '#ff5722',
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f7fa',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1f1787',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  clearButton: {
    backgroundColor: '#1f1787',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listFooter: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  dscCategoriesContainer: {
    marginBottom: 16,
  },
  dscHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#381f95',
    padding: 10,
    marginBottom: 15,
  },
  dscCategoryCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 0,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dscCategoryContent: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dscCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  dscCategoryPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'right',
  },
  selectedStateLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  pickerPlaceholder: {
    color: '#666',
    fontSize: 14,
  },
  pickerItem: {
    fontSize: 14,
    color: '#333',
  },
  selectedStateInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedStatePrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f1787',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.8,
  },
});

export default ServiceList;
