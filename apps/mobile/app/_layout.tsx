import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AnimatedSplash } from "@/components/AnimatedSplash";

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashComplete, setSplashComplete] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = inAuthGroup && segments[1] === "onboarding";
    const inAppGroup = segments[0] === "(app)";

    if (!user && inAppGroup) {
      router.replace("/");
    } else if (user && (inAuthGroup || segments.length === 0) && !inOnboarding) {
      router.replace("/(app)/dashboard");
    }
  }, [user, isLoading, segments]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      {!splashComplete && (
        <AnimatedSplash
          ready={!isLoading && minElapsed}
          onFinish={() => setSplashComplete(true)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
