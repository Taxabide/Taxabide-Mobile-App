import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ProfileNavbar from '../../NavBar/ProfileNavbar';
import ClientFooter from '../../Footer/ClientFooter';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const AppDevelopmentTable = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    getUserId().then(id => {
      if (id) {
        fetchAppDevelopmentData(id);
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

  const fetchAppDevelopmentData = async currentUserId => {
    try {
      setLoading(true);
      setError(null);

      const userIdToUse = currentUserId || userId;

      if (!userIdToUse) {
        setError('Please log in to view your data');
        setLoading(false);
        return;
      }

      let apiUrl = `https://taxabide.in/api/tdws-app-development-list-api.php?user_id=${userIdToUse}&page=${currentPage}&limit=${entriesPerPage}`;

      if (searchQuery) {
        apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
      }

      console.log('Fetching data from:', apiUrl);
      const response = await fetch(apiUrl);
      const responseText = await response.text();

      console.log('API Response received, length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 200) + '...');

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError('Invalid response format from server');
        setLoading(false);
        return;
      }

      console.log('Parsed data structure:', Object.keys(data));

      if (!response.ok) {
        setError(`Server error: ${response.status}`);
        setLoading(false);
        return;
      }

      if (data.status === 'error') {
        console.error('API returned error status:', data.message);
        if (data.message && data.message.includes('authenticated')) {
          // Authentication error - prompt user to log in again
          Alert.alert(
            'Authentication Required',
            'Please log in to view your data',
            [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Login',
                onPress: () =>
                  navigation.navigate('SignIn', {
                    returnTo: 'AppDevelopmentTable',
                  }),
              },
            ],
          );
          setError('Authentication required');
        } else {
          setError(data.message || 'An error occurred');
        }
        setData([]);
      } else if (data.status === 'success' && Array.isArray(data.data)) {
        console.log('Successfully fetched data, count:', data.data.length);
        if (data.data.length > 0) {
          console.log('Sample record keys:', Object.keys(data.data[0]));
        }

        // Process the data to ensure all needed fields exist
        const processedData = data.data.map(item => {
          // Make sure all required fields exist, even if empty
          return {
            t_d_id: item.t_d_id || item.id || '',
            t_d_name: item.t_d_name || item.name || '',
            t_d_email: item.t_d_email || item.email || '',
            t_d_phone: item.t_d_phone || item.phone || '',
            t_d_service: item.t_d_service || item.service || '',
            t_d_more_service: item.t_d_more_service || item.more_service || '',
            t_d_msg: item.t_d_msg || item.message || item.msg || '',
            t_d_add_date: item.t_d_add_date || item.add_date || '',
            t_d_user_id: item.t_d_user_id || item.user_id || '',
            t_d_service_type: item.t_d_service_type || item.service_type || '',
            t_d_client_id: item.t_d_client_id || item.client_id || '',
            client_name: item.client_name || '',
            client_email: item.client_email || '',
          };
        });

        setData(processedData);
        if (data.total !== undefined) {
          setTotalEntries(data.total);
        }
      } else {
        console.log('No data or invalid format received');
        setData([]);
      }
    } catch (error) {
      console.error('Network or fetch error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchAppDevelopmentData(userId);
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
    const lastPage = Math.ceil(totalEntries / entriesPerPage);
    setCurrentPage(Math.max(1, lastPage));
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
      <Text style={styles.headerCell}>Service Type</Text>
      <Text style={styles.headerCell}>Added Date</Text>
    </View>
  );

  // Table row component
  const TableRow = ({item, index}) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>
        {data.length > 0 ? (currentPage - 1) * entriesPerPage + index + 1 : ''}
      </Text>
      <Text style={styles.tableCell}>{item.t_d_name || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_email || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_phone || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_service || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_more_service || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_msg || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_client_id || '-'}</Text>
      <Text style={styles.tableCell}>{item.client_name || '-'}</Text>
      <Text style={styles.tableCell}>{item.client_email || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_service_type || '-'}</Text>
      <Text style={styles.tableCell}>{item.t_d_add_date || '-'}</Text>
    </View>
  );

  // No data component
  const NoData = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No data available in table</Text>
      <Text style={styles.noDataSubText}>
        There are no app development records to display
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Refresh Data</Text>
      </TouchableOpacity>
    </View>
  );

  // Page info text
  const getPageInfoText = () => {
    if (data.length === 0) {
      return 'Showing 0 to 0 of 0 entries';
    }
    const start = (currentPage - 1) * entriesPerPage + 1;
    const end = start + data.length - 1;
    const total = totalEntries || end;
    return `Showing ${start} to ${end} of ${total} entries`;
  };

  const handleRefresh = () => {
    fetchAppDevelopmentData(userId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileNavbar navigation={navigation} />

      <View style={styles.container}>
        <Text style={styles.heading}>
          Tulyarth DigiWeb Services - App Development Data
        </Text>

        <View style={styles.tableControls}>
          <View style={styles.entriesPerPageContainer}>
            <Picker
              selectedValue={entriesPerPage}
              style={styles.entriesPicker}
              onValueChange={value => {
                setEntriesPerPage(value);
                setCurrentPage(1); // Reset to first page on change
              }}>
              <Picker.Item label="10" value={10} />
              <Picker.Item label="20" value={20} />
              <Picker.Item label="30" value={30} />
              <Picker.Item label="50" value={50} />
              <Picker.Item label="100" value={100} />
              <Picker.Item label="200" value={200} />
            </Picker>
            <Text style={styles.entriesLabel}>entries per page</Text>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchLabel}>Search:</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Search by name, email, etc."
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
                <Text style={styles.loadingSubText}>
                  Please wait while we fetch your records
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorSubText}>
                  Unable to load data from server
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
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
              disabled={currentPage === 1}>
              <Text
                style={[
                  styles.pageButtonText,
                  currentPage === 1 && styles.disabledText,
                ]}>
                «
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pageButton}
              onPress={handlePreviousPage}
              disabled={currentPage === 1}>
              <Text
                style={[
                  styles.pageButtonText,
                  currentPage === 1 && styles.disabledText,
                ]}>
                ‹
              </Text>
            </TouchableOpacity>

            <View style={styles.pageNumberContainer}>
              <Text style={styles.pageNumberText}>
                Page {totalEntries > 0 ? currentPage : '-'} of {totalEntries > 0 ? Math.max(1, Math.ceil(totalEntries / entriesPerPage)) : '-'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.pageButton}
              onPress={handleNextPage}
              disabled={data.length < entriesPerPage}>
              <Text
                style={[
                  styles.pageButtonText,
                  data.length < entriesPerPage && styles.disabledText,
                ]}>
                ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pageButton}
              onPress={handleLastPage}
              disabled={data.length < entriesPerPage}>
              <Text
                style={[
                  styles.pageButtonText,
                  data.length < entriesPerPage && styles.disabledText,
                ]}>
                »
              </Text>
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
    backgroundColor: '#f4f6fb',
  },
  container: {
    flex: 1,
    padding: 10,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 24,
    color: '#1a237e',
    letterSpacing: 0.5,
  },
  tableControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
    alignItems: 'center',
    gap: 10,
  },
  entriesPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 6,
  },
  entriesPicker: {
    height: 40,
    width: 100,
    borderWidth: 0,
    backgroundColor: '#f4f6fb',
    borderRadius: 6,
    marginRight: 8,
  },
  entriesLabel: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 6,
  },
  searchLabel: {
    marginRight: 8,
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  searchInput: {
    height: 40,
    width: 200,
    borderWidth: 0,
    backgroundColor: '#f4f6fb',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222',
  },
  tableContainer: {
    marginBottom: 18,
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 900,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
    backgroundColor: '#e3eafc',
    paddingVertical: 14,
  },
  headerCell: {
    fontWeight: 'bold',
    width: 150,
    paddingHorizontal: 10,
    color: '#1a237e',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  tableCell: {
    width: 150,
    paddingHorizontal: 10,
    color: '#333',
    fontSize: 15,
    textAlign: 'left',
  },
  noDataContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    margin: 12,
  },
  noDataText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 16,
    marginBottom: 4,
  },
  noDataSubText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 14,
    fontSize: 15,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  pageInfo: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  paginationControls: {
    flexDirection: 'row',
    gap: 4,
  },
  pageButton: {
    width: 38,
    height: 38,
    borderWidth: 0,
    borderRadius: 8,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3eafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  pageButtonText: {
    color: '#1976d2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#b0b0b0',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    margin: 12,
  },
  loadingText: {
    marginTop: 12,
    color: '#333',
    fontSize: 16,
  },
  loadingSubText: {
    marginTop: 8,
    color: '#888',
    fontSize: 15,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    margin: 12,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 15,
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorSubText: {
    color: '#d32f2f',
    marginBottom: 15,
    fontSize: 15,
  },
  refreshButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 6,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.09,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  pageNumberContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pageNumberText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AppDevelopmentTable;
