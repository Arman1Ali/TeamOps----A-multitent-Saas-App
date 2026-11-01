import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

type TaskCardProps = {
  completedTask: number;
  taskLabel: string;
  trendText: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  backroundColor:string;

};

export default function TaskCard({
  completedTask,
  taskLabel,
  trendText,
  iconName,
  iconColor,
  backroundColor,

}: TaskCardProps) {
  return (
    <View className=" flex-1 rounded-[22px] bg-white border border-slate-200  ">
      <Ionicons
        name={iconName}
        color={iconColor}
        size={15}
        className="m-4 self-start rounded-[10px] p-2"
        style={{backgroundColor: backroundColor}}
      />
      <Text className="px-4 pr-2 text-2xl font-bold">{completedTask}</Text>
      <Text className=" px-4 text-[10px]">{taskLabel}</Text>
      <Text className=" px-4 pr-8 py-4 text-[8px] text-green-600 ">{trendText}</Text>
    </View>
  );
}
