import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { editOrder } from '../../../redux/slices/ordersSlice';

const EditOrders = ({
  visible,
  onClose,
  order,
  initialMessage = '',
}) => {
  const dispatch = useDispatch();
  const { editOrderLoading } = useSelector(state => state.orders);
  
  // Local state
  const [message, setMessage] = useState(initialMessage);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  
  // Reset the form when a new order is received
  React.useEffect(() => {
    if (order) {
      setMessage(order.p_o_query || '');
      setSelectedFiles([]);
    }
  }, [order]);
  
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
  
  // Document picker functionality
  const pickDocument = async () => {
    try {
      const options = {
        mediaType: 'mixed',  // Allow both photos and documents
        selectionLimit: 0,   // 0 means unlimited selection
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false,
      };
      
      const result = await ImagePicker.launchImageLibrary(options);
      
      if (!result.didCancel && result.assets?.length > 0) {
        // Process selected files
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'application/octet-stream',
          name: asset.fileName || `document_${Date.now()}.${asset.type?.split('/')[1] || 'jpg'}`,
          size: asset.fileSize || 0,
        }));
        
        // Add the picked files to the existing selection
        setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
      }
    } catch (error) {
      console.error('Error with document picker:', error);
      Alert.alert(
        'Error',
        'There was a problem selecting files. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!order) return;
    
    try {
      // Create formData for sending files to the server
      const formData = new FormData();
      formData.append('orderId', order.p_o_id);
      formData.append('message', message);
      
      // Add files to formData if any are selected
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file, index) => {
          formData.append(`files[${index}]`, {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            type: file.type,
            name: file.name
          });
        });
      }
      
      // Dispatch the edit order action with files and message
      await dispatch(editOrder({
        orderId: order.p_o_id,
        message: message,
        files: selectedFiles,
        formData: formData
      })).unwrap();
      
      // Show success message
      Alert.alert('Success', 'Order updated successfully');
      
      // Close the modal
      onClose();
      
      // Clear form state
      setMessage('');
      setSelectedFiles([]);
      
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order: ' + error.message);
    }
  };
  
  // If no order is provided, don't render anything
  if (!order) return null;
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>Edit Place Order</Text>
          
          <View style={styles.editModalBody}>
            {/* Existing Documents Section */}
            <Text style={styles.editSectionTitle}>Existing Documents</Text>
            {order?.file_paths && order.file_paths.length > 0 ? (
              <View style={styles.existingDocsGrid}>
                {order.file_paths.map((doc, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.docThumbnailContainer}
                    onPress={() => {
                      const imageUrl = getValidImageUrl(doc);
                      Linking.openURL(imageUrl);
                    }}
                  >
                    <Image 
                      source={{ uri: getValidImageUrl(doc) }} 
                      style={styles.docThumbnail}
                      resizeMode="cover"
                      onError={() => handleImageError(getValidImageUrl(doc))}
                    />
                    {imageLoadErrors[getValidImageUrl(doc)] && (
                      <View style={styles.thumbnailErrorOverlay}>
                        <Icon name="file-document-outline" size={24} color="#666" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noDocsText}>No documents available</Text>
            )}
            
            {/* Upload Section */}
            <Text style={styles.editSectionTitle}>Upload Other Documents</Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity 
                style={styles.filePickerButton}
                onPress={pickDocument}
              >
                <Text style={styles.filePickerText}>Choose files</Text>
              </TouchableOpacity>
              <Text style={styles.selectedFilesText}>
                {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} chosen` : 'No file chosen'}
              </Text>
            </View>
            
            {selectedFiles.length > 0 && (
              <View style={styles.selectedFilesContainer}>
                <Text style={styles.selectedFilesTitle}>Selected Files</Text>
                <View style={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={styles.fileListItem}>
                      <View style={styles.fileIconContainer}>
                        <Icon 
                          name={file.type.startsWith('image/') ? 'image' : 'file-document-outline'} 
                          size={24} 
                          color="#1976d2" 
                        />
                      </View>
                      <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileSize}>
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          const newFiles = [...selectedFiles];
                          newFiles.splice(index, 1);
                          setSelectedFiles(newFiles);
                        }}
                      >
                        <Icon name="close-circle" size={22} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Message Input */}
            <Text style={styles.editSectionTitle}>Message</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={4}
              placeholder="Enter message here"
              value={message}
              onChangeText={setMessage}
            />
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleSubmit}
              disabled={editOrderLoading}
            >
              {editOrderLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload / Update</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={onClose}
          >
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  noDocsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
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

export default EditOrders; 