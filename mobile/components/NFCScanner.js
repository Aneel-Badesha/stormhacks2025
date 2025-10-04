import React, {useEffect, useState, useRef} from 'react';
import {View, Text, Button, Platform, ScrollView, StyleSheet, Alert} from 'react-native';
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

// initialize NFC on app start
function initNFC() {
  NfcManager.start()
    .then(() => {
      // started
    })
    .catch(err => {
      console.warn('NfcManager start failed', err);
    });
}

function parseNdefMessage(tag) {
  if (!tag || !tag.ndefMessage) return null;
  try {
    return tag.ndefMessage
      .map(record => {
        try {
          // try decode as text
          const payload = record.payload || [];
          // NDEF text record payload: status byte + lang bytes + text
          if (record.type && (record.type.toString().toLowerCase().includes('t') || record.type === Ndef.TNF_WELL_KNOWN)) {
            try {
              return Ndef.text.decodePayload(payload);
            } catch (e) {
              // fallback to hex dump
            }
          }
          // fallback: convert bytes to hex string
          return Array.from(payload)
            .map(b => ('0' + (b & 0xff).toString(16)).slice(-2))
            .join(' ');
        } catch (e) {
          return JSON.stringify(record);
        }
      })
      .join(' | ');
  } catch (e) {
    return null;
  }
}

export default function NFCScanner() {
  const [scanning, setScanning] = useState(false);
  const [tag, setTag] = useState(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    initNFC();
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScan() {
    if (scanning) return;
    setTag(null);
    setScanning(true);

    try {
      // registerTagEvent works on Android & iOS (iOS with proper entitlements)
      await NfcManager.registerTagEvent(tag => {
        setTag(tag);
        // auto-stop after first tag
        stopScan();
        Alert.alert('NFC Tag discovered', JSON.stringify(tag.id || tag));
      });
      registeredRef.current = true;
    } catch (ex) {
      console.warn('registerTagEvent failed', ex);
      Alert.alert('NFC Error', String(ex));
      setScanning(false);
    }
  }

  async function stopScan() {
    try {
      if (registeredRef.current) {
        await NfcManager.unregisterTagEvent();
        registeredRef.current = false;
      }
    } catch (ex) {
      // ignore
    }
    setScanning(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NFC Scanner</Text>
      <Text style={styles.status}>Platform: {Platform.OS}</Text>

      <View style={styles.buttons}>
        <Button title={scanning ? 'Scanning... (Tap to stop)' : 'Start scan'} onPress={() => (scanning ? stopScan() : startScan())} />
      </View>

      <View style={styles.tagContainer}>
        <Text style={styles.subtitle}>Last tag raw JSON</Text>
        <Text style={styles.tagText}>{tag ? JSON.stringify(tag, null, 2) : 'No tag read yet'}</Text>

        <Text style={styles.subtitle}>Parsed NDEF (if available)</Text>
        <Text style={styles.tagText}>{tag ? parseNdefMessage(tag) || 'No NDEF message' : '-'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  status: {marginBottom: 12, color: '#444'},
  buttons: {marginBottom: 14},
  tagContainer: {backgroundColor: '#f7f7f7', padding: 12, borderRadius: 8},
  subtitle: {fontWeight: '600', marginTop: 8},
  tagText: {fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 6},
});
