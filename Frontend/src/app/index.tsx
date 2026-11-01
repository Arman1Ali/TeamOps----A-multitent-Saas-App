import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoadingScreen() {
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1000);

    return () => clearTimeout(redirectTimer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 " style={{flex:1 , justifyContent:"center"}} >
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-[28px] bg-indigo-600">
          <Ionicons name="briefcase-outline" size={48} color="#FFFFFF" />
        </View>

        <Text className="text-2xl font-bold text-slate-900">TeamOps</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          Getting your workspace ready...
        </Text>

        <ActivityIndicator
          className="mt-8"
          size="small"
          color="#4F46E5"
          accessibilityLabel="Loading your workspace"
        />
      </View>
    </SafeAreaView>
  );
}
