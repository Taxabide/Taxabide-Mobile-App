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

const CarInsuranceTable = ({ navigation }) => {
  const [insuranceData, setInsuranceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
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

  // Fetch car insurance data from API
  const fetchInsuranceData = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) {
        console.error('User ID not available');
        setLoading(false);
        return;
      }

      // Try a different API endpoint
      const response = await fetch(`https://taxabide.in/api/car-insurance-new-list-api.php?user_id=${userId}`);
      const responseText = await response.text();
      
      console.log('Response received:', responseText.substring(0, 200));
      
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
        
        if (Array.isArray(data)) {
          setInsuranceData(data);
        } else if (data && data.status === 'success' && Array.isArray(data.data)) {
          setInsuranceData(data.data);
        } else {
          console.log('Invalid data format received:', data);
          setInsuranceData([]);
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        setInsuranceData([]);
      }
    } catch (error) {
      console.error('Error fetching insurance data:', error);
      setInsuranceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  // Filter data based on search query
  const filteredData = insuranceData.filter(item => {
    const searchTerms = searchQuery.toLowerCase();
    return (
      (item.c_i_n_name && item.c_i_n_name.toLowerCase().includes(searchTerms)) ||
      (item.c_i_n_email && item.c_i_n_email.toLowerCase().includes(searchTerms)) ||
      (item.c_i_n_phone && item.c_i_n_phone.toLowerCase().includes(searchTerms)) ||
      (item.c_i_n_vehicle_type && item.c_i_n_vehicle_type.toLowerCase().includes(searchTerms))
    );
  });

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
                <DetailItem label="Name" value={selectedInsurance.c_i_n_name} />
                <DetailItem label="Email" value={selectedInsurance.c_i_n_email} />
                <DetailItem label="Phone" value={selectedInsurance.c_i_n_phone} />
                <DetailItem label="Gender" value={selectedInsurance.c_i_n_gender} />
                <DetailItem label="Age" value={selectedInsurance.c_i_n_age} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <DetailItem label="Vehicle Type" value={selectedInsurance.c_i_n_vehicle_type} />
                <DetailItem label="Registration Number" value={selectedInsurance.c_i_n_registration_no} />
                <DetailItem label="Registration Date" value={selectedInsurance.c_i_n_registration_date} />
                <DetailItem label="Policy Type" value={selectedInsurance.c_i_n_policy_type} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Insurance Details</Text>
                <DetailItem label="Claim" value={selectedInsurance.c_i_n_claim} />
                <DetailItem label="Old Insurance Expiry" value={selectedInsurance.c_i_n_old_insurance_expiry_date} />
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Nominee Details</Text>
                <DetailItem label="Nominee Name" value={selectedInsurance.c_i_n_nominee_name} />
                <DetailItem label="Nominee Age" value={selectedInsurance.c_i_n_nominee_age} />
                <DetailItem label="Nominee Relation" value={selectedInsurance.c_i_n_nominee_relation} />
              </View>
              
              {selectedInsurance.c_i_n_rc && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>RC Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: `https://taxabide.in/uploads/${selectedInsurance.c_i_n_rc}` }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity style={styles.fullscreenButton}>
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {selectedInsurance.c_i_n_pan_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>PAN Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: `https://taxabide.in/uploads/${selectedInsurance.c_i_n_pan_photo}` }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity style={styles.fullscreenButton}>
                      <MaterialIcons name="fullscreen" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedInsurance.c_i_n_vehicle_photo && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Vehicle Photo</Text>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: `https://taxabide.in/uploads/${selectedInsurance.c_i_n_vehicle_photo}` }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                      onError={(e) => console.log('Modal image error:', e.nativeEvent.error)}
                    />
                    <TouchableOpacity style={styles.fullscreenButton}>
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

  // Helper component for detail items
  const DetailItem = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  // Table headers
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>S. No</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Name</Text>
      </View>
      <View style={styles.columnWide}>
        <Text style={styles.columnHeaderText}>Email</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Phone</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Vehicle Type</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Policy Type</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Registration Date</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Registration No</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>RC</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>Claim</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>Old Insurance</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Nominee Name</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>Nominee Age</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Nominee Relation</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>Vehicle Photo</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>Aadhar Photo</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.columnHeaderText}>PAN Photo</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Client ID</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.columnHeaderText}>Add Date</Text>
      </View>
    </View>
  );

  // Render table row
  const renderTableRow = (item, index) => (
    <TouchableOpacity 
      key={item.id || index} 
      style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
      onPress={() => viewInsuranceDetails(item)}
    >
      <View style={styles.columnS}>
        <Text style={styles.cellText}>{index + 1}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_name || 'N/A'}</Text>
      </View>
      <View style={styles.columnWide}>
        <Text style={styles.cellText}>{item.c_i_n_email || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_phone || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_vehicle_type || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_policy_type || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_registration_date || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_registration_no || 'N/A'}</Text>
      </View>
      <View style={styles.columnS}>
        {item.c_i_n_rc ? (
          <Image
            source={{ uri: `https://taxabide.in/uploads/${item.c_i_n_rc}` }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.placeholderImage]}>
            <MaterialIcons name="image-not-supported" size={20} color="#aaa" />
          </View>
        )}
      </View>
      <View style={styles.columnS}>
        <Text style={styles.cellText}>{item.c_i_n_claim || 'N/A'}</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.cellText}>{item.c_i_n_old_insurance_expiry_date || 'No'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_nominee_name || 'N/A'}</Text>
      </View>
      <View style={styles.columnS}>
        <Text style={styles.cellText}>{item.c_i_n_nominee_age || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_nominee_relation || 'N/A'}</Text>
      </View>
      <View style={styles.columnS}>
        {item.c_i_n_vehicle_photo ? (
          <Image
            source={{ uri: `https://taxabide.in/uploads/${item.c_i_n_vehicle_photo}` }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.placeholderImage]}>
            <MaterialIcons name="image-not-supported" size={20} color="#aaa" />
          </View>
        )}
      </View>
      <View style={styles.columnS}>
        {item.c_i_n_aadhar ? (
          <Image
            source={{ uri: `https://taxabide.in/uploads/${item.c_i_n_aadhar}` }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.placeholderImage]}>
            <MaterialIcons name="image-not-supported" size={20} color="#aaa" />
          </View>
        )}
      </View>
      <View style={styles.columnS}>
        {item.c_i_n_pan_photo ? (
          <Image
            source={{ uri: `https://taxabide.in/uploads/${item.c_i_n_pan_photo}` }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.placeholderImage]}>
            <MaterialIcons name="image-not-supported" size={20} color="#aaa" />
          </View>
        )}
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.c_i_n_client_id || 'N/A'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.cellText}>{item.created_at || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Insurance Records</Text>
      </View>
      
      <View style={styles.filters}>
        <View style={styles.entriesContainer}>
          <TextInput
            style={styles.entriesInput}
            value={entriesPerPage.toString()}
            onChangeText={(text) => setEntriesPerPage(parseInt(text) || 10)}
            keyboardType="numeric"
          />
          <Text style={styles.entriesText}>entries per page</Text>
        </View>
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search:</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
          />
        </View>
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
        >
          <View style={styles.tableContainer}>
            {renderTableHeader()}
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
                filteredData
                  .slice(0, entriesPerPage)
                  .map((item, index) => renderTableRow(item, index))
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
      
      <View style={styles.pagination}>
        <TouchableOpacity style={styles.paginationButton} disabled={true}>
          <MaterialIcons name="chevron-left" size={24} color="#ccc" />
        </TouchableOpacity>
        <View style={styles.paginationIndicator}>
          <View style={styles.paginationActive}></View>
        </View>
        <TouchableOpacity style={styles.paginationButton} disabled={true}>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      {renderDetailModal()}
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
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entriesInput: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    textAlign: 'center',
    backgroundColor: '#fff',
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
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  horizontalScrollContainer: {
    flexGrow: 1,
  },
  tableContainer: {
    flex: 1,
    minWidth: width,
    width: 1800, // Increased width to accommodate more columns
  },
  tableContent: {
    flexGrow: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  columnS: {
    width: 60,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  column: {
    width: 120,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  columnWide: {
    width: 180,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  columnHeaderText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  cellText: {
    fontSize: 13,
    color: '#555',
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 3,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    padding: 8,
  },
  paginationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    height: 6,
    width: 100,
    borderRadius: 3,
    marginHorizontal: 15,
  },
  paginationActive: {
    width: '50%',
    height: 6,
    backgroundColor: '#487FFF',
    borderRadius: 3,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#487FFF',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailSection: {
    marginBottom: 20,
  },
  documentImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  detailLabel: {
    fontWeight: '600',
    width: 100,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#333',
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
});

export default CarInsuranceTable; 