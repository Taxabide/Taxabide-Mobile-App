import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

const DigiWebPanel = () => {
  return (
    <View style={styles.container}>
      <View style={styles.digiwebPanelContainer}>
        <View style={styles.digiwebHeader}>
          <View style={styles.digiwebLogoContainer}>
            <Text style={styles.tulyaText}>TULYA</Text>
            <Text style={styles.thText}>TH</Text>
            <Text style={styles.digiwebText}>DigiWeb</Text>
            <Text style={styles.codeSymbol}>{`</>`}</Text>
            <Text style={styles.panelText}>Panel</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digiwebPanelContainer: {
    backgroundColor: '#4A235A',
    borderRadius: 25,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  digiwebHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digiwebLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tulyaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 2,
  },
  thText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  digiwebText: {
    color: '#00BCD4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  codeSymbol: {
    color: '#00BCD4',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  panelText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

export default DigiWebPanel;
