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
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

// Add a helper function for URL handling
const BASE_URL = 'https://taxabide.in';
const getFullUrl = url => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}/${url.replace(/^\/+/, '')}`;
};

// Add comprehensive field name mapping to handle all possible API response formats
const getFieldValue = (item, fieldPaths, defaultValue = 'N/A') => {
  if (!item) return defaultValue;
  
  for (const path of fieldPaths) {
    if (item[path] !== undefined && item[path] !== null && item[path] !== '') {
      return item[path];
    }
  }
  
  return defaultValue;
};

const TwoWheelerInsuranceTable = ({ navigation }) => {
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
  
  // Get user ID and fetch insurance data on component mount
  useEffect(() => {
    fetchInsuranceData();
  }, []);

  // Get user ID from AsyncStorage
  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.l_id || parsedData.id || parsedData.user_id;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  // Fetch two-wheeler insurance data from API
  const fetchInsuranceData = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) {
        console.error('User ID not available');
        setLoading(false);
        return;
      }

      console.log('Fetching data for user ID:', userId);
      const response = await fetch(`https://taxabide.in/api/bike-insurance-new-list-api.php?user_id=${userId}`);
      const responseText = await response.text();
      
      console.log('Response received length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 200));
      
      // Check if response starts with '<' which indicates HTML content
      if (responseText.trim().startsWith('<')) {
        console.error('Received HTML instead of JSON');
        setInsuranceData([]);
        setLoading(false);
        return;
      }
      
      try {
        // Try to parse the response as JSON
        const data = JSON.parse(responseText);
        console.log('Parsed data type:', typeof data);
        
        if (Array.isArray(data)) {
          console.log('Data is an array with', data.length, 'items');
          setInsuranceData(data);
        } else if (data && data.status === 'success' && Array.isArray(data.data)) {
          console.log('Data has success status with', data.data.length, 'items');
          setInsuranceData(data.data);
        } else if (data && typeof data === 'object') {
          // Handle case where API returns a single object that needs to be converted to an array
          console.log('Data is a single object, converting to array');
          const dataArray = [data];
          setInsuranceData(dataArray);
        } else {
          console.log('Invalid data format received:', JSON.stringify(data).substring(0, 200));
          setInsuranceData([]);
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // Try to handle malformed JSON by fixing common issues
        try {
          // Sometimes APIs return JSON with unescaped line breaks or other issues
          const cleanedText = responseText.replace(/[\r\n]/g, ' ').trim();
          const data = JSON.parse(cleanedText);
          console.log('Parsed data after cleaning:', typeof data);
          if (Array.isArray(data)) {
            setInsuranceData(data);
          } else if (data && typeof data === 'object') {
            setInsuranceData([data]);
          } else {
            setInsuranceData([]);
          }
        } catch (secondError) {
          console.error('Failed second parse attempt:', secondError);
          setInsuranceData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching insurance data:', error);
      setInsuranceData([]);
    } finally {
      // Log the final state of the insurance data
      setTimeout(() => {
        console.log('Final insuranceData state:', 
          Array.isArray(insuranceData) ? 
          `Array with ${insuranceData.length} items` : 
          `Type: ${typeof insuranceData}`
        );
      }, 100);
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

  // Filter data based on search query
  const filteredData = insuranceData.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const searchTerms = searchQuery.toLowerCase();
    return (
      (item.t_w_i_name && item.t_w_i_name.toLowerCase().includes(searchTerms)) ||
      (item.t_w_i_email && item.t_w_i_email.toLowerCase().includes(searchTerms)) ||
      (item.t_w_i_phone && item.t_w_i_phone.toLowerCase().includes(searchTerms)) ||
      (item.t_w_i_vehicle_type && item.t_w_i_vehicle_type.toLowerCase().includes(searchTerms)) ||
      (item.t_w_i_registration_no && item.t_w_i_registration_no.toLowerCase().includes(searchTerms))
    );
  });

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

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
              <Text style={styles.modalTitle}>Insurance Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <DetailItem label="Name" value={getFieldValue(selectedInsurance, ['t_w_i_name'])} />
                <DetailItem label="Email" value={getFieldValue(selectedInsurance, ['t_w_i_email'])} />
                <DetailItem label="Phone" value={getFieldValue(selectedInsurance, ['t_w_i_phone'])} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <DetailItem label="Vehicle Type" value={getFieldValue(selectedInsurance, ['t_w_i_vehicle_type'])} />
                <DetailItem label="Registration Number" value={getFieldValue(selectedInsurance, ['t_w_i_registration_no'])} />
                <DetailItem label="Registration Date" value={getFieldValue(selectedInsurance, ['t_w_i_registration_date'])} />
                <DetailItem label="Policy Type" value={getFieldValue(selectedInsurance, ['t_w_i_policy_type'])} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Insurance Details</Text>
                <DetailItem label="Claim" value={getFieldValue(selectedInsurance, ['t_w_i_claim'])} />
                <DetailItem label="Old Insurance Expiry" value={getFieldValue(selectedInsurance, ['t_w_i_old_insurance_expiry_date'])} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Nominee Details</Text>
                <DetailItem label="Nominee Name" value={getFieldValue(selectedInsurance, ['t_w_i_nominee_name'])} />
                <DetailItem label="Nominee Age" value={getFieldValue(selectedInsurance, ['t_w_i_nominee_age'])} />
                <DetailItem label="Nominee Relation" value={getFieldValue(selectedInsurance, ['t_w_i_nominee_relation'])} />
              </View>
              
              {selectedInsurance.t_w_i_rc && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>RC Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.t_w_i_rc}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.t_w_i_rc}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {selectedInsurance.t_w_i_pan_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>PAN Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.t_w_i_pan_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.t_w_i_pan_photo}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedInsurance.t_w_i_vehicle_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Vehicle Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.t_w_i_vehicle_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.t_w_i_vehicle_photo}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {selectedInsurance.t_w_i_aadhar_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Aadhar Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.t_w_i_aadhar_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.t_w_i_aadhar_photo}`))}
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
                  value={getFieldValue(selectedInsurance, [
                    't_w_i_client_id', 
                    'client_id'
                  ], '#' + (selectedInsurance.t_w_i_id || ''))} 
                />
                <DetailItem 
                  label="Add Date" 
                  value={getFieldValue(selectedInsurance, [
                    't_w_i_add_date',
                    'add_date'
                  ])} 
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Two Wheeler Insurance Records</Text>
      </View>
      
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

      {/* Scroll indicator */}
      <View style={styles.scrollIndicator}>
        <Text style={styles.scrollIndicatorText}>Swipe left/right to see all columns</Text>
        <MaterialIcons name="swipe" size={20} color="#666" />
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
              <Text style={[styles.headerCell, styles.headerCellM]}>Vehicle Type</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Policy Type</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Registration Date</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Registration No</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>RC</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Claim</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Old Insurance Expiry Date</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Nominee Name</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Nominee Age</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Nominee Relation</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Vehicle Photo</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Aadhar Photo</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Pan Photo</Text>
              <Text style={[styles.headerCell, styles.headerCellM, styles.clientIdHeader]}>Client ID</Text>
              <Text style={[styles.headerCell, styles.headerCellM, styles.clientIdHeader]}>Add Date</Text>
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
                currentEntries.map((item, index) => (
                  <TouchableOpacity 
                    key={item.t_w_i_id || index} 
                    style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                    onPress={() => viewInsuranceDetails(item)}
                  >
                    <Text style={[styles.cell, styles.cellXS]}>{indexOfFirstEntry + index + 1}</Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_name'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellL]}>
                      {getFieldValue(item, ['t_w_i_email'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_phone'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_vehicle_type'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_policy_type'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_registration_date'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_registration_no'])}
                    </Text>
                    <View style={[styles.cell, styles.cellS]}>
                      <SimpleImage imageUrl={
                        getFieldValue(item, ['t_w_i_rc']) ? 
                        getFullUrl(`uploads/${getFieldValue(item, ['t_w_i_rc'])}`) : 
                        null
                      } />
                    </View>
                    <Text style={[styles.cell, styles.cellS]}>
                      {getFieldValue(item, ['t_w_i_claim'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_old_insurance_expiry_date'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_nominee_name'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellS]}>
                      {getFieldValue(item, ['t_w_i_nominee_age'])}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>
                      {getFieldValue(item, ['t_w_i_nominee_relation'])}
                    </Text>
                    <View style={[styles.cell, styles.cellS]}>
                      <SimpleImage imageUrl={
                        getFieldValue(item, ['t_w_i_vehicle_photo']) ? 
                        getFullUrl(`uploads/${getFieldValue(item, ['t_w_i_vehicle_photo'])}`) : 
                        null
                      } />
                    </View>
                    <View style={[styles.cell, styles.cellS]}>
                      <SimpleImage imageUrl={
                        getFieldValue(item, ['t_w_i_aadhar_photo']) ? 
                        getFullUrl(`uploads/${getFieldValue(item, ['t_w_i_aadhar_photo'])}`) : 
                        null
                      } />
                    </View>
                    <View style={[styles.cell, styles.cellS]}>
                      <SimpleImage imageUrl={
                        getFieldValue(item, ['t_w_i_pan_photo']) ? 
                        getFullUrl(`uploads/${getFieldValue(item, ['t_w_i_pan_photo'])}`) : 
                        null
                      } />
                    </View>
                    <Text style={[styles.cell, styles.cellM, styles.clientIdCell]}>
                      {getFieldValue(item, ['t_w_i_client_id', 'client_id'], '#' + (item.t_w_i_id || ''))}
                    </Text>
                    <Text style={[styles.cell, styles.cellM, styles.clientIdCell]}>
                      {getFieldValue(item, ['t_w_i_add_date', 'add_date'])}
                    </Text>
                  </TouchableOpacity>
                ))
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
    width: 2300, // Make it even wider to ensure all columns fit
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
});

export default TwoWheelerInsuranceTable; 