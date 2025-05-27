import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  TextInput
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchLifeInsuranceData } from '../../../redux/slices/lifeInsuranceSlice';

const { width } = Dimensions.get('window');

// Helper function for URL handling
const BASE_URL = 'https://taxabide.in';
const getFullUrl = url => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}/${url.replace(/^\/+/, '')}`;
};

// Field name mapping to handle all possible API response formats
const getFieldValue = (item, fieldPaths, defaultValue = 'N/A') => {
  if (!item) return defaultValue;
  
  for (const path of fieldPaths) {
    if (item[path] !== undefined && item[path] !== null && item[path] !== '') {
      return item[path];
    }
  }
  
  return defaultValue;
};

const LifeInsuranceInvestmentTable = ({ navigation }) => {
  const dispatch = useDispatch();
  const { lifeInsuranceData, isLoading } = useSelector(state => state.lifeInsurance);
  const [insuranceData, setInsuranceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [fullImageModal, setFullImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Fetch data whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, fetching updated data');
      const fetchData = async () => {
        const userId = await getUserId();
        setCurrentUserId(userId);
        fetchInsuranceData();
      };
      fetchData();
      return () => {
        // Cleanup function when screen loses focus
      };
    }, [])
  );

  // Get user ID and fetch insurance data on component mount
  useEffect(() => {
    const initData = async () => {
      const userId = await getUserId();
      setCurrentUserId(userId);
      fetchInsuranceData();
    };
    
    initData();
  }, []);

  // Update local state when Redux data changes
  useEffect(() => {
    if (lifeInsuranceData && Array.isArray(lifeInsuranceData)) {
      console.log('Updating local state from Redux data:', lifeInsuranceData.length, 'items');
      setInsuranceData(lifeInsuranceData);
      setLoading(false);
      setRefreshing(false);
    }
  }, [lifeInsuranceData]);

  // Get user ID from AsyncStorage
  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        // Try multiple possible user ID field names
        const userId = parsedData.l_id || parsedData.id || parsedData.user_id;
        console.log('Retrieved user ID:', userId);
        return userId;
      }
      console.log('No user data found in AsyncStorage');
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  // Fetch life insurance data from API
  const fetchInsuranceData = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      setCurrentUserId(userId);
      
      if (!userId) {
        console.error('User ID not available');
        setLoading(false);
        // Set a specific message for the UI to show when user ID is not available
        setInsuranceData([{ error: 'USER_ID_NOT_AVAILABLE' }]);
        return;
      }

      console.log('Dispatching Redux action to fetch data for user ID:', userId);
      // Use Redux to fetch the data
      dispatch(fetchLifeInsuranceData());
    } catch (error) {
      console.error('Error fetching insurance data:', error);
      setInsuranceData([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useEffect to log data after insuranceData state updates
  useEffect(() => {
    console.log('insuranceData updated: ', 
      Array.isArray(insuranceData) ? 
      `Array with ${insuranceData.length} items` : 
      `Type: ${typeof insuranceData}`
    );
    
    if (Array.isArray(insuranceData) && insuranceData.length > 0) {
      console.log('First record keys:', Object.keys(insuranceData[0]));
      console.log('Sample of first record:', JSON.stringify(insuranceData[0]).substring(0, 150));
    }
  }, [insuranceData]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInsuranceData();
  };

  // View insurance details
  const viewInsuranceDetails = (insurance) => {
    setSelectedInsurance(insurance);
    setModalVisible(true);
  };

  // Open image in full screen
  const viewFullImage = (imageUri) => {
    setSelectedImage(imageUri);
    setFullImageModal(true);
  };

  // Filter data based on search query and ensure it belongs to current user
  const filteredData = insuranceData.filter(item => {
    // Check for error markers
    if (item.error === 'USER_ID_NOT_AVAILABLE') {
      return true; // Keep error records to display the message
    }
    
    // First check if this record belongs to the current user
    // This provides additional filtering beyond the API call
    // Primary field name should be l_i_user_id sin
    // ce that's what's used in the database
    const recordUserId = getFieldValue(item, [
      'l_i_user_id', // Primary field name in database
      'user_id',
      'userid',
      'l_user_id'
    ]);
    
    console.log('Comparing record user ID (l_i_user_id):', recordUserId, 'with current user ID:', currentUserId);
    
    // If there is a user ID on the record, ensure it matches the current user
    // If the record has no user ID, include it in results (might be a system-wide record)
    const belongsToCurrentUser = 
      !recordUserId || 
      recordUserId === '' || 
      String(recordUserId).trim() === String(currentUserId).trim();
    
    if (!belongsToCurrentUser) {
      console.log('Filtering out record with non-matching l_i_user_id:', recordUserId);
      return false;
    }
    
    // Then apply search filter
    if (!searchQuery.trim()) return true;
    
    const searchTerms = searchQuery.toLowerCase();
    return (
      (item.l_i_name && item.l_i_name.toLowerCase().includes(searchTerms)) ||
      (item.l_i_email && item.l_i_email.toLowerCase().includes(searchTerms)) ||
      (item.l_i_phone && item.l_i_phone.toLowerCase().includes(searchTerms)) ||
      (item.l_i_aadhar && item.l_i_aadhar.toLowerCase().includes(searchTerms)) ||
      (item.l_i_pan && item.l_i_pan.toLowerCase().includes(searchTerms))
    );
  });

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  
  // Log filtered data for debugging
  useEffect(() => {
    console.log(`Showing ${filteredData.length} records after filtering by user ID and search`);
  }, [filteredData.length]);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return as is if not a valid date
      return date.toLocaleDateString();
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  // Detail modal content
  const renderDetailModal = () => {
    if (!selectedInsurance) return null;
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Life Insurance Investment Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <DetailItem label="ID" value={getFieldValue(selectedInsurance, ['l_i_id'])} />
                <DetailItem label="Name" value={getFieldValue(selectedInsurance, ['l_i_name'])} />
                <DetailItem label="Email" value={getFieldValue(selectedInsurance, ['l_i_email'])} />
                <DetailItem label="Phone" value={getFieldValue(selectedInsurance, ['l_i_phone'])} />
                <DetailItem label="Aadhar" value={getFieldValue(selectedInsurance, ['l_i_aadhar'])} />
                <DetailItem label="PAN" value={getFieldValue(selectedInsurance, ['l_i_pan'])} />
                <DetailItem label="Age" value={getFieldValue(selectedInsurance, ['l_i_age'])} />
                <DetailItem label="Gender" value={getFieldValue(selectedInsurance, ['l_i_gender'])} />
                <DetailItem label="Pincode" value={getFieldValue(selectedInsurance, ['l_i_pincode'])} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Investment Details</Text>
                <DetailItem label="Investment Plan" value={getFieldValue(selectedInsurance, ['l_i_investment_plan'])} />
                <DetailItem label="Investment Per Month" value={getFieldValue(selectedInsurance, ['l_i_investment_per_month'])} />
                <DetailItem label="Investment For Years" value={getFieldValue(selectedInsurance, ['l_i_investment_for_year'])} />
                <DetailItem label="Withdraw After Years" value={getFieldValue(selectedInsurance, ['l_i_withdraw_after_year'])} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Nominee Details</Text>
                <DetailItem label="Nominee Name" value={getFieldValue(selectedInsurance, ['l_i_nominee_name'])} />
                <DetailItem label="Nominee Age" value={getFieldValue(selectedInsurance, ['l_i_nominee_age'])} />
                <DetailItem label="Nominee Relation" value={getFieldValue(selectedInsurance, ['l_i_nominee_relation'])} />
              </View>
              
              {selectedInsurance.l_i_aadhar_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Aadhar Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.l_i_aadhar_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.l_i_aadhar_photo}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {selectedInsurance.l_i_pan_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>PAN Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.l_i_pan_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.l_i_pan_photo}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <DetailItem 
                  label="Client ID" 
                  value={getFieldValue(selectedInsurance, ['l_i_client_id', 'client_id'], '#' + (selectedInsurance.l_i_id || ''))} 
                />
                <DetailItem 
                  label="User ID" 
                  value={getFieldValue(selectedInsurance, ['l_i_user_id', 'user_id', 'userid'], 'N/A')} 
                />
                <DetailItem 
                  label="Add Date" 
                  value={formatDate(getFieldValue(selectedInsurance, ['l_i_add_date', 'created_at']))} 
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Full image modal
  const renderFullImageModal = () => {
    return (
      <Modal
        visible={fullImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageModal(false)}
      >
        <View style={styles.fullImageModalContainer}>
          <TouchableOpacity 
            style={styles.fullImageCloseButton}
            onPress={() => setFullImageModal(false)}
          >
            <MaterialIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    );
  };

  // Helper component for detail items
  const DetailItem = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  // Simple Image component for thumbnails
  const SimpleImage = ({ imageUrl }) => {
    if (!imageUrl) return <Text style={styles.noImageText}>No Img</Text>;
    
    return (
      <TouchableOpacity onPress={() => viewFullImage(imageUrl)}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnailImage}
          resizeMode="cover"
          onError={() => console.log('Image loading error')}
        />
      </TouchableOpacity>
    );
  };
  
  // Pagination controls
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <Text style={styles.paginationInfo}>
        Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredData.length)} of {filteredData.length} entries
      </Text>
      <View style={styles.paginationControls}>
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === 1 ? styles.pageButtonDisabled : null]}
          onPress={goToFirstPage}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>«</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === 1 ? styles.pageButtonDisabled : null]}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>‹</Text>
        </TouchableOpacity>
        
        {/* Current page indicator */}
        <View style={styles.currentPageButton}>
          <Text style={styles.currentPageText}>{currentPage}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === totalPages ? styles.pageButtonDisabled : null]}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.pageButtonText}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === totalPages ? styles.pageButtonDisabled : null]}
          onPress={goToLastPage}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.pageButtonText}>»</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add a useEffect hook to log the first item's structure to help debug missing fields
  useEffect(() => {
    if (insuranceData.length > 0) {
      console.log('First item keys:', Object.keys(insuranceData[0]));
    }
  }, [insuranceData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Life Insurance Investment Records</Text>
      </View>
      
      {/* Display user ID for debugging */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>User ID: {currentUserId || 'Not available'}</Text>
        </View>
      )}
      
      <View style={styles.filters}>
        <View style={styles.entriesContainer}>
          <TextInput
            style={styles.entriesInput}
            value={entriesPerPage.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 10;
              setEntriesPerPage(value);
              setCurrentPage(1); // Reset to first page when changing entries per page
            }}
            keyboardType="numeric"
          />
          <Text style={styles.entriesText}>entries per page</Text>
        </View>
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search:</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1); // Reset to first page when searching
            }}
            placeholder="Search..."
          />
        </View>
      </View>

      <View style={styles.scrollIndicator}>
        <Text style={styles.scrollIndicatorText}>
          <MaterialIcons name="swipe" size={16} color="#d32f2f" /> 
          <Text style={styles.emphasizedText}>Swipe right</Text> to see <Text style={styles.emphasizedText}>PAN Photo, Client ID, Add Date</Text>
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#487FFF" />
          <Text style={styles.loadingText}>Loading insurance data...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal={true}
          contentContainerStyle={styles.horizontalScrollContainer}
          showsHorizontalScrollIndicator={true}
          persistentScrollbar={true}
        >
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.headerCellXS]}>S.No.</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Name</Text>
              <Text style={[styles.headerCell, styles.headerCellL]}>Email</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Phone</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Aadhar</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>PAN</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Age</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Gender</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Pincode</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Investment Plan</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Nominee Name</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Nominee Age</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Nominee Relation</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Investment/Month</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Investment Years</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Withdraw Years</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Aadhar Photo</Text>
              <Text style={[styles.headerCell, styles.headerCellS, styles.importantHeader]}>PAN Photo</Text>
              <Text style={[styles.headerCell, styles.headerCellM, styles.importantHeader]}>Client ID</Text>
              <Text style={[styles.headerCell, styles.headerCellM, styles.importantHeader]}>Add Date</Text>
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.tableContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#487FFF"]}
                />
              }
            >
              {filteredData.length > 0 ? (
                // Check if we have an error message
                filteredData[0].error === 'USER_ID_NOT_AVAILABLE' ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#e57373" />
                    <Text style={styles.errorText}>Unable to access your data</Text>
                    <Text style={styles.errorSubtext}>Please log out and log in again</Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={onRefresh}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  currentEntries.map((item, index) => (
                    <TouchableOpacity 
                      key={item.l_i_id || index} 
                      style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                      onPress={() => viewInsuranceDetails(item)}
                    >
                      <Text style={[styles.cell, styles.cellXS]}>{indexOfFirstEntry + index + 1}</Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_name'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellL]}>
                        {getFieldValue(item, ['l_i_email'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_phone'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_aadhar'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_pan'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellS]}>
                        {getFieldValue(item, ['l_i_age'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellS]}>
                        {getFieldValue(item, ['l_i_gender'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_pincode'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_investment_plan'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_nominee_name'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellS]}>
                        {getFieldValue(item, ['l_i_nominee_age'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_nominee_relation'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_investment_per_month'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_investment_for_year'])}
                      </Text>
                      <Text style={[styles.cell, styles.cellM]}>
                        {getFieldValue(item, ['l_i_withdraw_after_year'])}
                      </Text>
                      <View style={[styles.cell, styles.cellS]}>
                        <SimpleImage imageUrl={
                          getFieldValue(item, ['l_i_aadhar_photo']) ? 
                          getFullUrl(`uploads/${getFieldValue(item, ['l_i_aadhar_photo'])}`) : 
                          null
                        } />
                      </View>
                      
                      <View style={[styles.cell, styles.cellS, styles.importantCell]}>
                        <SimpleImage imageUrl={
                          getFieldValue(item, ['l_i_pan_photo']) ? 
                          getFullUrl(`uploads/${getFieldValue(item, ['l_i_pan_photo'])}`) : 
                          null
                        } />
                        <Text style={styles.photoLabel}>PAN Photo</Text>
                      </View>
                      
                      <Text style={[styles.cell, styles.cellM, styles.importantCell]}>
                        {getFieldValue(item, ['l_i_client_id', 'client_id'], '#' + (item.l_i_id || ''))}
                      </Text>
                      
                      <Text style={[styles.cell, styles.cellM, styles.importantCell]}>
                        {formatDate(getFieldValue(item, ['l_i_add_date', 'created_at']))}
                      </Text>
                    </TouchableOpacity>
                  ))
                )
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="info-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No insurance records found</Text>
                  <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}
      
      {filteredData.length > 0 && renderPagination()}
      
      {renderDetailModal()}
      {renderFullImageModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entriesInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    textAlign: 'center',
    marginRight: 10,
  },
  entriesText: {
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchLabel: {
    marginRight: 10,
    color: '#666',
  },
  searchInput: {
    width: 250,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  horizontalScrollContainer: {
    flexGrow: 1,
  },
  tableContainer: {
    minWidth: width,
    width: 2600, // Increased width to ensure all columns are visible
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    height: 50,
    alignItems: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  headerCellXS: { width: 60 },
  headerCellS: { width: 100 },
  headerCellM: { width: 150 },
  headerCellL: { width: 200 },
  tableContent: {
    flexGrow: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 60, // Increased height for better visibility
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 13,
  },
  cellXS: { width: 60 },
  cellS: { width: 100 },
  cellM: { width: 150 },
  cellL: { width: 200 },
  thumbnailImage: {
    width: 50,
    height: 50,
    borderRadius: 3,
    backgroundColor: '#eee',
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationInfo: {
    color: '#666',
    fontSize: 14,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
  },
  pageButtonDisabled: {
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  pageButtonText: {
    color: '#333',
    fontSize: 16,
  },
  currentPageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#487FFF',
    marginHorizontal: 5,
  },
  currentPageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 15,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#487FFF',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  detailLabel: {
    fontWeight: '600',
    width: 150,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  documentImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  fullImageCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientIdHeader: {
    backgroundColor: '#e3f2fd',
    height: '100%',
    justifyContent: 'center',
  },
  clientIdCell: {
    backgroundColor: '#f5fbff',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollIndicatorText: {
    fontSize: 13,
    color: '#666',
    marginRight: 5,
  },
  debugInfo: {
    padding: 5,
    backgroundColor: '#ffeecc',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: '100%',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    marginTop: 15,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#487FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  importantHeader: {
    backgroundColor: '#e3f2fd',
    height: '100%',
    justifyContent: 'center',
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3',
    fontWeight: 'bold',
  },
  importantCell: {
    backgroundColor: '#f5fbff',
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3',
  },
  photoLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 3,
    color: '#666',
  },
  emphasizedText: {
    fontWeight: 'bold',
    color: '#d32f2f',
    fontSize: 15,
  },
});

export default LifeInsuranceInvestmentTable; 