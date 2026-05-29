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
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MessageBubble from '../../components/MessageBubble';
import {
  connectToDevice,
  sendMessage,
  subscribeToMessages,
} from '../../services/bluetooth';
import { saveMessage, getMessages } from '../../database/sqlite';
import { showLocalNotification } from '../../services/notifications';
import { darkTheme } from '../../theme/colors';

interface Message {
  id: number;
  deviceId: string;
  text: string;
  isSent: boolean;
  timestamp: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const deviceId = params.id as string;
  const deviceName = params.name as string;
  const myName = (params.myName as string) || 'Moi';
  const myColor = (params.myColor as string) || darkTheme.primary;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const deviceRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const appStateRef = useRef('active');

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
    connectToDevice(
      { id: deviceId },
      () => {
        setConnectionStatus('disconnected');
      }
    )
      .then(async (device: any) => {
        deviceRef.current = device;
        setConnectionStatus('connected');

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
          showLocalNotification(
            decodeURIComponent(deviceName || 'Inconnu'),
            text
          ).catch(console.log);
        });
      })
      .catch((error: any) => {
        setConnectionStatus('disconnected');
        Alert.alert('Erreur connexion', error.message);
      });

    return () => {
      if (deviceRef.current) {
        deviceRef.current.cancelConnection();
      }
    };
  }, [deviceId, loadMessages, deviceName]);

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

  const statusConfig = {
    connecting: { label: 'Connexion en cours...', color: darkTheme.warning },
    connected: { label: 'Connecte', color: darkTheme.success },
    disconnected: { label: 'Deconnecte', color: darkTheme.danger },
  };

  const status = statusConfig[connectionStatus];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {}
        <View style={styles.connectionBar}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.connectionText}>
            {decodeURIComponent(deviceName || 'Appareil')}
          </Text>
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        {}
        <View style={styles.encryptionBadge}>
          <Text style={styles.encryptionText}>Messages chiffres AES</Text>
        </View>

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
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ecris un message..."
            placeholderTextColor={darkTheme.textMuted}
            editable={connectionStatus === 'connected'}
            onSubmitEditing={handleSend}
            multiline={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              connectionStatus !== 'connected' && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={connectionStatus !== 'connected'}
            activeOpacity={0.7}
          >
            <Text style={[styles.sendArrow, connectionStatus !== 'connected' && styles.sendArrowDisabled]}>
              &gt;
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  flex: {
    flex: 1,
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  connectionText: {
    color: darkTheme.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  encryptionBadge: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  encryptionText: {
    color: darkTheme.primary,
    fontSize: 11,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  listContent: {
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: darkTheme.inputBackground,
    color: darkTheme.text,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  sendButton: {
    marginLeft: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: darkTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: darkTheme.textMuted,
  },
  sendArrow: {
    color: '#0D0D0D',
    fontSize: 22,
    fontWeight: '700',
  },
  sendArrowDisabled: {
    color: darkTheme.background,
  },
});
