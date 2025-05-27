import React, { useState, useEffect, useMemo } from 'react';
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
import { fetchHealthInsuranceData, setMockData } from '../../../redux/slices/healthInsuranceSlice';

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
  
  if (typeof fieldPaths === 'string') {
    // Handle single field name
    if (item[fieldPaths] !== undefined && item[fieldPaths] !== null && item[fieldPaths] !== '') {
      return item[fieldPaths];
    }
    return defaultValue;
  }
  
  // Handle array of possible field names
  for (const path of fieldPaths) {
    if (item[path] !== undefined && item[path] !== null && item[path] !== '') {
      return item[path];
    }
  }
  
  return defaultValue;
};

const HealthInsuranceTable = ({ navigation }) => {
  const dispatch = useDispatch();
  const { healthInsuranceData, isLoading, error } = useSelector(state => state.healthInsurance);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [fullImageModal, setFullImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

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

  // Fetch insurance data on component mount
  useEffect(() => {
    const initData = async () => {
      const userId = await getUserId();
      setCurrentUserId(userId);
      fetchInsuranceData();
    };
    
    initData();
  }, []);

  // Fetch health insurance data using Redux
  const fetchInsuranceData = async () => {
    try {
      const userId = await getUserId();
      setCurrentUserId(userId);
      
      if (!userId) {
        console.error('User ID not available');
        return;
      }

      console.log('Dispatching Redux action to fetch data for user ID:', userId);
      setRefreshing(true);
      await dispatch(fetchHealthInsuranceData(userId)).unwrap();
      setRefreshing(false);
    } catch (err) {
      console.error("Error fetching health insurance data:", err);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInsuranceData();
  };

  // Load mock data (for testing)
  const loadMockData = () => {
    dispatch(setMockData());
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

  // Filter data based on search query and user ID
  const filteredData = useMemo(() => {
    try {
      if (!Array.isArray(healthInsuranceData)) {
        return [];
      }
      
      // First filter by user ID
      const userFiltered = healthInsuranceData.filter(item => {
        if (!item) return false;
        
        // Check if record belongs to current user
        const recordUserId = getFieldValue(item, [
          'h_i_n_user_id', // Primary field name
          'user_id',
          'userid',
          'h_user_id'
        ]);
        
        // If there is a user ID on the record, ensure it matches the current user
        return !recordUserId || 
               recordUserId === '' || 
               String(recordUserId).trim() === String(currentUserId).trim();
      });
      
      // Then apply search filter
      return userFiltered.filter(item => {
        if (!searchQuery.trim()) return true;
        
        const searchTerm = searchQuery.toLowerCase();
        
        return (
          (item.h_i_n_name && item.h_i_n_name.toLowerCase().includes(searchTerm)) ||
          (item.h_i_n_email && item.h_i_n_email.toLowerCase().includes(searchTerm)) ||
          (item.h_i_n_phone && item.h_i_n_phone.toLowerCase().includes(searchTerm)) ||
          (item.h_i_n_client_id && item.h_i_n_client_id.toLowerCase().includes(searchTerm))
        );
      });
    } catch (err) {
      console.error('Error filtering data:', err);
      return [];
    }
  }, [healthInsuranceData, searchQuery, currentUserId]);

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  
  // Safely get current entries for display
  const currentEntries = useMemo(() => {
    try {
      if (!Array.isArray(filteredData)) {
        return [];
      }
      return filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
    } catch (err) {
      console.error('Error calculating pagination:', err);
      return [];
    }
  }, [filteredData, indexOfFirstEntry, indexOfLastEntry]);
  
  const totalPages = Math.max(1, Math.ceil((Array.isArray(filteredData) ? filteredData.length : 0) / entriesPerPage));
  
  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Detail modal content
  const renderDetailModal = () => {
    if (!selectedInsurance) return null;
    
    const hasAadharPhoto = selectedInsurance.h_i_n_aadhar_photo && typeof selectedInsurance.h_i_n_aadhar_photo === 'string';
    const hasPanPhoto = selectedInsurance.h_i_n_pan_photo && typeof selectedInsurance.h_i_n_pan_photo === 'string';
    
    // Helper function to format members array for display
    const formatMembers = (insurance) => {
      if (!insurance.h_i_n_member) return 'None';
      
      try {
        // Handle case where member is a string (JSON array)
        if (typeof insurance.h_i_n_member === 'string') {
          const members = JSON.parse(insurance.h_i_n_member);
          if (Array.isArray(members)) {
            return members.join(', ');
          }
        }
        
        // Handle case where member is already an array
        if (Array.isArray(insurance.h_i_n_member)) {
          return insurance.h_i_n_member.join(', ');
        }
        
        return insurance.h_i_n_member.toString();
      } catch (err) {
        console.error('Error formatting members:', err);
        return insurance.h_i_n_member.toString();
      }
    };
    
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
              <Text style={styles.modalTitle}>Health Insurance Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <DetailItem label="Name" value={getFieldValue(selectedInsurance, 'h_i_n_name')} />
                <DetailItem label="Email" value={getFieldValue(selectedInsurance, 'h_i_n_email')} />
                <DetailItem label="Phone" value={getFieldValue(selectedInsurance, 'h_i_n_phone')} />
                <DetailItem label="Gender" value={getFieldValue(selectedInsurance, 'h_i_n_gender')} />
                <DetailItem label="Date of Birth" value={getFieldValue(selectedInsurance, 'h_i_n_dob')} />
                <DetailItem label="Pincode" value={getFieldValue(selectedInsurance, 'h_i_n_pincode')} />
                <DetailItem label="Client ID" value={getFieldValue(selectedInsurance, 'h_i_n_client_id')} />
                <DetailItem label="Added On" value={getFieldValue(selectedInsurance, 'h_i_n_add_date')} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Coverage Information</Text>
                <DetailItem label="Members" value={formatMembers(selectedInsurance)} />
                <DetailItem label="Self Details" value={getFieldValue(selectedInsurance, 'h_i_n_self_detail')} />
                <DetailItem label="Spouse Details" value={getFieldValue(selectedInsurance, 'h_i_n_spouse_detail')} />
                <DetailItem label="Son Details" value={getFieldValue(selectedInsurance, 'h_i_n_son_detail')} />
                <DetailItem label="Daughter Details" value={getFieldValue(selectedInsurance, 'h_i_n_daughter_detail')} />
                <DetailItem label="Mother Details" value={getFieldValue(selectedInsurance, 'h_i_n_mother_detail')} />
                <DetailItem label="Father Details" value={getFieldValue(selectedInsurance, 'h_i_n_father_detail')} />
                <DetailItem label="Sum Insured" value={getFieldValue(selectedInsurance, 'h_i_n_sum_insured')} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Nominee Details</Text>
                <DetailItem label="Nominee Name" value={getFieldValue(selectedInsurance, 'h_i_n_nominee_name')} />
                <DetailItem label="Nominee Age" value={getFieldValue(selectedInsurance, 'h_i_n_nominee_age')} />
                <DetailItem label="Nominee Relation" value={getFieldValue(selectedInsurance, 'h_i_n_nominee_relation')} />
              </View>
              
              {hasAadharPhoto && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Aadhar Photos</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.h_i_n_aadhar_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={() => console.log('Modal image error')}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.h_i_n_aadhar_photo}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {hasPanPhoto && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>PAN Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: getFullUrl(`uploads/${selectedInsurance.h_i_n_pan_photo}`) }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={() => console.log('Modal image error')}
                    />
                    <TouchableOpacity 
                      style={styles.fullscreenButton}
                      onPress={() => viewFullImage(getFullUrl(`uploads/${selectedInsurance.h_i_n_pan_photo}`))}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
            style={styles.closeFullImageButton}
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

  // Detail item component for the modal
  const DetailItem = ({ label, value }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  // Simple image component for table cells
  const SimpleImage = ({ imageUrl }) => {
    if (!imageUrl) {
      return (
        <View style={styles.noImage}>
          <MaterialIcons name="image-not-supported" size={16} color="#999" />
        </View>
      );
    }
    
    return (
      <TouchableOpacity onPress={() => viewFullImage(imageUrl)}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  // Pagination component
  const renderPagination = () => (
    <View style={styles.pagination}>
      <View style={styles.paginationInfo}>
        <Text style={styles.paginationText}>
          Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredData.length)} of {filteredData.length} entries
        </Text>
      </View>
      
      <View style={styles.paginationControls}>
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 ? styles.paginationButtonDisabled : null]} 
          onPress={goToFirstPage}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationButtonText}>First</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 ? styles.paginationButtonDisabled : null]} 
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationButtonText}>Prev</Text>
        </TouchableOpacity>
        
        <View style={styles.paginationPageInfo}>
          <Text style={styles.paginationText}>{currentPage} of {totalPages}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages ? styles.paginationButtonDisabled : null]} 
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Next</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages ? styles.paginationButtonDisabled : null]} 
          onPress={goToLastPage}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Last</Text>
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
        <Text style={styles.headerTitle}>Health Insurance Clients</Text>
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
            keyboardType="number-pad" 
            value={entriesPerPage.toString()}
            onChangeText={(text) => {
              const parsed = parseInt(text, 10);
              if (!isNaN(parsed) && parsed > 0) {
                setEntriesPerPage(parsed);
                setCurrentPage(1); // Reset to first page when changing entries per page
              }
            }}
          />
          <Text style={styles.entriesText}>entries per page</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search:</Text>
          <TextInput 
            style={styles.searchInput} 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, email, phone..."
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#487FFF" />
          <Text style={styles.loadingText}>Loading insurance data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>Error loading data</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInsuranceData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mockDataButton} onPress={loadMockData}>
            <Text style={styles.mockDataText}>Load Sample Data</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView horizontal={true}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.headerCellXS]}>S.No</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Name</Text>
              <Text style={[styles.headerCell, styles.headerCellL]}>Email</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Phone</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Gender</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>DOB</Text>
              <Text style={[styles.headerCell, styles.headerCellL]}>Members</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Self Detail</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Spouse Detail</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Son Detail</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Daughter Detail</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Mother Detail</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Father Detail</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Nominee Name</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Nominee Age</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Nominee Relation</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Sum Insured</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Pin Code</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>Aadhar</Text>
              <Text style={[styles.headerCell, styles.headerCellS]}>PAN</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Client ID</Text>
              <Text style={[styles.headerCell, styles.headerCellM]}>Add Date</Text>
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
              {Array.isArray(filteredData) && filteredData.length > 0 ? (
                Array.isArray(currentEntries) && currentEntries.length > 0 ? currentEntries.map((item, index) => (
                  <TouchableOpacity 
                    key={item?.h_i_n_id || `item-${index}`} 
                    style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                    onPress={() => viewInsuranceDetails(item)}
                  >
                    <Text style={[styles.cell, styles.cellXS]}>{indexOfFirstEntry + index + 1}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_name')}</Text>
                    <Text style={[styles.cell, styles.cellL]}>{getFieldValue(item, 'h_i_n_email')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_phone')}</Text>
                    <Text style={[styles.cell, styles.cellS]}>{getFieldValue(item, 'h_i_n_gender')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_dob')}</Text>
                    <Text style={[styles.cell, styles.cellL]}>
                      {(() => {
                        try {
                          if (!item.h_i_n_member) return 'N/A';
                          
                          if (typeof item.h_i_n_member === 'string') {
                            try {
                              const members = JSON.parse(item.h_i_n_member);
                              if (Array.isArray(members)) {
                                return members.join(', ');
                              }
                            } catch (e) {
                              return item.h_i_n_member;
                            }
                          }
                          
                          if (Array.isArray(item.h_i_n_member)) {
                            return item.h_i_n_member.join(', ');
                          }
                          
                          return String(item.h_i_n_member);
                        } catch (err) {
                          console.error('Error rendering members:', err);
                          return 'Error';
                        }
                      })()}
                    </Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_self_detail')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_spouse_detail')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_son_detail')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_daughter_detail')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_mother_detail')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_father_detail')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_nominee_name')}</Text>
                    <Text style={[styles.cell, styles.cellS]}>{getFieldValue(item, 'h_i_n_nominee_age')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_nominee_relation')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_sum_insured')}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_pincode')}</Text>
                    <View style={[styles.cell, styles.cellS]}>
                      <SimpleImage imageUrl={
                        item.h_i_n_aadhar_photo ? 
                        getFullUrl(`uploads/${item.h_i_n_aadhar_photo}`) : 
                        null
                      } />
                    </View>
                    <View style={[styles.cell, styles.cellS]}>
                      <SimpleImage imageUrl={
                        item.h_i_n_pan_photo ? 
                        getFullUrl(`uploads/${item.h_i_n_pan_photo}`) : 
                        null
                      } />
                    </View>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_client_id', `#${item.h_i_n_id || ''}`)}</Text>
                    <Text style={[styles.cell, styles.cellM]}>{getFieldValue(item, 'h_i_n_add_date')}</Text>
                  </TouchableOpacity>
                )) : (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="info-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Processing data...</Text>
                    <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                  </View>
                )
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="info-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No insurance records found</Text>
                  <Text style={styles.emptySubtext}>Pull down to refresh or try loading sample data</Text>
                  <TouchableOpacity style={styles.mockDataButton} onPress={loadMockData}>
                    <Text style={styles.mockDataText}>Load Sample Data</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}
      
      {Array.isArray(filteredData) && filteredData.length > 0 && renderPagination()}
      
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#487FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mockDataButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  mockDataText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tableContainer: {
    minWidth: width,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    padding: 12,
    fontWeight: 'bold',
    color: '#333',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    textAlign: 'center',
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
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  cellXS: { width: 60 },
  cellS: { width: 100 },
  cellM: { width: 150 },
  cellL: { width: 200 },
  noImage: {
    width: 40,
    height: 40,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 3,
  },
  emptyContainer: {
    padding: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationInfo: {},
  paginationText: {
    color: '#666',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    backgroundColor: '#487FFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  paginationPageInfo: {
    paddingHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
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
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontWeight: '600',
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  documentImage: {
    width: '100%',
    height: 200,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
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
});

export default HealthInsuranceTable; 