// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './navigation/TabNavigator';
import { Provider as PaperProvider } from 'react-native-paper';  // nếu dùng React Native Paper cho theming

export default function App() {
  return (
    // PaperProvider bọc toàn app để dùng theme Material Design nếu cần
    <PaperProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
