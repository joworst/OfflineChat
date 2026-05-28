import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'OfflineChat',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          title: 'Conversation',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}
