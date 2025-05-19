import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, updateUser as updateReduxUser } from '../../../redux/slices/userSlice';

const { width } = Dimensions.get('window');

// Reusable Navigation Bar component that can be used across different screens
const ProfileNavbar = (props) => {
  const navigation = props.navigation || useNavigation();
  const { title, onMenuToggle } = props;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Get user data from Redux store
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  // Fetch user data from AsyncStorage as a fallback
  const fetchUserDataFromStorage = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        // If user is not in Redux state but we have data in AsyncStorage, update Redux
        if (!user && parsedUser) {
          dispatch(updateReduxUser(parsedUser));
        }
        return parsedUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data from AsyncStorage:', error);
      return null;
    }
  }, [user, dispatch]);

  // Load user data from AsyncStorage on component mount
  useEffect(() => {
    fetchUserDataFromStorage();
  }, [fetchUserDataFromStorage]);

  // Notify parent component about menu state changes
  useEffect(() => {
    if (onMenuToggle) {
      onMenuToggle(showProfileMenu);
    }
  }, [showProfileMenu, onMenuToggle]);

  const handleMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = async () => {
    try {
      // Dispatch Redux logout action (which will clear AsyncStorage)
      await dispatch(logoutUser());
      
      // Navigate to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  // Use Redux user data
  const currentUser = user;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => {
            // Improved back navigation logic
            if (navigation) {
              // Check if we can go back before attempting it
              const canGoBack = navigation.canGoBack();
              if (canGoBack) {
                navigation.goBack();
              } else {
                // If we can't go back, navigate to Home
                navigation.navigate('Home');
              }
            }
          }}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoBlock}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.profileIconContainer}
          onPress={handleMenuToggle}>
          {currentUser?.profilePic ? (
            <Image
              source={{uri: currentUser.profilePic}}
              style={styles.profileIcon}
            />
          ) : (
            <View style={styles.profileIconPlaceholder}>
              <Text style={styles.profileIconText}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {showProfileMenu && (
        <View style={styles.profileMenu}>
          <View style={styles.profileMenuHeader}>
            <Text style={styles.profileMenuName}>
              {currentUser?.name || 'User'}
            </Text>
            <Text style={styles.profileMenuRole}>User</Text>
            <TouchableOpacity 
              style={styles.profileMenuClose}
              onPress={handleMenuToggle}>
              <Icon name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.profileMenuItem}
            onPress={() => {
              setShowProfileMenu(false);
              navigation.navigate('ProfileScreen');
            }}>
            <Icon name="account-outline" size={20} color="#555" />
            <Text style={styles.profileMenuItemText}>My Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileMenuItem}
            onPress={() => {
              setShowProfileMenu(false);
              handleLogout();
            }}>
            <Icon name="logout-variant" size={20} color="#555" />
            <Text style={styles.profileMenuItemText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10, // Higher z-index for the navbar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  logoBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginLeft: -40, // visually center due to left/right icons
  },
  logo: {
    width: 120,
    height: 32,
  },
  byText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '400',
    marginTop: 0,
    textAlign: 'center',
  },
  byTextBrand: {
    color: '#1f1787',
    fontWeight: 'bold',
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B89DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileMenu: {
    position: 'absolute',
    top: 65,
    right: 15,
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  profileMenuRole: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  profileMenuClose: {
    padding: 5,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileMenuItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 15,
  },
});

export default ProfileNavbar; 