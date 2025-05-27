import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 48 is total horizontal padding

const LoanCard = ({ title, roi, iconName, iconColor, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: iconColor + '20' }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <Icon name={iconName} size={28} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.roiText}>Starting ROI @ {roi}%</Text>
    </TouchableOpacity>
  );
};

const LoanBazziHomescreen = ({ navigation }) => {
  const handleLoanPress = (loanType) => {
    switch (loanType) {
      case 'Personal Loan':
        navigation.navigate('SalariedPersonalLoan');
        break;
      case 'Old Car Loan':
        navigation.navigate('SalariedOldCarLoan');
        break;
      case 'Car Loan':
        navigation.navigate('SalariedCarLoan');
        break;
      case 'Home Loan':
        navigation.navigate('SalariedHomeLoan');
        break;
      case 'Loan Against Property':
      case 'LAP Loan':
        navigation.navigate('SalariedLoanAgainstProperty');
        break;
      default:
        break;
    }
  };

  const loanTypes = [
    {
      title: 'Personal Loan',
      roi: '10.40',
      iconName: 'account',
      iconColor: '#8A2BE2',
    },
    {
      title: 'Home Loan',
      roi: '8.50',
      iconName: 'home',
      iconColor: '#00CED1',
    },
    {
      title: 'Loan Against Property',
      roi: '10.50',
      iconName: 'home-city',
      iconColor: '#FF7F50',
    },
    {
      title: 'Car Loan',
      roi: '8.50',
      iconName: 'car',
      iconColor: '#FF6B6B',
    },
    {
      title: 'Old Car Loan',
      roi: '10.85',
      iconName: 'car-vintage',
      iconColor: '#FFA500',
    },
  ];

  const simpleLoanTypes = [
    'Personal Loan',
    'Home Loan',
    'LAP Loan',
    'Car Loan',
    'Old Car Loan',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Apply Loan</Text>
          <Text style={styles.headerSubtitle}>Salaried</Text>
        </View>

        {/* Loan Types Grid */}
        <View style={styles.loanTypesContainer}>
          {loanTypes.map((loan, index) => (
            <LoanCard
              key={index}
              title={loan.title}
              roi={loan.roi}
              iconName={loan.iconName}
              iconColor={loan.iconColor}
              onPress={() => handleLoanPress(loan.title)}
            />
          ))}
        </View>

        {/* Simple Loan Types Card */}
        <View style={styles.simpleCard}>
          <Text style={styles.simpleHeaderTitle}>Quick Access</Text>
          
          <TouchableOpacity style={styles.simpleAnalyticsButton} activeOpacity={0.9}>
            <LinearGradient
              colors={['#8A2BE2', '#FF6B6B']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.simpleAnalyticsGradient}
            >
              <Text style={styles.simpleAnalyticsText}>Loan Data Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.simpleLoanList}>
            {simpleLoanTypes.map((loan, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.simpleLoanItem}
                activeOpacity={0.7}
                onPress={() => handleLoanPress(loan)}
              >
                <Text style={styles.simpleLoanItemText}>{loan}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  analyticsButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  analyticsGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loanTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  roiText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  simpleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleHeaderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  simpleAnalyticsButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 24,
  },
  simpleAnalyticsGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleAnalyticsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  simpleLoanList: {
    marginTop: 8,
  },
  simpleLoanItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  simpleLoanItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  }
});

export default LoanBazziHomescreen;
