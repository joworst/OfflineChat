import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '../theme/colors';

export default function MessageBubble({ text, isSent, timestamp }) {
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.wrapper, isSent ? styles.wrapperSent : styles.wrapperReceived]}>
      <View style={[styles.bubble, isSent ? styles.sent : styles.received]}>
        <Text style={[styles.text, isSent ? styles.sentText : styles.receivedText]}>
          {text}
        </Text>
        <Text style={[styles.time, isSent ? styles.sentTime : styles.receivedTime]}>
          {time}
        </Text>
      </View>
    </View>
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
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(13, 13, 13, 0.6)',
    textAlign: 'right',
  },
  receivedTime: {
    color: darkTheme.textMuted,
    textAlign: 'right',
  },
});
