import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const HomeFooter = ({ onScrollToTop }) => {
  return (
    <View style={styles.footerWrapper}>
      {/* Logo */}
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Copyright text */}
      <Text style={styles.copyright}>
        © 2019–25 TaxAbide. Powered by-
      </Text>
      
      {/* DigiWeb logo */}
      <Image
        source={require('../../assets/images/digiweb.png')}
        style={styles.poweredLogo}
        resizeMode="contain"
      />
      
      {/* Social Icons */}
      <View style={styles.socialRow}>
        <TouchableOpacity onPress={() => Linking.openURL('https://facebook.com')}>
          <Icon name="facebook" size={18} color="#fff" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')}>
          <Icon name="instagram" size={18} color="#fff" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com')}>
          <Icon name="twitter" size={18} color="#fff" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://linkedin.com')}>
          <Icon name="linkedin" size={18} color="#fff" style={styles.icon} />
        </TouchableOpacity>
      </View>
      
      {/* Scroll to Top Button */}
      <TouchableOpacity 
        style={styles.scrollTopButton} 
        onPress={onScrollToTop}  // This calls the function from HomeScreen
        activeOpacity={0.7}
      >
        <Icon name="arrow-up" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    backgroundColor: '#232B3E',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    width: '100%',
    position: 'relative',
  },
  logo: {
    width: 140,
    height: 55,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  copyright: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  poweredLogo: {
    width: 120,
    height: 40,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 15,
    opacity: 0.8,
  },
  scrollTopButton: {
    position: 'absolute',
    right: 15,
    bottom: 75, // Position it vertically centered relative to the footer
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9c27b0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default HomeFooter;