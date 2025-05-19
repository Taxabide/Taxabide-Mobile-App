# ProfileNavbar Component

A reusable navigation bar component for the TaxAbide mobile application that provides a consistent header experience across different screens.

## Features

- Back navigation button
- TaxAbide logo with navigation to Home screen
- Profile icon with dropdown menu
- User profile management functionality
- Logout functionality

## Usage

Import the component into any screen where you need a navigation bar:

```jsx
import ProfileNavbar from '../ProfileNavbar';

// Inside your component:
<ProfileNavbar 
  navigation={navigation} 
  currentUser={userData} 
  updateUser={updateUser}
  title="Optional Screen Title" 
/>
```

## Props

- `navigation`: The navigation object from React Navigation
- `currentUser`: The current user object with user details
- `updateUser`: Function to update the user context
- `title`: (Optional) A title for the screen that can be displayed

## Example

```jsx
import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import ProfileNavbar from '../ProfileNavbar';
import { useUser } from '../../context/UserContext';

const MyScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  
  return (
    <SafeAreaView style={styles.container}>
      <ProfileNavbar 
        navigation={navigation}
        currentUser={user}
        updateUser={updateUser}
      />
      
      {/* Rest of your screen content */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MyScreen;
```

This component helps maintain consistency across the app while reducing code duplication. 