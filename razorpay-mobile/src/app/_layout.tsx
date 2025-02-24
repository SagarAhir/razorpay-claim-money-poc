import { Stack } from "expo-router";
import { BankAccountProvider } from "../context/BankAccounts";

export default function RootLayout() {
  return (
    <BankAccountProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </BankAccountProvider>
  );
}
