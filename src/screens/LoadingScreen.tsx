import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message }: LoadingScreenProps) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#4F46E5" />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F19', // Your common dark background
  },
  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoadingScreen;
