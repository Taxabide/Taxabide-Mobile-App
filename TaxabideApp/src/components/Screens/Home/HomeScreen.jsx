import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../../styles/HomeScreenStyles';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import Footer from '../Footer/HomeFooter';
import BurgerMenuModal from '../Menu/BurgerMenuModal';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleScrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      });
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </TouchableOpacity>
          </View>

          {/* RupFix Section */}
          <View style={styles.rupfixSection}>
            <View style={styles.rupfixLogoContainer}>
              <Image
                source={require('../../assets/images/rupFix.jpg')}
                style={styles.rupfixLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.rupfixText}>
              <Text style={styles.rupText}>Rup</Text>
              <Text style={styles.fixText}>Fix</Text>
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <View style={styles.infoSection}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  Authorized Partner Center -
                </Text>
              </View>
              <Text style={styles.infoText}>
                FUTURE CAPITAL CONSULTANCY PVT.LTD.
              </Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>APC Code -</Text>
              </View>
              <Text style={styles.infoText}>TA07915</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Allocated Area -</Text>
              </View>
              <Text style={styles.infoText}>Bengali Kothi Dehradun</Text>
            </View>
          </View>

          {/* Taxation Panel */}
          <TouchableOpacity style={styles.taxationContainer}>
            <View style={styles.taxationWrapper}>
              <View style={styles.taxationLogoSection}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.taxationLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.taxationTextContainer}>
                <Text style={styles.taxationText}>Taxation</Text>
                <Text style={styles.taxationPanelText}>Panel</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Wallet Section */}
          <View style={styles.walletsContainer}>
            <TouchableOpacity style={styles.walletContainer}>
              <LinearGradient
                colors={['#89d6e02b', '#81d4fa', '#4fc3f7']}
                start={{x: 0, y: 1}}
                end={{x: 1, y: 0}}
                style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <Icon name="wallet-outline" size={24} color="#fff" />
                  <Text style={styles.walletTitle}>MTP Wallet</Text>
                </View>
                <Text style={styles.walletAmount}>0.00</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add+</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.walletContainer}>
              <LinearGradient
                colors={['#ffe0dc', '#f9a07b', '#e96443']}
                start={{x: 0, y: 1}}
                end={{x: 1, y: 0}}
                style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <Icon name="wallet-outline" size={24} color="#fff" />
                  <Text style={styles.walletTitle}>Earned Wallet</Text>
                </View>
                <Text style={styles.walletAmount}>0.00</Text>
                <TouchableOpacity style={styles.withdrawButton}>
                  <Text style={styles.withdrawButtonText}>Withdraw ➔</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Services Section */}
          <View style={styles.servicesContainer}>
            <TouchableOpacity style={styles.serviceContainer}>
              <LinearGradient
                colors={['#68dae842', '#7de3f3', '#00bcd4']}
                start={{x: 0, y: 1}}
                end={{x: 1, y: 0}}
                style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Icon name="store-outline" size={24} color="#fff" />
                  <Text style={styles.serviceTitle}>Orders</Text>
                </View>
                <Text style={styles.serviceSubtitle}>View All Orders</Text>
                <TouchableOpacity 
                  style={styles.serviceButton}
                  onPress={() => navigation.navigate('ViewAllOrder')}
                >
                  <Text style={styles.serviceButtonText}>Orders ➔</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceContainer}>
              <LinearGradient
                colors={['#b99de447', '#b39ddb', '#7e57c2']}
                start={{x: 0, y: 1}}
                end={{x: 1, y: 0}}
                style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Icon name="account-group" size={24} color="#fff" />
                  <Text style={styles.serviceTitle}>Clients</Text>
                </View>
                <Text style={styles.serviceSubtitle}>
                  Trusted by many clients
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.serviceButton}
                    onPress={() => navigation.navigate('AddClient')}>
                    <Text style={styles.serviceButtonText}>Add ➔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.serviceButton}>
                    <Text style={styles.serviceButtonText}>View All ➔</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Service List Section */}
            <TouchableOpacity style={styles.serviceContainer}>
              <LinearGradient
                colors={['#6fdad463', '#80cbc4', '#26a69a']}
                start={{x: 0, y: 1}}
                end={{x: 1, y: 0}}
                style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Icon name="store-outline" size={24} color="#fff" />
                  <Text style={styles.serviceTitle}>Service List</Text>
                </View>
                <Text style={styles.serviceSubtitle}>
                  Expert help, every step
                </Text>
                <TouchableOpacity 
                  style={styles.serviceButton}
                  onPress={() => navigation.navigate('ServiceList')}>
                  <Text style={styles.serviceButtonText}>View All ➔</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            {/* Search Products Section */}
            <TouchableOpacity style={styles.searchContainer}>
              <LinearGradient
                colors={['#ffcdb4', '#ffb597', '#ff967a']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.searchCard}>
                <View style={styles.searchHeader}>
                  <Icon
                    name="magnify"
                    size={28}
                    color="#fff"
                    style={styles.searchIcon}
                  />
                  <Text style={styles.searchTitle}>Search Services</Text>
                </View>
                <Text style={styles.searchSubtitle}>
                  Find the right service for you
                </Text>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    placeholder="Search services..."
                    placeholderTextColor="rgba(255, 255, 255, 0.8)"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => {
                      if (searchQuery.trim()) {
                        navigation.navigate('ServiceList', {searchQuery});
                      } else {
                        navigation.navigate('ServiceList');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => {
                      if (searchQuery.trim()) {
                        navigation.navigate('ServiceList', {searchQuery});
                      } else {
                        navigation.navigate('ServiceList');
                      }
                    }}>
                    <Icon name="magnify" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Loanbazzi Panel */}
          <TouchableOpacity style={styles.loanbazziContainer}>
            <View style={styles.loanbazziWrapper}>
              <View style={styles.loanbazziLogoSection}>
                <Image
                  source={require('../../assets/images/loanbazi.png')}
                  style={styles.loanbazziLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.loanbazziPanelText}>Panel</Text>
            </View>
          </TouchableOpacity>

          {/* Loan Cards Section */}
          <View style={styles.loanCardsContainer}>
            <LinearGradient
              colors={['#f5e1ff', '#caa6f2bd', '#a56cc1ba']}
              start={{x: 0, y: 1}}
              end={{x: 1, y: 0}}
              style={styles.loanCard}>
              <TouchableOpacity activeOpacity={0.9} style={{flex: 1}}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="account" size={32} color="#fff" />
                    <Text style={styles.cardTitle}>Personal Loan</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>Starting ROI @ 10.40%</Text>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </LinearGradient>
            {/* Home Loan Card */}
            <LinearGradient
              colors={['#ffe2d1', '#f6a89e9e', '#dd5e89b0']}
              start={{x: 0, y: 1}}
              end={{x: 1, y: 0}}
              style={styles.loanCard}>
              <TouchableOpacity activeOpacity={0.9} style={{flex: 1}}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="home" size={32} color="#fff" />
                    <Text style={styles.cardTitle}>Home Loan</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>Starting ROI @ 8.50%</Text>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            {/* Business Loan Card */}
            <LinearGradient
              colors={['#dbe9f4', '#a3b8ccb3', '#4b6cb79c']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.gradientCard}>
              <TouchableOpacity style={styles.loanCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="office-building" size={32} color="#fff" />
                    <Text style={styles.cardTitle}>Business Loan</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>Starting ROI @ 14.00%</Text>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            {/* Car Loan Card */}
            <TouchableOpacity
              style={[styles.loanCard, {backgroundColor: '#4CD790'}]}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Icon name="car" size={32} color="#fff" />
                  <Text style={styles.cardTitle}>Car Loan</Text>
                </View>
                <Text style={styles.cardSubtitle}>Starting ROI @ 10.85%</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Click Here</Text>
                  <Icon name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          {/* Insurance Panel */}
          <View style={styles.insurancePanelContainer}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Home')}
            >
              <View style={styles.insurancePanelHeader}>
                <View style={styles.tulyarthLogoContainer}>
                  <Image
                    source={require('../../assets/images/tulyarth.png')}
                    style={styles.tulyarthLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.insuranceTextContainer}>
                  <Text style={styles.insuranceText}>Insurance</Text>
                  <Text style={styles.panelText}>Panel</Text>
                </View>
              </View>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.insuranceCardsContainer}>
              {/* Health Insurance Card */}
              <TouchableOpacity
                style={[styles.insuranceCard, {backgroundColor: '#FFB6C1'}]}>
                <View style={styles.insuranceHeaderRow}>
                  <Icon name="heart-outline" size={32} color="#fff" />
                  <Text style={styles.insuranceTitle}>Health Insurance</Text>
                </View>
                <Text style={styles.insuranceSubtitle}>
                  For you and your family
                </Text>
                <TouchableOpacity style={styles.insuranceButton}>
                  <Text style={styles.insuranceButtonText}>Buy</Text>
                  <Icon name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Life Insurance Card */}
              <TouchableOpacity
                style={[styles.insuranceCard, {backgroundColor: '#87CEFA'}]}>
                <View style={styles.insuranceHeaderRow}>
                  <Icon name="shield-outline" size={32} color="#fff" />
                  <Text style={styles.insuranceTitle}>Life Insurance</Text>
                </View>
                <Text style={styles.insuranceSubtitle}>
                  Life, Covered with Care
                </Text>
                <TouchableOpacity style={styles.insuranceButton}>
                  <Text style={styles.insuranceButtonText}>Investment</Text>
                  <Icon name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Car Insurance Card */}
              <TouchableOpacity
                style={[styles.insuranceCard, {backgroundColor: '#B0C4DE'}]}>
                <View style={styles.insuranceHeaderRow}>
                  <Icon name="car-outline" size={32} color="#fff" />
                  <Text style={styles.insuranceTitle}>Car Insurance</Text>
                </View>
                <Text style={styles.insuranceSubtitle}>
                  Protection on Every Road
                </Text>
                <TouchableOpacity style={styles.insuranceButton}>
                  <Text style={styles.insuranceButtonText}>Buy</Text>
                  <Icon name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Two Wheeler Insurance Card */}
              <TouchableOpacity
                style={[styles.insuranceCard, {backgroundColor: '#ADD8E6'}]}>
                <View style={styles.insuranceHeaderRow}>
                  <Icon name="bike" size={32} color="#fff" />
                  <Text style={styles.insuranceTitle}>
                    Two Wheeler Insurance
                  </Text>
                </View>
                <Text style={styles.insuranceSubtitle}>
                  Ride Safe, Stay Covered
                </Text>
                <TouchableOpacity style={styles.insuranceButton}>
                  <Text style={styles.insuranceButtonText}>Buy</Text>
                  <Icon name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* DigiWeb Panel */}
          <View style={styles.digiwebPanelContainer}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Home')}
              style={styles.tulyaDigiwebContainer}
            >
              <View style={styles.tulyaDigiwebWrapper}>
                <View style={styles.tulyaDigiwebLogoSection}>
                  <Image
                    source={require('../../assets/images/digiweb.png')}
                    style={styles.tulyaDigiwebLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.insuranceTextContainer}>
                  <Text style={styles.insuranceText}>DigiWeb</Text>
                  <Text style={styles.panelText}>Panel</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <View style={styles.digiwebCardsContainer}>
              {/* Web Development Card */}
              <TouchableOpacity
                style={[styles.digiwebCard, {backgroundColor: '#8B9FFF'}]}>
                <Icon name="laptop" size={32} color="#fff" />
                <View style={styles.digiwebCardContent}>
                  <Text style={styles.digiwebCardTitle}>Web Development</Text>
                  <Text style={styles.digiwebCardSubtitle}>
                    Where Ideas Meet Code
                  </Text>
                  <TouchableOpacity 
                    style={styles.digiwebButton}
                    onPress={() => navigation.navigate('WebDevelopment')}
                  >
                    <Text style={styles.digiwebButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Web Designing Card */}
              <TouchableOpacity
                style={[styles.digiwebCard, {backgroundColor: '#D4CB8F'}]}>
                <Icon name="palette" size={32} color="#fff" />
                <View style={styles.digiwebCardContent}>
                  <Text style={styles.digiwebCardTitle}>Web Designing</Text>
                  <Text style={styles.digiwebCardSubtitle}>
                    Designing Your Identity
                  </Text>
                  <TouchableOpacity 
                    style={styles.digiwebButton}
                    onPress={() => navigation.navigate('WebDesigning')}
                  >
                    <Text style={styles.digiwebButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Digital Marketing Card */}
              <TouchableOpacity
                style={[styles.digiwebCard, {backgroundColor: '#89A5B5'}]}>
                <Icon name="trending-up" size={32} color="#fff" />
                <View style={styles.digiwebCardContent}>
                  <Text style={styles.digiwebCardTitle}>Digital Marketing</Text>
                  <Text style={styles.digiwebCardSubtitle}>
                    Engage, Convert, Grow
                  </Text>
                  <TouchableOpacity 
                    style={styles.digiwebButton}
                    onPress={() => navigation.navigate('DigitalMarketing')}
                  >
                    <Text style={styles.digiwebButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* App Development Card */}
              <TouchableOpacity
                style={[styles.digiwebCard, {backgroundColor: '#8FD3D9'}]}>
                <Icon name="cellphone" size={32} color="#fff" />
                <View style={styles.digiwebCardContent}>
                  <Text style={styles.digiwebCardTitle}>App Development</Text>
                  <Text style={styles.digiwebCardSubtitle}>
                    Smart Apps, Big Impact
                  </Text>
                  <TouchableOpacity 
                    style={styles.digiwebButton}
                    onPress={() => navigation.navigate('AppDevelopment')}
                  >
                    <Text style={styles.digiwebButtonText}>Click Here</Text>
                    <Icon name="chevron-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* P3 Panel */}
              <View style={styles.p3PanelContainer}>
                <View style={styles.p3Header}>
                  <View style={styles.p3LogoWrapper}>
                    <Image
                      source={require('../../assets/images/logo.png')}
                      style={styles.p3Logo}
                      resizeMode="contain"
                    />
                    <Text style={styles.p3Text}>P3 Panel</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.p3CardsContainer}>
                  {/* Bank Accounts Card */}
                  <TouchableOpacity
                    style={[styles.p3Card, {backgroundColor: '#FF4B81'}]}>
                    <Icon
                      name="bank"
                      size={32}
                      color="#fff"
                      style={styles.p3Icon}
                    />
                    <View style={styles.p3CardContent}>
                      <Text style={styles.p3CardTitle}>Bank Accounts</Text>
                      <Text style={styles.p3CardSubtitle}>
                        Banking Made Simple, Secure
                      </Text>
                      <TouchableOpacity style={styles.p3Button}>
                        <Text style={styles.p3ButtonText}>Click Here</Text>
                        <Icon name="chevron-right" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Credit Cards */}
                  <TouchableOpacity
                    style={[styles.p3Card, {backgroundColor: '#7BA7BC'}]}>
                    <Icon
                      name="credit-card"
                      size={32}
                      color="#fff"
                      style={styles.p3Icon}
                    />
                    <View style={styles.p3CardContent}>
                      <Text style={styles.p3CardTitle}>Credit Cards</Text>
                      <Text style={styles.p3CardSubtitle}>
                        Spend Smart, Earn More
                      </Text>
                      <TouchableOpacity style={styles.p3Button}>
                        <Text style={styles.p3ButtonText}>Click Here</Text>
                        <Icon name="chevron-right" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Credit Line */}
                  <TouchableOpacity
                    style={[styles.p3Card, {backgroundColor: '#E8A87C'}]}>
                    <Icon
                      name="cash-multiple"
                      size={32}
                      color="#fff"
                      style={styles.p3Icon}
                    />
                    <View style={styles.p3CardContent}>
                      <Text style={styles.p3CardTitle}>Credit Line</Text>
                      <Text style={styles.p3CardSubtitle}>
                        Flexible Credit, Fast Cash
                      </Text>
                      <TouchableOpacity style={styles.p3Button}>
                        <Text style={styles.p3ButtonText}>Click Here</Text>
                        <Icon name="chevron-right" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Mutual Funds */}
                  <TouchableOpacity
                    style={[styles.p3Card, {backgroundColor: '#00B894'}]}>
                    <Icon
                      name="chart-line"
                      size={32}
                      color="#fff"
                      style={styles.p3Icon}
                    />
                    <View style={styles.p3CardContent}>
                      <Text style={styles.p3CardTitle}>Mutual Funds</Text>
                      <Text style={styles.p3CardSubtitle}>
                        Grow Wealth, Invest Smart
                      </Text>
                      <TouchableOpacity style={styles.p3Button}>
                        <Text style={styles.p3ButtonText}>Click Here</Text>
                        <Icon name="chevron-right" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Footer onScrollToTop={handleScrollToTop} />
      <BurgerMenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
    </View>
  );
};

export default HomeScreen;
