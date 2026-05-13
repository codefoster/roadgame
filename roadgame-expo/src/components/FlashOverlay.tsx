import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  text: string;
  color: string;
}

export default function FlashOverlay({ visible, text, color }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
    }
  }, [visible, text]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity, backgroundColor: color }]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
