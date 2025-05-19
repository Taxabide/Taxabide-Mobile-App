import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

const BASE_URL = 'https://taxabide.in';
const getFullUrl = url => {
  if (!url) return null;
  if (url.startsWith('http')) return encodeURI(url);
  // Ensure there is exactly one slash between domain and path
  return encodeURI(`${BASE_URL}/${url.replace(/^\/+/, '')}`);
};

const ClientsTable = ({clientsdata, filesdata}) => {
  // Normalize data to ensure it's an array
  let safeData = [];

  try {
    if (Array.isArray(clientsdata)) {
      safeData = [...clientsdata];
    } else if (
      clientsdata &&
      typeof clientsdata === 'object' &&
      !Array.isArray(clientsdata)
    ) {
      // If it's a single client object
      if (
        clientsdata.c_id ||
        clientsdata.c_name ||
        clientsdata.id ||
        clientsdata.name
      ) {
        safeData = [clientsdata];
      }
    }

    // Additional safety check
    if (!Array.isArray(safeData)) {
      console.error('safeData is not an array after normalization:', safeData);
      safeData = [];
    }
  } catch (error) {
    console.error('Error normalizing client data:', error);
    safeData = [];
  }

  // Log detailed information about the clients data
  useEffect(() => {
    console.log('ClientsTable received data:', clientsdata);
    console.log('Clients data type:', typeof clientsdata);
    console.log('Is array?', Array.isArray(clientsdata));
    console.log('Length:', safeData.length);

    // Check the first item structure if available
    if (safeData.length > 0) {
      console.log('First item structure:', Object.keys(safeData[0]));
      console.log('Sample item:', JSON.stringify(safeData[0]));
    }
  }, [clientsdata]);

  // Format date in a more readable format (YYYY-MM-DD to DD/MM/YYYY)
  const formatDate = dateString => {
    if (!dateString) return 'N/A';

    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}

    return dateString;
  };

  // Helper to safely get property value with fallback
  const getProperty = (item, key, fallback = 'N/A') => {
    // Check if the item exists
    if (!item) return fallback;

    // First try the expected property format
    if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
      return item[key];
    }

    // Try without 'c_' prefix if it's in the property name
    if (key.startsWith('c_')) {
      const altKey = key.substring(2); // Remove 'c_' prefix
      if (
        item[altKey] !== undefined &&
        item[altKey] !== null &&
        item[altKey] !== ''
      ) {
        return item[altKey];
      }
    }

    // Try with 'c_' prefix if it's not in the property name
    if (!key.startsWith('c_')) {
      const altKey = `c_${key}`;
      if (
        item[altKey] !== undefined &&
        item[altKey] !== null &&
        item[altKey] !== ''
      ) {
        return item[altKey];
      }
    }

    return fallback;
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {[
        'S. No',
        'Name',
        'Email',
        'Phone',
        'Aadhar',
        'PAN',
        'Aadhar Photo',
        'PAN Photo',
        'Photo',
        'Add Date',
      ].map((title, idx) => (
        <Text key={idx} style={[styles.headerCell, styles[`col${idx}`]]}>
          {title}
        </Text>
      ))}
    </View>
  );

  const renderRow = (item, index) => {
    // Extra safety check for item - prevent TypeError on invalid rows
    if (!item || typeof item !== 'object') {
      console.error('Invalid item in renderRow:', item);
      return null; // Skip this row if item is not an object
    }

    return (
      <View
        style={[
          styles.tableRow,
          index % 2 === 0 ? styles.evenRow : styles.oddRow,
        ]}
        key={index}>
        <Text style={[styles.cell, styles.col0]}>{index + 1}</Text>
        <Text style={[styles.cell, styles.col1]}>
          {getProperty(item, 'c_name')}
        </Text>
        <Text style={[styles.cell, styles.col2]}>
          {getProperty(item, 'c_email')}
        </Text>
        <Text style={[styles.cell, styles.col3]}>
          {getProperty(item, 'c_phone')}
        </Text>
        <Text style={[styles.cell, styles.col4]}>
          {getProperty(item, 'c_aadhar')}
        </Text>
        <Text style={[styles.cell, styles.col5]}>
          {getProperty(item, 'c_pan')}
        </Text>
        <View style={[styles.cell, styles.col6]}>
          {getProperty(item, 'c_aadhar_photo', null) ? (
            <Image
              source={{uri: getFullUrl(getProperty(item, 'c_aadhar_photo'))}}
              style={styles.documentImage}
            />
          ) : (
            <Text style={styles.imageLabel}>No Img</Text>
          )}
        </View>
        <View style={[styles.cell, styles.col7]}>
          {getProperty(item, 'c_pan_photo', null) ? (
            <Image
              source={{uri: getFullUrl(getProperty(item, 'c_pan_photo'))}}
              style={styles.documentImage}
            />
          ) : (
            <Text style={styles.imageLabel}>No Img</Text>
          )}
        </View>
        <View style={[styles.cell, styles.col8]}>
          {getProperty(item, 'c_photo', null) ? (
            <Image
              source={{uri: getFullUrl(getProperty(item, 'c_photo'))}}
              style={styles.documentImage}
            />
          ) : (
            <Text style={styles.imageLabel}>No Img</Text>
          )}
        </View>
        <Text style={[styles.cell, styles.col9]}>
          {formatDate(getProperty(item, 'c_add_date'))}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {renderTableHeader()}
          <ScrollView style={styles.tableBody} nestedScrollEnabled>
            {!Array.isArray(safeData) || safeData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No client data available</Text>
              </View>
            ) : (
              safeData.map((item, index) => {
                // Safety check in map function
                try {
                  return renderRow(item, index);
                } catch (error) {
                  console.error('Error rendering client row:', error, item);
                  return (
                    <View style={styles.errorRow} key={`error-${index}`}>
                      <Text style={styles.errorRowText}>
                        Error displaying client #{index + 1}
                      </Text>
                    </View>
                  );
                }
              })
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f1787',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1f1787',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 13,
    paddingRight: 6,
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  evenRow: {
    backgroundColor: '#ffffff',
  },
  oddRow: {
    backgroundColor: '#f8f9fc',
  },
  cell: {
    fontSize: 13,
    color: '#333',
    paddingRight: 6,
  },
  col0: {width: 50, fontWeight: '600'},
  col1: {width: 150},
  col2: {width: 200},
  col3: {width: 120},
  col4: {width: 160},
  col5: {width: 160},
  col6: {width: 90},
  col7: {width: 90},
  col8: {width: 90},
  col9: {width: 160},
  documentImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  imageLabel: {
    fontSize: 10,
    color: '#888',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    width: Platform.OS === 'ios' ? width - 32 : undefined,
    minWidth: 800,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
  },
  errorRow: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#fecaca',
  },
  errorRowText: {
    color: '#b91c1c',
    fontSize: 13,
  },
});

export default ClientsTable;
