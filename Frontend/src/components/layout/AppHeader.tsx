
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";

type AppHeaderProps = {
  title: string;
  subtitle: string;
};

export default function AppHeader({
  title,
  subtitle,
}: AppHeaderProps) {
   return(
  
    <View className="flex-row items-center justify-between  px-3 ">

        <View className="flex-1 pr-4">
          <Text className="mt-1 text-[10px] text-slate-500" numberOfLines={1}>
            {subtitle}
          </Text>

          <Text className="text-[20px] font-bold text-slate-900" numberOfLines={2}>
            {title}
          </Text>
        </View>


      <View className="flex-row gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200  bg-indigo-50"
            style={({ pressed }) => ({
             opacity: pressed ? 0.65 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],})}
            onPress={() => console.log("Notifications pressed")} 
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color="#334155"
            />
            <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-indigo-500" />
          </Pressable>

        <Pressable
           accessibilityRole="button"
           accessibilityLabel="Notifications"
           className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-black"
           style={({ pressed }) => ({
       opacity: pressed ? 0.65 : 1,
       transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
     onPress={() => console.log("Notifications pressed")}>

                 <Text className="text-base font-bold text-white">AM</Text>
                <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-indigo-500" />
       </Pressable>
        </View>


      </View>
   
  );
}
