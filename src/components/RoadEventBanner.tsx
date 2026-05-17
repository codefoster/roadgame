import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  name: string;
  desc: string;
  color: string;
  duration: number; // seconds
  visible: boolean;
}

export default function RoadEventBanner({ name, desc, color, duration, visible }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

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
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { borderColor: color, transform: [{ translateY }] }]}>
      <Text style={[styles.label, { color }]}>🚗 Road Event</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.desc}>{desc}</Text>
      {duration > 0 && <Text style={[styles.duration, { color }]}>Lasts {duration}s</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    zIndex: 300,
    alignItems: 'center',
  },
  label:    { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  name:     { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  desc:     { color: '#aaa', fontSize: 13, textAlign: 'center' },
  duration: { fontSize: 11, marginTop: 4 },
});
