import Ionicons from "@react-native-vector-icons/ionicons";
import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

type Props = {
    title: string;
    sub?: string;
    href?: Href;
};

export default function Title_Bar({ title, sub, href }: Props) {
    return (
        <View className="mx-4 mt-6 flex-row items-center justify-between">
            <Text className="font-semibold">{title}</Text>
            {sub && (
                href ? (
                    <Pressable
                        className="flex-row items-center"
                        onPress={() => router.push(href)}
                        accessibilityRole="button"
                        accessibilityLabel={`${sub} ${title}`}
                    >
                        <Text className="font-bold text-indigo-500">{sub}</Text>
                        <Ionicons
                            name="arrow-forward-outline"
                            color="#6366F1"
                            size={12}
                            className="pl-2"
                        />
                    </Pressable>
                ) : (
                    <Text className="font-bold text-indigo-500">{sub}</Text>
                )
            )}
        </View>
    );
}