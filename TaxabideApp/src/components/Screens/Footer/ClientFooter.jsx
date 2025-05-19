import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ClientFooter = () => {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState(null);
  
  const getUserId = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        if (parsed && parsed.t_d_user_id) {
          setUserId(parsed.t_d_user_id);
        }
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
  };

  useEffect(() => {
    getUserId();
  }, []);
  
  return (
    <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.gradientLine} />
      <View style={styles.footer}>
        <View style={styles.contentContainer}>
          <Text style={styles.copyrightText}>© 2019-25 TaxAbide Mitra. All Rights Reserved.</Text>
          
          <View style={styles.poweredByWrapper}>
            <Text style={styles.poweredByText}>Powered By</Text>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/images/tulyarth.png')}
                style={styles.tulyaImage}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/images/digiweb.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    // elevation: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gradientLine: {
    height: 2,
    backgroundColor: '#f0f0f0',
    marginBottom: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  copyrightText: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
    marginBottom: 12,
  },
  poweredByWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  poweredByText: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tulyaImage: {
    height: 12,
    width: 45,
    marginBottom: 2,
  },
  logo: {
    height: 22,
    width: 90,
  },
});

export default ClientFooter; 