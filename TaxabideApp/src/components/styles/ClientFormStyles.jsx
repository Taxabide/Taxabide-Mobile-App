import { StyleSheet } from 'react-native';

const ClientFormStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f7fa',
    },
    scrollView: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: '#fff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      marginBottom: 12,
    },
    logo: {
      width: 120,
      height: 40,
    },
    userIcon: {
      backgroundColor: '#e5e5e5',
      padding: 6,
      borderRadius: 999,
    },
    navPath: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    navText: {
      marginHorizontal: 6,
      color: '#666',
      fontSize: 14,
    },
    navSeparator: {
      color: '#999',
      fontSize: 14,
    },
    formContainer: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333',
    },
    formSection: {
      backgroundColor: '#f9f9f9',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: '#333',
    },
    inputContainer: {
      width: '48%',
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 6,
      color: '#555',
    },
    input: {
      height: 42,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: '#fff',
      fontSize: 14,
    },
    fileButton: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      backgroundColor: '#fff',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    fileButtonText: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
      color: '#444',
    },
    noFileText: {
      fontSize: 12,
      color: '#888',
    },
    submitButton: {
      backgroundColor: '#007bff',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default ClientFormStyles;
