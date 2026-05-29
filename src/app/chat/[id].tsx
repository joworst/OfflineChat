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
  Animated,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MessageBubble from '../../components/MessageBubble';
import TypingIndicator from '../../components/TypingIndicator';
import {
  connectWithAutoReconnect,
  sendMessage,
} from '../../services/bleService';
import {
  createTextPayload,
  createTypingPayload,
  createTypingStopPayload,
  createReadReceiptPayload,
  MessageQueue,
  MESSAGE_TYPES,
  generateId,
} from '../../services/transportManager';
import {
  initDatabase,
  saveMessage,
  getMessages,
  updateMessageStatus,
} from '../../database/sqlite';
import { showLocalNotification } from '../../services/notifications';
import { darkTheme } from '../../theme/colors';
import { useChat } from '../../context/ChatContext';

interface Message {
  id: number;
  deviceId: string;
  text: string;
  isSent: boolean;
  status?: string;
  messageId?: string;
  timestamp: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const TYPING_TIMEOUT_MS = 2000;

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const deviceId = params.id as string;
  const deviceName = params.name as string;
  const myName = (params.myName as string) || 'Moi';
  const myColor = (params.myColor as string) || darkTheme.primary;

  const { setConnectionStatus } = useChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionStatus>('connecting');
  const [otherTyping, setOtherTyping] = useState(false);
  const deviceRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<MessageQueue | null>(null);
  const typingTimerRef = useRef<any>(null);
  const wasTypingRef = useRef(false);
  const receivedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    initDatabase();
    return () => {
      if (cancelRef.current) cancelRef.current();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

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

    const handleMessage = async (parsed: any) => {
      if (parsed.t === MESSAGE_TYPES.TEXT) {
        if (receivedIdsRef.current.has(parsed.i)) return;
        receivedIdsRef.current.add(parsed.i);

        const text = parsed.d || '';
        const msg: Message = {
          id: Date.now(),
          deviceId,
          text,
          isSent: false,
          status: 'received',
          messageId: parsed.i,
          timestamp: parsed.ts || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        saveMessage(deviceId, text, false, parsed.i).catch(console.log);

        if (parsed.i) {
          (async () => { await sendReadReceipt(parsed.i); })();
        }

        showLocalNotification(
          decodeURIComponent(deviceName || 'Inconnu'),
          text
        ).catch(console.log);
      } else if (parsed.t === MESSAGE_TYPES.TYPING) {
        setOtherTyping(true);
      } else if (parsed.t === MESSAGE_TYPES.TYPING_STOP) {
        setOtherTyping(false);
      } else if (parsed.t === MESSAGE_TYPES.READ_RECEIPT) {
        const readMsgId = parsed.d;
        if (readMsgId) {
          updateMessageStatus(readMsgId, 'read').catch(console.log);
          setMessages((prev) =>
            prev.map((m) =>
              m.messageId === readMsgId ? { ...m, status: 'read' } : m
            )
          );
        }
      }
    };

    (async () => {
      try {
        const { device, cancel } = await connectWithAutoReconnect(
          { id: deviceId, name: deviceName },
          (status: string) => {
            setConnectionState(status as ConnectionStatus);
            setConnectionStatus(status as ConnectionStatus);
          },
          handleMessage
        );
        deviceRef.current = device;
        cancelRef.current = cancel;

        queueRef.current = new MessageQueue((payload: string) =>
          sendMessage(device, payload)
        );
      } catch (error: any) {
        setConnectionState('disconnected');
        setConnectionStatus('disconnected');
        Alert.alert('Erreur connexion', error.message);
      }
    })();

    return () => {
      if (cancelRef.current) cancelRef.current();
    };
  }, [deviceId, loadMessages, deviceName]);

  const sendReadReceipt = useCallback((messageId: string) => {
    if (deviceRef.current) {
      const payload = createReadReceiptPayload(messageId);
      sendMessage(deviceRef.current, payload).catch(() => {});
    }
  }, []);

  const handleTyping = useCallback((text: string) => {
    setInputText(text);

    if (!wasTypingRef.current && text.length > 0) {
      wasTypingRef.current = true;
      if (deviceRef.current && queueRef.current) {
        queueRef.current.enqueue(createTypingPayload());
      }
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (wasTypingRef.current) {
        wasTypingRef.current = false;
        if (deviceRef.current && queueRef.current) {
          queueRef.current.enqueue(createTypingStopPayload());
        }
      }
    }, TYPING_TIMEOUT_MS);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !deviceRef.current) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (wasTypingRef.current) {
      wasTypingRef.current = false;
    }

    const messageId = generateId();
    const payload = createTextPayload(text, messageId);

    try {
      if (queueRef.current) {
        queueRef.current.enqueue(payload);
      } else {
        await sendMessage(deviceRef.current, payload);
      }
      const msg = await saveMessage(deviceId, text, true, messageId);
      if (msg) {
        setMessages((prev: Message[]) => [...prev, msg]);
      }
      setInputText('');

      setTimeout(() => {
        updateMessageStatus(messageId, 'delivered').catch(() => {});
        setMessages((prev: Message[]) =>
          prev.map((m: Message) =>
            m.messageId === messageId ? { ...m, status: 'delivered' } : m
          )
        );
      }, 500);
    } catch (e: any) {
      Alert.alert('Erreur envoi', e.message);
    }
  }, [inputText, deviceId]);

  const statusConfig = {
    connecting: { label: 'Connexion en cours...', color: darkTheme.warning },
    connected: { label: 'Connecte', color: darkTheme.success },
    disconnected: { label: 'Deconnecte', color: darkTheme.danger },
  };

  const status = statusConfig[connectionState];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.connectionBar}>
          <Animated.View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.connectionText}>
            {decodeURIComponent(deviceName || 'Appareil')}
          </Text>
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

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
              status={item.status}
            />
          )}
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={otherTyping ? <TypingIndicator /> : null}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleTyping}
            placeholder="Ecris un message..."
            placeholderTextColor={darkTheme.textMuted}
            editable={connectionState === 'connected'}
            onSubmitEditing={handleSend}
            multiline={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              connectionState !== 'connected' && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={connectionState !== 'connected'}
            activeOpacity={0.7}
          >
            <Text style={[styles.sendArrow, connectionState !== 'connected' && styles.sendArrowDisabled]}>
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
