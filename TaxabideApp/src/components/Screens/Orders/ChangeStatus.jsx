import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus } from '../../../redux/slices/ordersSlice';

const ChangeStatus = ({ visible, onClose, order }) => {
  const dispatch = useDispatch();
  const { statusUpdateLoading } = useSelector(state => state.orders);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Handle status change action
  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    
    try {
      // Hide the modal immediately for better UX
      onClose();
      
      // Map to database values: 0->disapproved, 1->process, 2->approved
      const statusValue = newStatus === 'Approve' ? '2' : 
                         newStatus === 'Disapprove' ? '0' : '1';
      
      console.log(`Changing status for order ${order.p_o_id} to ${statusValue} (${newStatus})`);
      
      // Dispatch the update action to Redux
      await dispatch(updateOrderStatus({
        orderId: order.p_o_id,
        status: statusValue
      })).unwrap();
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error in status update:', error);
      Alert.alert('Error', 'Failed to update order status: ' + error.message);
    }
  };
  
  // If no order is provided, don't render anything
  if (!order) return null;
  
  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.statusButton, styles.approveButton]}
                onPress={() => handleStatusChange('Approve')}
                disabled={statusUpdateLoading}>
                {statusUpdateLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.statusButtonText}>Approve</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, styles.disapproveButton]}
                onPress={() => handleStatusChange('Disapprove')}
                disabled={statusUpdateLoading}>
                {statusUpdateLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.statusButtonText}>Disapprove</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, styles.cancelButton]}
                onPress={onClose}
                disabled={statusUpdateLoading}>
                <Text style={styles.statusButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            {/* Checkmark Circle */}
            <View style={styles.successIcon}>
              <Icon name="check" size={40} color="#4CAF50" />
            </View>
            
            {/* Status Updated Text */}
            <Text style={styles.successTitle}>Status</Text>
            <Text style={styles.successTitle}>Updated</Text>
            
            {/* OK Button */}
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  modalTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
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
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successTitle: {
    fontSize: 32,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  okButton: {
    backgroundColor: '#7C5CFC',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    elevation: 2,
    marginTop: 20,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ChangeStatus; 