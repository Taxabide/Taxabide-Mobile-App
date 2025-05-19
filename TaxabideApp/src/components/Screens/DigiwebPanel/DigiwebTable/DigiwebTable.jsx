import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import ProfileNavbar from '../../NavBar/ProfileNavbar';
import ClientFooter from '../../Footer/ClientFooter';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DigiwebTable = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getUserId().then(id => {
      if (id) {
        fetchWebDevelopmentData(id);
      }
    });
  }, [currentPage, entriesPerPage]);

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.id) {
          setUserId(parsed.id);
          return parsed.id;
        }
      }
      
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed && (parsed.id || parsed.user_id || parsed.t_d_user_id)) {
            const id = parsed.id || parsed.user_id || parsed.t_d_user_id;
            setUserId(id);
            return id;
          }
        } catch (e) {}
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const fetchWebDevelopmentData = async (currentUserId) => {
    try {
      setLoading(true);
      setError(null);
      
      const userIdToUse = currentUserId || userId;
      
      if (!userIdToUse) {
        setError('Please log in to view your data');
        setLoading(false);
        return;
      }
      
      const apiUrl = `https://taxabide.in/api/tdws-web-designing-data.php?user_id=${userIdToUse}&page=${currentPage}&limit=${entriesPerPage}`;
      
      const response = await fetch(apiUrl);
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        setError('Invalid response format from server');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        setError(`Server error: ${response.status}`);
        setLoading(false);
        return;
      }
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        setData(data.data);
      } else {
        setData([]);
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchWebDevelopmentData(userId);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    // This would typically use total pages from API response
    // For now, just go to next page as placeholder
    setCurrentPage(currentPage + 1);
  };

  // Table header component
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={styles.headerCell}>Sr. No.</Text>
      <Text style={styles.headerCell}>Name</Text>
      <Text style={styles.headerCell}>Email</Text>
      <Text style={styles.headerCell}>Phone</Text>
      <Text style={styles.headerCell}>Service</Text>
      <Text style={styles.headerCell}>More Services</Text>
      <Text style={styles.headerCell}>Message</Text>
      <Text style={styles.headerCell}>Client ID</Text>
      <Text style={styles.headerCell}>Client Name</Text>
      <Text style={styles.headerCell}>Client Email</Text>
      <Text style={styles.headerCell}>Add Date</Text>
    </View>
  );

  // Table row component
  const TableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{(currentPage - 1) * entriesPerPage + index + 1}</Text>
      <Text style={styles.tableCell}>{item.name || '-'}</Text>
      <Text style={styles.tableCell}>{item.email || '-'}</Text>
      <Text style={styles.tableCell}>{item.phone || '-'}</Text>
      <Text style={styles.tableCell}>{item.service || '-'}</Text>
      <Text style={styles.tableCell}>{item.more_service || '-'}</Text>
      <Text style={styles.tableCell}>{item.message || '-'}</Text>
      <Text style={styles.tableCell}>{item.client_id || '-'}</Text>
      <Text style={styles.tableCell}>{item.client_name || '-'}</Text>
      <Text style={styles.tableCell}>{item.client_email || '-'}</Text>
      <Text style={styles.tableCell}>{item.add_date || '-'}</Text>
    </View>
  );

  // No data component
  const NoData = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No data available in table</Text>
    </View>
  );
  
  // Page info text
  const getPageInfoText = () => {
    if (data.length === 0) {
      return 'Showing 0 to 0 of 0 entries';
    }
    const start = (currentPage - 1) * entriesPerPage + 1;
    const end = start + data.length - 1;
    // Typically total would come from API, using placeholder
    const total = end; // placeholder
    return `Showing ${start} to ${end} of ${total} entries`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileNavbar navigation={navigation} />

      <View style={styles.container}>
        <Text style={styles.heading}>
          Tulyarth DigiWeb Services - Web Development
        </Text>

        <View style={styles.tableControls}>
          <View style={styles.entriesPerPageContainer}>
            <TextInput
              style={styles.entriesInput}
              value={entriesPerPage.toString()}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num > 0) {
                  setEntriesPerPage(num);
                }
              }}
              keyboardType="numeric"
            />
            <Text style={styles.entriesLabel}>entries per page</Text>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchLabel}>Search:</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        <ScrollView horizontal style={styles.tableContainer}>
          <View>
            <TableHeader />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0D6EFD" />
                <Text style={styles.loadingText}>Loading data...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={index} item={item} index={index} />
              ))
            ) : (
              <NoData />
            )}
          </View>
        </ScrollView>

        <View style={styles.paginationContainer}>
          <Text style={styles.pageInfo}>{getPageInfoText()}</Text>
          
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={styles.pageButton}
              onPress={handleFirstPage}
              disabled={currentPage === 1}
            >
              <Text style={[styles.pageButtonText, currentPage === 1 && styles.disabledText]}>«</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.pageButton}
              onPress={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <Text style={[styles.pageButtonText, currentPage === 1 && styles.disabledText]}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.pageButton}
              onPress={handleNextPage}
              disabled={data.length < entriesPerPage}
            >
              <Text style={[styles.pageButtonText, data.length < entriesPerPage && styles.disabledText]}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.pageButton}
              onPress={handleLastPage}
              disabled={data.length < entriesPerPage}
            >
              <Text style={[styles.pageButtonText, data.length < entriesPerPage && styles.disabledText]}>»</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ClientFooter />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
  },
  tableControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
  },
  entriesPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entriesInput: {
    height: 40,
    width: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 5,
  },
  entriesLabel: {
    color: '#555',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchLabel: {
    marginRight: 5,
    color: '#555',
  },
  searchInput: {
    height: 40,
    width: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  tableContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#0D6EFD',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
  },
  headerCell: {
    fontWeight: 'bold',
    width: 150,
    paddingHorizontal: 10,
    color: '#333',
    fontSize: 15,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  tableCell: {
    width: 150,
    paddingHorizontal: 10,
    color: '#555',
  },
  noDataContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noDataText: {
    color: '#555',
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageInfo: {
    color: '#555',
  },
  paginationControls: {
    flexDirection: 'row',
  },
  pageButton: {
    width: 35,
    height: 35,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonText: {
    color: '#0D6EFD',
    fontSize: 16,
  },
  disabledText: {
    color: '#aaa',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
});

export default DigiwebTable; 