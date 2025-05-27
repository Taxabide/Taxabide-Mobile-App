import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LoanCard = ({ title, roi, iconName, iconColor }) => {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Icon name={iconName} size={30} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.roi}>Starting ROI @ {roi}%</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 10,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  roi: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoanCard; 