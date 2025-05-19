import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import ClientFooter from '../Footer/ClientFooter';
import ProfileNavbar from '../NavBar/ProfileNavbar';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders, updateOrderStatus, filterOrders } from '../../../redux/slices/ordersSlice';
import EditOrders from './EditOrders';
import ChangeStatus from './ChangeStatus';
import apiService from '../../../utils/api';
import authUtils from '../../../utils/authUtils';
import { isNetworkConnected } from '../../../utils/networkUtils';

const {width} = Dimensions.get('window');

const STATUS_COLORS = {
  Approved: {text: '#388e3c', bg: '#e8f5e9'},
  Process: {text: '#1976d2', bg: '#e3f2fd'},
  Disapproved: {text: '#d32f2f', bg: '#ffebee'},
};

// Move getStatusText outside of the component
const getStatusText = (status) => {
  switch (status) {
    case "2": return "Approved";
    case "1": return "Process";
    case "0": return "Disapproved";
    default: return "Unknown";
  }
};

// Header component with title
const Header = ({title}) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Custom Status Badge component
const StatusBadge = ({status}) => {
  const statusText = getStatusText(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[statusText]?.bg || '#f5f5f5' }]}>
      <Text style={[styles.statusText, { color: STATUS_COLORS[statusText]?.text || '#666' }]}>
        {statusText}
      </Text>
    </View>
  );
};

const ViewAllOrder = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Get orders state from Redux
  const { 
    orders, 
    filteredOrders, 
    loading, 
    error, 
    statusUpdateLoading,
    editOrderLoading
  } = useSelector(state => state.orders);
  
  // Local component state
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  
  // Separate useEffect for initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Separate useEffect for debugging Redux state changes
  useEffect(() => {
    console.log('Redux Orders State:', {
      orderCount: orders.length,
      filteredCount: filteredOrders.length,
      loading,
      error,
      statusUpdateLoading,
      editOrderLoading
    });
  }, [orders.length, filteredOrders.length, loading, error]);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    let loadingTimeout;
    
    // If loading is true, set a timeout to handle potential stuck states
    if (loading) {
      loadingTimeout = setTimeout(() => {
        // After 15 seconds, if still loading, refresh the component
        const userId = authUtils.getUserId()
          .then(userId => {
            if (userId) {
              console.log('Loading timeout reached, attempting to reload data');
              dispatch(fetchOrders(userId));
            }
          })
          .catch(err => console.error('Error getting user ID during timeout:', err));
      }, 15000); // 15 seconds timeout
    }
    
    // Clear the timeout when loading state changes or component unmounts
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loading, dispatch]);
  
  const loadInitialData = async () => {
    try {
      // Check if user is logged in
      const isUserLoggedIn = await authUtils.isLoggedIn();
      if (!isUserLoggedIn) {
        navigation.replace('SignIn');
        return;
      }
      
      // Get user ID using auth utils
      const userId = await authUtils.getUserId();
      if (userId) {
        // Use Redux to fetch orders
        dispatch(fetchOrders(userId));
      } else {
        navigation.replace('SignIn');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    dispatch(filterOrders(text));
    setCurrentPage(1);
  };

  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "2":
        return styles.statusApproved;
      case "1":
        return styles.statusProcess;
      case "0":
        return styles.statusDisapproved;
      default:
        return styles.statusDefault;
    }
  };

  const onRefresh = async () => {
    if (refreshing) return; // Prevent multiple refresh calls
    
    setRefreshing(true);
    try {
      const userId = await authUtils.getUserId();
      if (userId) {
        await dispatch(fetchOrders(userId));
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleImageError = (imageUrl) => {
    setImageLoadErrors(prev => ({...prev, [imageUrl]: true}));
  };

  const getValidImageUrl = (url) => {
    // Check if the URL is already a complete URL
    if (url.startsWith('http')) {
      return url;
    }
    // If not, append the base URL
    return `https://taxabide.in/${url}`;
  };

  // Update the document cell render
  const renderDocumentCell = (order) => {
    if (!order.file_paths || !Array.isArray(order.file_paths) || order.file_paths.length === 0) {
      return <Text style={styles.noDocsText}>-</Text>;
    }

    const firstImage = order.file_paths[0];
    const imageUrl = getValidImageUrl(firstImage);

    return (
      <TouchableOpacity 
        style={styles.docsContainer}
        onPress={() => {
          setSelectedDocument(order.file_paths.map(getValidImageUrl));
          setShowDocumentModal(true);
        }}>
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: imageUrl }}
            style={styles.documentImage}
            resizeMode="cover"
            onError={() => handleImageError(imageUrl)}
          />
          {imageLoadErrors[imageUrl] && (
            <View style={styles.errorOverlay}>
              <Icon name="image-off" size={24} color="#666" />
            </View>
          )}
        </View>
        {order.file_paths.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>+{order.file_paths.length - 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Update the document modal image rendering
  const renderModalImages = () => {
    if (!selectedDocument || !Array.isArray(selectedDocument)) {
      return null;
    }

    return selectedDocument.map((doc, index) => {
      const imageUrl = getValidImageUrl(doc);
      return (
        <TouchableOpacity
          key={index}
          style={styles.modalImageContainer}
          onPress={() => {
            if (imageUrl) {
              Linking.openURL(imageUrl);
            }
          }}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.modalImage}
            resizeMode="cover"
            onError={() => handleImageError(imageUrl)}
          />
          {imageLoadErrors[imageUrl] && (
            <View style={styles.modalErrorOverlay}>
              <Icon name="image-off" size={32} color="#666" />
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  // Update the table row to use the new renderDocumentCell
  const renderTableRow = (order, index) => (
    <View style={styles.tableRow} key={order.p_o_id}>
      <Text style={[styles.cell, styles.cellSNo]}>{index + 1}</Text>
      <Text style={[styles.cell, styles.cellUserName]}>{order.l_name}</Text>
      <Text style={[styles.cell, styles.cellServiceName]}>{order.s_name}</Text>
      <Text style={[styles.cell, styles.cellAmount]}>₹{parseFloat(order.p_o_total_price).toFixed(2)}</Text>
      <View style={[styles.cell, styles.cellStatus]}>
        <StatusBadge status={order.p_o_status} />
      </View>
      <Text style={[styles.cell, styles.cellQuery]} numberOfLines={1}>{order.p_o_query || '-'}</Text>
      <View style={[styles.cell, styles.cellDocs]}>
        {renderDocumentCell(order)}
      </View>
      <Text style={[styles.cell, styles.cellDate]}>{formatDate(order.p_o_add_date)}</Text>
      <Text style={[styles.cell, styles.cellEditDate]}>{formatDate(order.p_o_edit_date) || '-'}</Text>
      
      <View style={[styles.cell, styles.cellEdit]}>
        <TouchableOpacity 
          style={styles.editButtonCircle}
          onPress={() => {
            setEditedOrder(order);
            setShowEditModal(true);
          }}
        >
          <Icon name="pencil" size={16} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.cell, styles.cellAction]}
        onPress={() => {
          setSelectedOrder(order);
          setStatusModalVisible(true);
        }}>
        <Text style={styles.changeStatusButton}>Change Status</Text>
      </TouchableOpacity>
    </View>
  );

  // Update the DocumentModal component
  const DocumentModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showDocumentModal}
      onRequestClose={() => setShowDocumentModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Documents ({selectedDocument?.length || 0})
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDocumentModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalImageGrid}>
              {renderModalImages()}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Add back the SuccessModal component
  const SuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccessModal}
      onRequestClose={() => setShowSuccessModal(false)}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 30,
          alignItems: 'center',
          width: '80%',
          maxWidth: 300,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}>
          {/* Checkmark Circle */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#E8F5E9',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#4CAF50',
          }}>
            <Icon name="check" size={40} color="#4CAF50" />
          </View>
          
          {/* Status Updated Text */}
          <Text style={{
            fontSize: 32,
            color: '#333',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 5,
          }}>Status</Text>
          <Text style={{
            fontSize: 32,
            color: '#333',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 25,
          }}>Updated</Text>
          
          {/* OK Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#7C5CFC',
              paddingVertical: 12,
              paddingHorizontal: 40,
              borderRadius: 8,
              elevation: 2,
            }}
            onPress={() => setShowSuccessModal(false)}>
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    loading && !refreshing ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading orders...</Text>
        {/* Add a refresh button in case loading gets stuck */}
        <TouchableOpacity 
          style={[styles.retryButton, {marginTop: 20}]} 
          onPress={loadInitialData}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    ) : error ? (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={50} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            loadInitialData();
          }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.container}>
        <ProfileNavbar
          navigation={navigation}
          currentUser={null}
          // updateUser={() => {}}
        />
        
        <View style={styles.controls}>
          <View style={styles.entriesPerPage}>
            <Picker
              selectedValue={entriesPerPage}
              style={styles.select}
              onValueChange={(value) => setEntriesPerPage(value)}>
              <Picker.Item label="10" value={10} />
              <Picker.Item label="25" value={25} />
              <Picker.Item label="50" value={50} />
            </Picker>
            <Text style={styles.entriesText}>entries per page</Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchLabel}>Search:</Text>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={handleSearch}
              placeholder="Search..."
              placeholderTextColor="#6c757d"
            />
          </View>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-text-outline" size={50} color="#757575" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          <View style={styles.mainContent}>
            <View style={styles.tableWrapper}>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                <View>
                  <View style={styles.stickyHeader}>
                    <View style={styles.headerRow}>
                      <Text style={[styles.headerCell, styles.cellSNo]}>S. No</Text>
                      <Text style={[styles.headerCell, styles.cellUserName]}>User Name</Text>
                      <Text style={[styles.headerCell, styles.cellServiceName]}>Service Name</Text>
                      <Text style={[styles.headerCell, styles.cellAmount]}>Total Amount</Text>
                      <Text style={[styles.headerCell, styles.cellStatus]}>Status</Text>
                      <Text style={[styles.headerCell, styles.cellQuery]}>Query</Text>
                      <Text style={[styles.headerCell, styles.cellDocs]}>Documents</Text>
                      <Text style={[styles.headerCell, styles.cellDate]}>Add Date</Text>
                      <Text style={[styles.headerCell, styles.cellEditDate]}>Edit Date</Text>
                      <Text style={[styles.headerCell, styles.cellEdit]}>Edit</Text>
                      <Text style={[styles.headerCell, styles.cellAction]}>Action</Text>
                    </View>
                  </View>
                  
                  <ScrollView 
                    style={styles.tableBodyContainer}
                    nestedScrollEnabled={true}
                    refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }>
                    <View style={styles.tableContainer}>
                      {getCurrentPageOrders().map((order, index) => renderTableRow(order, index))}
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
            
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationInfo}>
                Showing {Math.min((currentPage - 1) * entriesPerPage + 1, filteredOrders.length)} to{' '}
                {Math.min(currentPage * entriesPerPage, filteredOrders.length)} of {filteredOrders.length} entries
              </Text>
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}>
                  <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#bdbdbd' : '#fff'} />
                </TouchableOpacity>
                
                <View style={styles.pageNumberContainer}>
                  <Text style={styles.pageNumber}>{currentPage}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentPage(Math.min(Math.ceil(filteredOrders.length / entriesPerPage), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(filteredOrders.length / entriesPerPage)}
                  style={[styles.pageButton, 
                    currentPage >= Math.ceil(filteredOrders.length / entriesPerPage) && styles.pageButtonDisabled]}>
                  <Icon name="chevron-right" size={20} 
                    color={currentPage >= Math.ceil(filteredOrders.length / entriesPerPage) ? '#bdbdbd' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        <ChangeStatus
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
          order={selectedOrder}
        />
        <SuccessModal />
        <DocumentModal />
        <EditOrders
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={editedOrder}
          initialMessage={editedOrder?.p_o_query || ''}
        />
        <ClientFooter />
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entriesPerPage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  select: {
    width: 100,
    height: 40,
    marginRight: 8,
  },
  entriesText: {
    color: '#666',
    fontSize: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchLabel: {
    marginRight: 8,
    color: '#6c757d',
    fontSize: 14,
  },
  searchInput: {
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  stickyHeader: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    minWidth: '100%',
  },
  headerCell: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
    backgroundColor: '#f5f5f5',
    textAlign: 'left',
    paddingHorizontal: 12,
  },
  tableBodyContainer: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#fff',
    minWidth: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    minHeight: 48,
    alignItems: 'center',
    minWidth: '100%',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
  },
  cellSNo: { width: 60, minWidth: 60 },
  cellUserName: { width: 120, minWidth: 120 },
  cellServiceName: { width: 200, minWidth: 200 },
  cellAmount: { width: 100, minWidth: 100 },
  cellStatus: { width: 120, minWidth: 120 },
  cellQuery: { width: 150, minWidth: 150 },
  cellDocs: { 
    width: 80, 
    minWidth: 80,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellDate: { width: 120, minWidth: 120 },
  cellEditDate: { width: 120, minWidth: 120 },
  cellEdit: { width: 60, minWidth: 60, alignItems: 'center' },
  cellAction: { width: 100, minWidth: 100 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  changeStatusButton: {
    backgroundColor: '#ff5722',
    color: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  pageNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageNumber: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2196f3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  docsContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  imageCountBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(124, 92, 252, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noDocsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  disapproveButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  modalImageContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  statusModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statusModalTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusModalButtons: {
    width: '100%',
    gap: 12,
  },
  statusButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  approveButton: {
    backgroundColor: '#7C5CFC',
  },
  disapproveButton: {
    backgroundColor: '#E53935',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonCircle: {
    width: 36, 
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    textAlign: 'center',
  },
  editModalBody: {
    padding: 20,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  existingDocsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: 8,
  },
  docThumbnailContainer: {
    width: 70,
    height: 70,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  docThumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  filePickerButton: {
    backgroundColor: '#f7f7f7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  selectedFilesText: {
    color: '#666',
    fontSize: 14,
    paddingLeft: 16,
  },
  selectedFilesCount: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  selectedFilesContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedFilesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  fileList: {
    marginTop: 4,
  },
  fileListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 6,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 5,
  },
  addMoreText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  selectedFileName: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    color: '#333',
    fontSize: 14,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    height: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  closeModalButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
});

export default ViewAllOrder;
