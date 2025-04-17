// navigation/TabNavigator.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// Hoặc dùng createBottomTabNavigator nếu muốn tab dưới
import TimerScreen from '../screens/TimerScreen';
import StatsScreen from '../screens/StatsScreen';
import { useTheme } from 'react-native-paper';

const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  const theme = useTheme(); // nếu dùng Paper để lấy theme hiện tại (light/dark)

  return (
    <Tab.Navigator
      initialRouteName="Timer"
      screenOptions={{
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 15 },
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary }, 
        // đường kẻ dưới tab chọn có màu từ theme (hoặc màu tùy chọn)
        tabBarStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tab.Screen name="Timer" component={TimerScreen} options={{ title: 'Timer' }} />
      <Tab.Screen name="Statistics" component={StatsScreen} options={{ title: 'Statistics' }} />
    </Tab.Navigator>
  );
}
