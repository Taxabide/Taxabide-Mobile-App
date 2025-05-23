import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import ClientService from '../../services/clientService';

/**
 * A reusable client selector component that shows only name and email
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onClientSelected - Function to call when client is selected
 * @returns {React.ReactNode}
 */
const ClientListSelector = ({ visible, onClose, onClientSelected }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Load clients when modal becomes visible
  useEffect(() => {
    console.log('ClientListSelector - Modal visible:', visible);
    if (visible) {
      loadClients();
    }
  }, [visible]);

  // Filter clients when search query changes
  useEffect(() => {
    if (clients.length > 0) {
      setFilteredClients(
        clients.filter((client) =>
          client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [clients, searchQuery]);

  // Load clients from service
  const loadClients = async () => {
    try {
      console.log('ClientListSelector - Loading clients...');
      setIsLoading(true);
      setError(null);
      
      // Get user ID directly to verify it exists
      const userData = await AsyncStorage.getItem('userData');
      console.log('ClientListSelector - userData:', userData ? 'Found' : 'Not found');
      
      const clientData = await ClientService.fetchClients();
      console.log('ClientListSelector - clientData received:', clientData.length);
      
      if (clientData.length === 0) {
        // Show alert for debugging purposes
        Alert.alert(
          'Debug Info',
          'No clients found. Make sure you are logged in and have clients in your account.',
          [{ text: 'OK' }]
        );
      }
      
      setClients(clientData);
      setFilteredClients(clientData);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle client selection
  const handleSelectClient = (client) => {
    console.log('ClientListSelector - Selected client:', client.name);
    if (onClientSelected) {
      onClientSelected(client);
    }
    onClose();
  };

  // Navigate to Add Client screen
  const handleAddNewClient = () => {
    onClose();
    setTimeout(() => {
      navigation.navigate('AddClient');
    }, 300);
  };

  // Render each client item in the list
  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => handleSelectClient(item)}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientDetail}>{item.email}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#487FFF" />
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Client</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#487FFF" style={styles.loading} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadClients}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 ? 'No matching clients found' : 'No clients available'}
              </Text>
              <TouchableOpacity
                style={styles.addClientButton}
                onPress={handleAddNewClient}
              >
                <MaterialIcons name="person-add" size={20} color="#fff" />
                <Text style={styles.addClientText}>Add New Client</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
              />
              
              {/* Only show Add Client button when there are existing clients */}
              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.addClientButton}
                  onPress={handleAddNewClient}
                >
                  <MaterialIcons name="person-add" size={20} color="#fff" />
                  <Text style={styles.addClientText}>Add New Client</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 15,
    borderRadius: 8,
    margin: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  clientDetail: {
    fontSize: 14,
    color: '#666',
  },
  loading: {
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#487FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomButtonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addClientButton: {
    backgroundColor: '#487FFF',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addClientText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ClientListSelector; 