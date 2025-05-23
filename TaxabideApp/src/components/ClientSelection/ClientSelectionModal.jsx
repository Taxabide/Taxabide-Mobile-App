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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchClients as fetchClientsAction,
  selectClient
} from '../../redux/slices/clientsSlice';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const ClientSelectionModal = ({ visible, onClose, onClientSelected }) => {
  const dispatch = useDispatch();
  const clients = useSelector(state => state.clients.clients) || [];
  const isLoading = useSelector(state => state.clients.isLoading);
  const error = useSelector(state => state.clients.error);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      dispatch(fetchClientsAction());
    }
  }, [visible, dispatch]);

  useEffect(() => {
    if (Array.isArray(clients)) {
      setFilteredClients(
        clients.filter((client) =>
          client.c_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.c_phone?.includes(searchQuery) ||
          client.c_email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredClients([]);
    }
  }, [clients, searchQuery]);

  const handleSelectClient = (client) => {
    dispatch(selectClient(client));
    onClientSelected(client);
    onClose();
  };

  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => handleSelectClient(item)}
    >
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.c_name}</Text>
        <Text style={styles.clientDetail}>{item.c_phone}</Text>
        <Text style={styles.clientDetail}>{item.c_email}</Text>
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
              placeholder="Search by name, email, or phone"
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
              <Text style={styles.errorText}>{error || 'Failed to load clients'}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => dispatch(fetchClientsAction())}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 ? 'No matching clients found' : 'No clients available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.c_id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
            />
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
    marginBottom: 2,
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
  },
});

export default ClientSelectionModal; 