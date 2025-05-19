import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const BurgerMenuModal = ({visible, onClose}) => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleNavigation = route => {
    onClose();
    navigation.navigate(route);
  };

  const handleLogout = () => {
    onClose();
    // Add your logout logic here
    Alert.alert('Logout', 'You have been logged out successfully');
    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  };

  // Navigate to Profile Screen
  const navigateToProfile = () => {
    onClose();
    navigation.navigate('ProfileScreen');
  };

  // Simple function to open the working URL
  const openInBrowser = () => {
    onClose();
    
    // Use setTimeout to ensure the modal is closed before opening URL
    setTimeout(() => {
      // Use the confirmed working URL
      Linking.openURL('http://www.taxabide.com').catch(error => {
        console.error('Error opening URL:', error);
        // Fallback to in-app navigation if URL opening fails
        navigation.navigate('ServiceList');
      });
    }, 500);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View 
          style={[
            styles.menuContainer,
            {
              opacity: opacityAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          {/* Menu Items */}
          <View style={styles.menuContent}>
            <View style={styles.menuItem}>
              <Text style={styles.clickHereText}>CLICK HERE</Text>
              
              <Text style={styles.arrowText}> › </Text>
              
              <TouchableOpacity onPress={openInBrowser}>
                <Text style={styles.serviceText}>
                  PROVIDE SERVICE &{'\n'}KNOWLEDGE BY TAXABIDE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={navigateToProfile}
            >
              <Icon name="account-outline" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleButton, styles.logoutButton]}
              onPress={handleLogout}>
              <Icon name="logout-variant" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    width: width * 0.85,
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  menuContent: {
    marginTop: 15,
  },
  menuItem: {
    paddingVertical: 15,
  },
  menuTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  clickHereText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#662d91',
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#662d91',
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
    justifyContent: 'flex-start',
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1976FA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutButton: {
    backgroundColor: '#1976FA',
  },
});

export default BurgerMenuModal;
