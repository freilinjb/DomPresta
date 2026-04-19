import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomTabBar from './BottomTabBar';

const ScreenWithTab = (Component: React.ComponentType<any>) => (props: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Component {...props} />
      </View>
      <BottomTabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenWithTab;