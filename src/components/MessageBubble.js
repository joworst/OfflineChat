import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ text, isSent, timestamp }) {
  return (
    <View style={[styles.bubble, isSent ? styles.sent : styles.received]}>
      <Text style={[styles.text, isSent ? styles.sentText : styles.receivedText]}>
        {text}
      </Text>
      <Text style={[styles.time, isSent ? styles.sentTime : styles.receivedTime]}>
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  sent: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  received: {
    backgroundColor: '#E9E9EB',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#1a1a1a',
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  receivedTime: {
    color: '#888',
    textAlign: 'right',
  },
});
