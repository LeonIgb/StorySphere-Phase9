import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

// Shared screen shell: cream background plus top safe-area padding.
// iOS SafeAreaView handles the notch; Android needs the status bar height added by hand.
const ANDROID_TOP = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export default function ScreenContainer({ children, style }) {
  return <SafeAreaView style={[styles.base, { paddingTop: ANDROID_TOP }, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.cream100 },
});
