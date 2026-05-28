import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MessageBubble from '../../components/MessageBubble';
import {
  connectToDevice,
  sendMessage,
  subscribeToMessages,
} from '../../services/bluetooth';
import { saveMessage, getMessages } from '../../database/sqlite';

interface Message {
  id: number;
  deviceId: string;
  text: string;
  isSent: boolean;
  timestamp: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const deviceId = params.id as string;
  const deviceName = params.name as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const deviceRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(deviceId);
      setMessages(msgs);
    } catch (e: any) {
      console.log(e);
    }
  }, [deviceId]);

  useEffect(() => {
    loadMessages();
    connectToDevice({ id: deviceId })
      .then(async (device: any) => {
        deviceRef.current = device;
        setConnected(true);
        setConnecting(false);

        await subscribeToMessages(device, (text: string) => {
          const msg: Message = {
            id: Date.now(),
            deviceId,
            text,
            isSent: false,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, msg]);
          saveMessage(deviceId, text, false).catch(console.log);
        });
      })
      .catch((error: any) => {
        setConnecting(false);
        Alert.alert('Erreur connexion', error.message);
      });

    return () => {
      if (deviceRef.current) {
        deviceRef.current.cancelConnection();
      }
    };
  }, [deviceId, loadMessages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !deviceRef.current) return;

    try {
      await sendMessage(deviceRef.current, text);
      const msg = await saveMessage(deviceId, text, true);
      setMessages((prev) => [...prev, msg]);
      setInputText('');
    } catch (e: any) {
      Alert.alert('Erreur envoi', e.message);
    }
  }, [inputText, deviceId]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {connecting && (
        <View style={styles.connectingBanner}>
          <Text style={styles.connectingText}>
            Connexion à {decodeURIComponent(deviceName || '')}...
          </Text>
        </View>
      )}

      {!connecting && !connected && (
        <View style={styles.connectingBanner}>
          <Text style={styles.errorText}>Connexion perdue</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MessageBubble
            text={item.text}
            isSent={item.isSent}
            timestamp={item.timestamp}
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écris un message..."
          placeholderTextColor="#888"
          editable={connected}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, !connected && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!connected}
        >
          <Text style={styles.sendText}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  connectingBanner: {
    padding: 12,
    backgroundColor: '#FFD60A',
    alignItems: 'center',
  },
  connectingText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#1a1a1a',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
