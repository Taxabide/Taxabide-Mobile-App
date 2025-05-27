import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const BusinessHomescreen = ({ navigation }) => {
  const handleLoanPress = (loanType) => {
    switch (loanType) {
      case 'Personal Loan':
        navigation.navigate('BusinessPersonalLoan');
        break;
      case 'Business Loan':
        navigation.navigate('BusinessPersonalLoan');
        break;
      case 'Home Loan':
        navigation.navigate('BusinessPersonalLoan');
        break;
      case 'Loan Against Property':
        navigation.navigate('BusinessLoanAgainstProperty');
        break;
      case 'Car Loan':
        navigation.navigate('BusinessPersonalLoan');
        break;
      case 'Old Car Loan':
        navigation.navigate('BusinessPersonalLoan');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Loan</Text>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Business Owner</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Loan Types Grid */}
          <View style={styles.grid}>
            {/* Personal Loan */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleLoanPress('Personal Loan')}
            >
              <View style={styles.iconContainer}>
                <Icon name="account" size={32} color="#7E57C2" />
              </View>
              <Text style={styles.gridItemTitle}>Personal Loan</Text>
              <Text style={styles.gridItemSubtitle}>Starting ROI @ 10.40%</Text>
            </TouchableOpacity>

            {/* Business Loan */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleLoanPress('Business Loan')}
            >
              <View style={styles.iconContainer}>
                <Icon name="briefcase" size={32} color="#26A69A" />
              </View>
              <Text style={styles.gridItemTitle}>Business Loan</Text>
              <Text style={styles.gridItemSubtitle}>Starting ROI @ 14.00%</Text>
            </TouchableOpacity>

            {/* Home Loan */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleLoanPress('Home Loan')}
            >
              <View style={styles.iconContainer}>
                <Icon name="home" size={32} color="#42A5F5" />
              </View>
              <Text style={styles.gridItemTitle}>Home Loan</Text>
              <Text style={styles.gridItemSubtitle}>Starting ROI @ 8.50%</Text>
            </TouchableOpacity>

            {/* Loan Against Property */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleLoanPress('Loan Against Property')}
            >
              <View style={styles.iconContainer}>
                <Icon name="home-city" size={32} color="#EF5350" />
              </View>
              <Text style={styles.gridItemTitle}>Loan Against Property</Text>
              <Text style={styles.gridItemSubtitle}>Starting ROI @ 10.50%</Text>
            </TouchableOpacity>

            {/* Car Loan */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleLoanPress('Car Loan')}
            >
              <View style={styles.iconContainer}>
                <Icon name="car" size={32} color="#FF7043" />
              </View>
              <Text style={styles.gridItemTitle}>Car Loan</Text>
              <Text style={styles.gridItemSubtitle}>Starting ROI @ 8.50%</Text>
            </TouchableOpacity>

            {/* Old Car Loan */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => handleLoanPress('Old Car Loan')}
            >
              <View style={styles.iconContainer}>
                <Icon name="car-estate" size={32} color="#FFA726" />
              </View>
              <Text style={styles.gridItemTitle}>Old Car Loan</Text>
              <Text style={styles.gridItemSubtitle}>Starting ROI @ 10.85%</Text>
            </TouchableOpacity>
          </View>

          {/* Loan Data Analytics Button */}
          <TouchableOpacity style={styles.analyticsButton}>
            <LinearGradient
              colors={['#7B1FA2', '#6A1B9A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyticsGradient}
            >
              <Text style={styles.analyticsText}>Loan Data Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subHeader: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gridItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  analyticsButton: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  analyticsGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  analyticsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BusinessHomescreen;
