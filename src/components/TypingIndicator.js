import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { darkTheme } from '../theme/colors';

export default function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 200);
    const a3 = anim(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const renderDot = (anim) => (
    <Animated.View
      style={[styles.dot, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]}
    />
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.bubble}>
        {renderDot(dot1)}
        {renderDot(dot2)}
        {renderDot(dot3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    marginLeft: 14,
    marginBottom: 6,
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: darkTheme.receivedBubble,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: darkTheme.textMuted,
  },
});
