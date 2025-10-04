import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import NFCScanner from './components/NFCScanner';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <NFCScanner />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
