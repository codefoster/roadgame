import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  name: string;
  description: string;
  duration: number; // seconds, 0 = instant
  visible: boolean;
}

export default function HitchhikerBanner({ name, description, duration, visible }: Props) {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Text style={styles.label}>🚗 Hitchhiker!</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.desc}>{description}</Text>
      {duration > 0 && <Text style={styles.duration}>Lasts {duration}s</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    backgroundColor: '#1a2a1a',
    borderColor: '#4caf50',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    zIndex: 200,
    alignItems: 'center',
  },
  label: { color: '#4caf50', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  name:  { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  desc:  { color: '#aaa', fontSize: 13, textAlign: 'center' },
  duration: { color: '#4caf50', fontSize: 11, marginTop: 4 },
});
