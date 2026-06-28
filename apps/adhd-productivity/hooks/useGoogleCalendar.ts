import { useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'focus:google-access-token';
const TOKEN_EXPIRY_KEY = 'focus:google-token-expiry';

export type CalendarAuthState = 'idle' | 'loading' | 'authenticated' | 'error';

export function useGoogleCalendar() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token, expires_in } = response.authentication ?? {};
      if (access_token) {
        const expiry = Date.now() + (expires_in ?? 3600) * 1000;
        SecureStore.setItemAsync(TOKEN_KEY, access_token);
        SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiry));
      }
    }
  }, [response]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return null;
    // Return null if token expires within 60 seconds
    if (Date.now() > Number(expiry) - 60_000) return null;
    return token;
  }, []);

  const signIn = useCallback(async (): Promise<string | null> => {
    const existing = await getToken();
    if (existing) return existing;
    await promptAsync();
    // Token will be stored in the useEffect above; return current stored value
    return SecureStore.getItemAsync(TOKEN_KEY);
  }, [getToken, promptAsync]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  }, []);

  const isReady = !!request;

  return { signIn, signOut, getToken, isReady };
}
