import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { darkTheme } from '../theme/colors';

const statusSymbols = {
  sent: '>',
  delivered: '>>',
  read: '>>',
};

const statusColors = {
  sent: darkTheme.textMuted,
  delivered: darkTheme.textSecondary,
  read: darkTheme.primary,
};

export default function MessageBubble({ text, isSent, timestamp, status }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, isSent ? styles.wrapperSent : styles.wrapperReceived, { opacity: fadeAnim }]}>
      <View style={[styles.bubble, isSent ? styles.sent : styles.received]}>
        <Text style={[styles.text, isSent ? styles.sentText : styles.receivedText]}>
          {text}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isSent ? styles.sentTime : styles.receivedTime]}>
            {time}
          </Text>
          {isSent && status && (
            <Text style={[styles.statusIcon, { color: statusColors[status] || statusColors.sent }]}>
              {statusSymbols[status] || statusSymbols.sent}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    marginHorizontal: 14,
  },
  wrapperSent: {
    alignItems: 'flex-end',
  },
  wrapperReceived: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sent: {
    backgroundColor: darkTheme.sentBubble,
    borderBottomRightRadius: 4,
  },
  received: {
    backgroundColor: darkTheme.receivedBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: '#0D0D0D',
  },
  receivedText: {
    color: darkTheme.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 10,
  },
  sentTime: {
    color: 'rgba(13, 13, 13, 0.6)',
  },
  receivedTime: {
    color: darkTheme.textMuted,
  },
  statusIcon: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
});
