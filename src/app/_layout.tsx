import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { darkTheme } from '../theme/colors';
import { setupNotifications } from '../services/notifications';
import { UserProvider } from '../context/UserContext';
import { ChatProvider } from '../context/ChatContext';

export default function RootLayout() {
  useEffect(() => {
    setupNotifications().catch(console.log);
  }, []);

  return (
    <UserProvider>
      <ChatProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: darkTheme.surface },
            headerTintColor: darkTheme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: darkTheme.background },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'OfflineChat',
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              title: 'Conversation',
            }}
          />
        </Stack>
      </ChatProvider>
    </UserProvider>
  );
}
