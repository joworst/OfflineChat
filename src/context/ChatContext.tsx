import React, { createContext, useContext, useReducer, useCallback } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface ChatState {
  activeDeviceId: string | null;
  connectionStatus: ConnectionStatus;
  typingDeviceId: string | null;
}

interface ChatContextType extends ChatState {
  setActiveChat: (deviceId: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setTyping: (deviceId: string) => void;
  clearTyping: () => void;
  resetChat: () => void;
}

type ChatAction =
  | { type: 'SET_ACTIVE_CHAT'; deviceId: string }
  | { type: 'SET_CONNECTION_STATUS'; status: ConnectionStatus }
  | { type: 'SET_TYPING'; deviceId: string }
  | { type: 'CLEAR_TYPING' }
  | { type: 'RESET' };

const initialState: ChatState = {
  activeDeviceId: null,
  connectionStatus: 'disconnected',
  typingDeviceId: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeDeviceId: action.deviceId, connectionStatus: 'connecting' };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status };
    case 'SET_TYPING':
      return { ...state, typingDeviceId: action.deviceId };
    case 'CLEAR_TYPING':
      return { ...state, typingDeviceId: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const setActiveChat = useCallback((deviceId: string) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', deviceId });
  }, []);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', status });
  }, []);

  const setTyping = useCallback((deviceId: string) => {
    dispatch({ type: 'SET_TYPING', deviceId });
  }, []);

  const clearTyping = useCallback(() => {
    dispatch({ type: 'CLEAR_TYPING' });
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <ChatContext.Provider value={{
      ...state,
      setActiveChat,
      setConnectionStatus,
      setTyping,
      clearTyping,
      resetChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
