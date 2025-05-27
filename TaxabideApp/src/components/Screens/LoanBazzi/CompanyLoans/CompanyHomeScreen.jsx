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

const { width } = Dimensions.get('window');

const CompanyHomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header Title */}
          <Text style={styles.headerTitle}>Company</Text>

          {/* Business Loan Card */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('CompanyBusinessLoan')}
          >
            <View style={styles.iconContainer}>
              <Icon name="office-building" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.cardTitle}>Business Loan</Text>
            <Text style={styles.cardSubtitle}>Starting ROI @ 14.00%</Text>
          </TouchableOpacity>

          {/* Analytics Card */}
          <View style={styles.card}>
            <Text style={styles.rightCardTitle}>Company</Text>
            <TouchableOpacity>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyticsButton}
              >
                <Text style={styles.analyticsText}>Loan Data Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.rightCardSubtitle}>Business Loan</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  rightCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  rightCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  analyticsButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  analyticsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CompanyHomeScreen; 