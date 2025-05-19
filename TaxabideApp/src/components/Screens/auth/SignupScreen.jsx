import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignUpScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [number, setNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !password || !number || !panNumber) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('l_name', username);
      formData.append('l_email', email);
      formData.append('l_password', password);
      formData.append('l_number', number);
      formData.append('l_pan_no', panNumber);

      const response = await fetch('https://taxabide.in/api/sign-up-api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Signup API response:', data);
      console.log('Signup API l_id:', data.l_id);
      console.log('Signup API user_id:', data.user_id);

      if (data.success) {
        // Store user data in AsyncStorage
        const userData = {
          id: data.user_id,          // Database user ID
          l_id: data.l_id,           // Login ID
          name: data.l_name || email.split('@')[0],
          email: data.l_email || email,
          mobile: data.l_number || '',
          pan: data.l_pan_no || ''
        };
        
        console.log('Saving user data to AsyncStorage:', userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        Alert.alert(
          'Success', 
          `Account created successfully!\nLogin Table ID (l_id): ${data.l_id || 'N/A'}\nUser ID: ${data.user_id || 'N/A'}`, 
          [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]
        );
        
        setUsername('');
        setEmail('');
        setPassword('');
        setNumber('');
        setPanNumber('');
      } else {
        Alert.alert('Error', data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.tagline}>Provide Service & Knowledge!</Text>
        <Text style={styles.title}>Sign Up to your Account</Text>
        <Text style={styles.subtitle}>Welcome back! please enter your detail</Text>

        <Input icon="account-outline" placeholder="Username" value={username} onChangeText={setUsername} />
        <Input icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input
          icon="lock-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureTextEntry}
          toggleSecureTextEntry={() => setSecureTextEntry(!secureTextEntry)}
          isPassword
          showPassword={secureTextEntry}
        />
        <Text style={styles.passwordNote}>Your password must have at least 8 characters</Text>

        <Input icon="phone-outline" placeholder="Number" value={number} onChangeText={setNumber} keyboardType="phone-pad" />
        <Input icon="file-document-outline" placeholder="PAN Number" value={panNumber} onChangeText={setPanNumber} autoCapitalize="characters" />

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signUpButtonText}>Sign Up</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const Input = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry, isPassword, toggleSecureTextEntry, autoCapitalize = 'none', showPassword }) => (
  <View style={styles.inputWrapper}>
    <MaterialCommunityIcons name={icon} size={22} color="#666" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#666"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
    />
    {isPassword && (
      <TouchableOpacity onPress={toggleSecureTextEntry} style={styles.eyeButton}>
        <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
      </TouchableOpacity>
    )}
  </View>
);

export default SignUpScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  logo: {
    width: 220,
    height: 70,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  tagline: {
    color: '#0056d2',
    alignSelf: 'center',
    fontSize: 12,
    marginBottom: 30,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 5,
  },
  passwordNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    marginLeft: 5,
  },
  signUpButton: {
    backgroundColor: '#0a58ff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#0a58ff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
