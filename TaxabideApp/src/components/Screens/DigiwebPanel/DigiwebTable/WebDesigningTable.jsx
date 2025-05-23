import React, {useState, useEffect, useRef} from 'react';
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
  Dimensions,
} from 'react-native';
import ProfileNavbar from '../../NavBar/ProfileNavbar';
import ClientFooter from '../../Footer/ClientFooter';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const WebDesigningTable = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [tableHeight, setTableHeight] = useState(500);
  const [clients, setClients] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  
  // Get screen dimensions for responsive design
  const windowHeight = Dimensions.get('window').height;
  const horizontalScrollRef = useRef(null);
  const verticalScrollRef = useRef(null);

  useEffect(() => {
    // Calculate table height based on screen size (60% of screen height)
    const calculatedHeight = Math.min(Math.max(windowHeight * 0.6, 300), 700);
    setTableHeight(calculatedHeight);
    
    getUserId().then(id => {
      if (id) {
        console.log('💡 APP MOUNTED - Getting all client data');
        // First get client data with a forceful approach
        getAllClientsDirectly(id);
        // Then fetch web designing data
        setTimeout(() => {
          fetchWebDesigningData(id);
        }, 800);
      }
    });
  }, []);  // Remove dependencies to only run on mount
  
  // Add a separate effect for pagination changes
  useEffect(() => {
    if (userId) {
      fetchWebDesigningData(userId);
    }
  }, [currentPage, entriesPerPage]);

  // Add an effect for window size changes
  useEffect(() => {
    const calculatedHeight = Math.min(Math.max(windowHeight * 0.6, 300), 700);
    setTableHeight(calculatedHeight);
  }, [windowHeight]);

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

  // New function to directly get ALL clients regardless of other endpoints
  const getAllClientsDirectly = async (currentUserId) => {
    if (!currentUserId) return;
    
    setLoading(true);
    console.log('💡 GETTING ALL CLIENTS DIRECTLY');
    
    try {
      // This will get all clients directly from different API endpoints
      const userIdToUse = currentUserId || userId;
      
      // Try multiple endpoints in parallel for maximum coverage
      const endpoints = [
        `https://taxabide.in/api/clients-list-api.php?user_id=${userIdToUse}`,
        `https://taxabide.in/api/getClients.php?user_id=${userIdToUse}`,
        `https://taxabide.in/api/get-all-clients.php?user_id=${userIdToUse}`,
      ];
      
      const allClients = [];
      const clientMap = {};
      
      console.log(`🔍 Searching for clients using ${endpoints.length} different APIs for user ID: ${userIdToUse}`);
      
      // Try all endpoints in parallel
      const responses = await Promise.all(
        endpoints.map(endpoint => 
          fetch(endpoint)
            .then(response => response.text())
            .catch(error => {
              console.log(`Error with endpoint ${endpoint}:`, error);
              return null;
            })
        )
      );
      
      // Process all responses
      for (let i = 0; i < responses.length; i++) {
        const responseText = responses[i];
        if (!responseText) continue;
        
        try {
          const parsed = JSON.parse(responseText);
          console.log(`Response from endpoint ${i + 1}:`, parsed ? 'Data received' : 'Empty data');
          
          // Process data based on format
          if (parsed && parsed.status === 'success' && Array.isArray(parsed.data)) {
            parsed.data.forEach(client => {
              if (client.c_id || client.id || client.client_id) {
                allClients.push(client);
                
                // Create entry in map
                const clientId = client.c_id || client.id || client.client_id;
                clientMap[clientId] = {
                  id: clientId,
                  name: client.c_name || client.name || client.client_name || '',
                  email: client.c_email || client.email || client.client_email || ''
                };
                
                // Also add with numeric ID if it's numeric
                if (!isNaN(Number(clientId))) {
                  clientMap[Number(clientId)] = clientMap[clientId];
                }
              }
            });
            console.log(`Found ${parsed.data.length} clients from endpoint ${i + 1}`);
          } 
          else if (parsed && Array.isArray(parsed.clients)) {
            parsed.clients.forEach(client => {
              if (client.id || client.client_id || client._id) {
                const transformedClient = {
                  c_id: client.id || client.client_id || client._id || '',
                  c_name: client.name || client.client_name || client.c_name || 'Unknown Client',
                  c_email: client.email || client.client_email || client.c_email || ''
                };
                allClients.push(transformedClient);
                
                // Create entry in map
                const clientId = transformedClient.c_id;
                clientMap[clientId] = {
                  id: clientId,
                  name: transformedClient.c_name,
                  email: transformedClient.c_email
                };
                
                // Also add with numeric ID if it's numeric
                if (!isNaN(Number(clientId))) {
                  clientMap[Number(clientId)] = clientMap[clientId];
                }
              }
            });
            console.log(`Found ${parsed.clients.length} clients from endpoint ${i + 1}`);
          }
        } catch (e) {
          console.log(`Error parsing client data from endpoint ${i + 1}:`, e);
        }
      }
      
      if (allClients.length > 0) {
        console.log(`✅ SUCCESS: Found a total of ${allClients.length} unique clients`);
        console.log(`✅ SUCCESS: Created client map with ${Object.keys(clientMap).length} entries`);
        
        // Sample some client data for verification
        const sampleKeys = Object.keys(clientMap).slice(0, 3);
        sampleKeys.forEach(key => {
          console.log(`Sample client ${key}:`, JSON.stringify(clientMap[key]));
        });
        
        setClients(allClients);
        setClientsMap(clientMap);
      } else {
        console.log('⚠️ WARNING: No clients found through any endpoint');
      }
      
      return true;
    } catch (error) {
      console.error('Error in getAllClientsDirectly:', error);
      return false;
    }
  };

  const fetchWebDesigningData = async currentUserId => {
    try {
      setLoading(true);
      setError(null);

      const userIdToUse = currentUserId || userId;

      if (!userIdToUse) {
        setError('Please log in to view your data');
        setLoading(false);
        return;
      }

      // Try both potential API endpoints
      let apiUrls = [
        `https://taxabide.in/api/tdws-web-designing-list-api.php?user_id=${userIdToUse}&page=${currentPage}&limit=${entriesPerPage}`,
        `https://taxabide.in/api/tdws-web-designing-api.php?user_id=${userIdToUse}&page=${currentPage}&limit=${entriesPerPage}`
      ];

      if (searchQuery) {
        apiUrls = apiUrls.map(url => `${url}&search=${encodeURIComponent(searchQuery)}`);
      }

      // Try the primary endpoint first, then fall back to the alternative
      const apiUrl = retryCount % 2 === 0 ? apiUrls[0] : apiUrls[1];
      console.log(`Attempt ${retryCount + 1} - Fetching data from:`, apiUrl);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('API Response received, length:', responseText.length);
        console.log('Response preview:', responseText.substring(0, 200) + '...');

        // Check if the response is empty
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response received from server');
        }

        // Try to sanitize the response if it looks truncated
        let cleanedText = responseText.trim();
        // If it seems to be cut off JSON, try to fix it
        if (cleanedText.endsWith(',') || cleanedText.endsWith(':') || cleanedText.endsWith('[')) {
          cleanedText = cleanedText + '{}]}}';
        }

        let data;
        try {
          data = JSON.parse(cleanedText);
          console.log('Parsed data structure:', Object.keys(data));

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
                        returnTo: 'WebDesigningTable',
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
            const processedData = await Promise.all(data.data.map(async (item) => {
              // Get client details from the map if available
              const clientId = item.t_d_client_id || item.client_id || '';
              console.log(`🔄 Processing item with client ID: ${clientId}`);
              
              let clientDetails = { name: '', email: '' };
              let foundMethod = '';
              
              // Try all possible formats and variations of client ID
              const possibleClientIds = [
                clientId,
                clientId.toString(),
                Number(clientId),
                clientId.replace('td_', ''),
                `td_${clientId}`,
                clientId.toLowerCase(),
                clientId.toUpperCase(),
              ];
              
              // Find the first matching client
              for (const id of possibleClientIds) {
                if (!id) continue;
                
                if (clientsMap[id]) {
                  clientDetails = clientsMap[id];
                  foundMethod = `Found client via ID: ${id}`;
                  break;
                }
              }
              
              // If client not found in map, try direct API
              if (!clientDetails.name && !clientDetails.email && clientId) {
                try {
                  console.log(`🔍 Trying direct API lookup for client ID: ${clientId}`);
                  const response = await fetch(`https://taxabide.in/api/get-client.php?user_id=${userId}&client_id=${clientId}`);
                  const text = await response.text();
                  const data = JSON.parse(text);
                  
                  if (data && (data.client || data.data)) {
                    const client = data.client || data.data;
                    clientDetails = {
                      name: client.name || client.client_name || client.c_name || '',
                      email: client.email || client.client_email || client.c_email || ''
                    };
                    foundMethod = 'Found via direct API';
                    
                    // Update our map for future use
                    const updatedMap = {...clientsMap};
                    updatedMap[clientId] = clientDetails;
                    setClientsMap(updatedMap);
                  }
                } catch (e) {
                  console.log('Error in direct client lookup:', e);
                }
              }
              
              // Final fallback to the item's own data
              if (!clientDetails.name && !clientDetails.email) {
                clientDetails = { 
                  name: item.client_name || '', 
                  email: item.client_email || item.email || ''
                };
                foundMethod = 'Using item data fallback';
              }
              
              // Debug output
              console.log(`✅ Client match: ${foundMethod}`);
              if (clientDetails.name || clientDetails.email) {
                console.log(`   Name: ${clientDetails.name}, Email: ${clientDetails.email}`);
              } else {
                console.log(`⚠️ WARNING: No client data found for ID: ${clientId}`);
              }
              
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
                t_d_client_id: clientId,
                client_name: clientDetails.name || item.client_name || '',
                client_email: clientDetails.email || item.client_email || item.email || '',
              };
            }));

            // Debug processed data
            if (processedData.length > 0) {
              console.log('Client data in first record:', {
                id: processedData[0].t_d_client_id,
                name: processedData[0].client_name, 
                email: processedData[0].client_email
              });
            }

            setData(processedData);
            if (data.total !== undefined) {
              setTotalEntries(data.total);
            }
            // Reset retry count on success
            setRetryCount(0);
          } else {
            console.log('No data or invalid format received');
            setData([]);
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response that failed to parse:', responseText);
          
          // If we've tried both endpoints less than 3 times, try again
          if (retryCount < 5) {
            setRetryCount(retryCount + 1);
            fetchWebDesigningData(userIdToUse);
            return;
          }
          
          setError('Invalid response format from server. Please try again later.');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', fetchError);
        
        // If we've tried both endpoints less than 3 times, try again
        if (retryCount < 5) {
          setRetryCount(retryCount + 1);
          fetchWebDesigningData(userIdToUse);
          return;
        }
        
        setError(`Network error: ${fetchError.message}. Please check your connection.`);
      }
    } catch (error) {
      console.error('General error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchWebDesigningData(userId);
  };

  // Function to scroll to top when changing pages
  const scrollToTop = () => {
    if (verticalScrollRef.current) {
      verticalScrollRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      scrollToTop();
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
    scrollToTop();
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    scrollToTop();
  };

  const handleLastPage = () => {
    const lastPage = Math.ceil(totalEntries / entriesPerPage);
    setCurrentPage(Math.max(1, lastPage));
    scrollToTop();
  };

  // Table header component
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.idCell]}>Sr. No.</Text>
      <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
      <Text style={[styles.headerCell, styles.emailCell]}>Email</Text>
      <Text style={[styles.headerCell, styles.phoneCell]}>Phone</Text>
      <Text style={[styles.headerCell, styles.serviceCell]}>Service</Text>
      <Text style={[styles.headerCell, styles.moreServiceCell]}>More Services</Text>
      <Text style={[styles.headerCell, styles.messageCell]}>Message</Text>
      <Text style={[styles.headerCell, styles.clientIdCell]}>Client ID</Text>
      <View style={[styles.headerCell, styles.clientNameCell]}>
        <Text style={styles.headerText}>Client Name</Text>
      </View>
      <View style={[styles.headerCell, styles.emailCellHighlight]}>
        <Text style={styles.headerTextHighlight}>Client Email</Text>
      </View>
      <Text style={[styles.headerCell, styles.dateCell]}>Added Date</Text>
    </View>
  );

  // Table row component
  const TableRow = ({item, index}) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.idCell]}>
        {data.length > 0 ? (currentPage - 1) * entriesPerPage + index + 1 : ''}
      </Text>
      <Text style={[styles.tableCell, styles.nameCell]} numberOfLines={2}>{item.t_d_name || '-'}</Text>
      <Text style={[styles.tableCell, styles.emailCell]} numberOfLines={2}>{item.t_d_email || '-'}</Text>
      <Text style={[styles.tableCell, styles.phoneCell]}>{item.t_d_phone || '-'}</Text>
      <Text style={[styles.tableCell, styles.serviceCell]} numberOfLines={2}>{item.t_d_service || '-'}</Text>
      <Text style={[styles.tableCell, styles.moreServiceCell]} numberOfLines={3}>{item.t_d_more_service || '-'}</Text>
      <Text style={[styles.tableCell, styles.messageCell]} numberOfLines={3}>{item.t_d_msg || '-'}</Text>
      <Text style={[styles.tableCell, styles.clientIdCell]}>{item.t_d_client_id || '-'}</Text>
      <View style={[styles.tableCell, styles.clientNameCell]}>
        {item.client_name ? (
          <Text style={styles.clientNameText} numberOfLines={2}>{item.client_name}</Text>
        ) : (
          item.t_d_client_id ? <Text style={styles.clientIdText}>Client #{item.t_d_client_id}</Text> : <Text>-</Text>
        )}
      </View>
      <View style={[styles.tableCell, styles.emailCellHighlight]}>
        {item.client_email ? (
          <Text style={styles.clientEmailText} numberOfLines={2}>{item.client_email}</Text>
        ) : (
          <Text style={styles.noDataText}>-</Text>
        )}
      </View>
      <Text style={[styles.tableCell, styles.dateCell]}>{item.t_d_add_date || '-'}</Text>
    </View>
  );

  // No data component
  const NoData = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No data available in table</Text>
      <Text style={styles.noDataSubText}>
        There are no web designing records to display
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
    fetchWebDesigningData(userId);
  };

  const tryAlternativeEndpoint = () => {
    setRetryCount(retryCount + 1);
    fetchWebDesigningData(userId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileNavbar navigation={navigation} />

      <View style={styles.container}>
        <Text style={styles.heading}>
          Tulyarth DigiWeb Services - Web Designing Data
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

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.refreshClientsButton}
            onPress={() => {
              Alert.alert(
                'Sync Client Data',
                'This will update client names and emails from the AddClient section. Would you like to reload client data now?',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Sync Now',
                    onPress: async () => {
                      // First show loading indicator
                      Alert.alert('Loading', 'Syncing client data from AddClient, please wait...');
                      
                      // Fetch client data
                      const success = await getAllClientsDirectly(userId);
                      
                      if (success) {
                        // Then reload table data
                        setTimeout(() => {
                          fetchWebDesigningData(userId);
                          Alert.alert('Success', 'Client data has been synced from AddClient');
                        }, 500);
                      } else {
                        Alert.alert('Error', 'Failed to sync client data. Please try again.');
                      }
                    }
                  }
                ]
              );
            }}>
            <View style={styles.refreshButtonInner}>
              <Text style={styles.refreshButtonIcon}>🔄</Text>
              <Text style={styles.refreshClientsButtonText}>Sync Client Data from AddClient</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tableWrapper}>
          <ScrollView 
            horizontal 
            style={styles.horizontalScrollView}
            ref={horizontalScrollRef}>
            <View>
              <TableHeader />
              
              <ScrollView 
                ref={verticalScrollRef}
                style={[styles.verticalScrollView, {maxHeight: tableHeight}]}
                nestedScrollEnabled={true}>
                
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
                    <View style={styles.errorButtonsContainer}>
                      <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={handleRefresh}>
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.alternativeApiButton}
                        onPress={tryAlternativeEndpoint}>
                        <Text style={styles.refreshButtonText}>Try Alternative API</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : data.length > 0 ? (
                  data.map((item, index) => (
                    <TableRow key={index} item={item} index={index} />
                  ))
                ) : (
                  <NoData />
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>

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
  tableWrapper: {
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 18,
    overflow: 'hidden',
  },
  horizontalScrollView: {
    flexGrow: 0,
  },
  verticalScrollView: {
    // Dynamic height will be set with the style prop
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
    paddingHorizontal: 10,
    color: '#333',
    fontSize: 15,
    textAlign: 'left',
    paddingVertical: 5,
  },
  idCell: {
    width: 80,
    textAlign: 'center',
  },
  nameCell: {
    width: 150,
  },
  emailCell: {
    width: 200,
  },
  emailCellHighlight: {
    width: 220,
    backgroundColor: '#e6f2ff', // Light blue background
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#c1d9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  phoneCell: {
    width: 120,
  },
  serviceCell: {
    width: 180,
  },
  moreServiceCell: {
    width: 180, 
  },
  messageCell: {
    width: 250,
  },
  clientIdCell: {
    width: 100,
    textAlign: 'center',
  },
  dateCell: {
    width: 120,
  },
  noDataContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    margin: 12,
    width: 1100, // Ensure the no data container spans across all columns
  },
  noDataText: {
    color: '#999',
    fontStyle: 'italic',
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
    width: 1100, // Ensure the loading container spans across all columns
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
    width: 1100, // Ensure the error container spans across all columns
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
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
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
  alternativeApiButton: {
    backgroundColor: '#FFA000',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 6,
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
  clientNameCell: {
    width: 170,
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 1,
    borderColor: '#dae6ff',
    justifyContent: 'center',
  },
  clientNameText: {
    fontWeight: '600',
    color: '#0056b3',
    fontSize: 16,
  },
  clientIdText: {
    fontStyle: 'italic',
    color: '#6c757d',
  },
  clientEmailText: {
    fontWeight: '600',
    color: '#0056b3',
    fontSize: 16,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerTextHighlight: {
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  refreshClientsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.09,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  refreshClientsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default WebDesigningTable;
