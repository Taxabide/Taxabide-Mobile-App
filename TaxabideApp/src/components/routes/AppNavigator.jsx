import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, StyleSheet, ScrollView, Dimensions} from 'react-native';
import SignInScreen from '../Screens/auth/SignInScreen';
import SignUpScreen from '../Screens/auth/SignupScreen';
import HomeScreen from '../Screens/Home/HomeScreen';
import AddClient from '../Screens/Client/AddClient';
import ServiceList from '../Screens/Services/ServiceList';
import PlaceOrder from '../Screens/Services/PlaceOrder';
import ProfileScreen from '../Screens/Profile/ProfileScreen';
import ViewAllOrder from '../Screens/Orders/ViewAllOrder';
import WebDevelopment from '../Screens/DigiwebPanel/DigiWebComponent/WebDevelopment';
import WebDesigning from '../Screens/DigiwebPanel/DigiWebComponent/WebDesigning';
import DigitalMarketing from '../Screens/DigiwebPanel/DigiWebComponent/DigitalMarketing';
import AppDevelopment from '../Screens/DigiwebPanel/DigiWebComponent/AppDevelopment';
import DigiwebTable from '../Screens/DigiwebPanel/DigiwebTable/DigiwebTable';
import AppDevelopmentTable from '../Screens/DigiwebPanel/DigiwebTable/AppDevelopmentTable';
import {useSelector} from 'react-redux';

const Stack = createNativeStackNavigator();
const {height} = Dimensions.get('window');

const AppNavigator = () => {
  // Get authentication state from Redux
  const {user, isLoading} = useSelector(state => state.user);
  console.log('>>>>>>>>>>>.iser', user);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{
          headerShown: false,
          // Add these options to handle back button behavior better
          animation: 'slide_from_right',
          presentation: 'card',
        }}>
        {!user ? (
          // Auth screens for unauthenticated users
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{
                animationTypeForReplace: !user ? 'pop' : 'push',
              }}
            />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          // App screens for authenticated users
          <>
            <Stack.Screen name="Home" component={AuthenticatedScreen} />
            <Stack.Screen name="AddClient" component={AddClient} />
            <Stack.Screen
              name="ServiceList"
              
              component={ServiceList}
              options={{
                // These options ensure we can always go back to this screen
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="OrderScreen"
              component={PlaceOrder}
              options={{
                // These options ensure we can go back to ServiceList
                gestureEnabled: true,
              }}
            />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="ViewAllOrder" component={ViewAllOrder} />
            <Stack.Screen name="WebDevelopment" component={WebDevelopment} />
            <Stack.Screen name="WebDesigning" component={WebDesigning} />
            <Stack.Screen name="DigitalMarketing" component={DigitalMarketing} />
            <Stack.Screen name="AppDevelopment" component={AppDevelopment} />
            <Stack.Screen name="DigiwebTable" component={DigiwebTable} />
            <Stack.Screen name="AppDevelopmentTable" component={AppDevelopmentTable} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Wrapper component for authenticated screens with footer
const AuthenticatedScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContent}>
          <HomeScreen />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height, // Ensures content fills at least full screen height
  },
  mainContent: {
    flex: 1, // Takes up all available space before footer
  },
});

export default AppNavigator;
