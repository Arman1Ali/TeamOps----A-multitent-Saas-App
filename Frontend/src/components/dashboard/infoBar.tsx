import Ionicons from "@react-native-vector-icons/ionicons";
import {
    Host,
    LinearProgressIndicator,
} from "@expo/ui/jetpack-compose";
import {
    fillMaxWidth,
    height,
} from "@expo/ui/jetpack-compose/modifiers";
import { Text, View } from "react-native";
import Profile_icon from "./profilr";
import Title_Bar from "./Title";

type InfoBarProps = {
    completedProjectPercent: number;
};

export default function InfoBar({ completedProjectPercent }: InfoBarProps) {
    const projectProgress = Math.min(100, Math.max(0, completedProjectPercent));

    return (
        <View className="gap-2 ">
            <View>
                <Title_Bar
                    title="Active projects"
                    sub="View all"
                    href="/(tabs)/projects"
                />

                <View className="mx-3 mt-4 flex-row gap-4 rounded-[22px] bg-white px-5 pt-6 border border-slate-200">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                        <Ionicons
                            name="briefcase-outline"
                            size={22}
                            color="#6366F1"
                        />
                    </View>

                    <View className="flex-1 gap-3">
                        <View className="flex-row justify-between">
                            <Text className="text-[13px] font-semibold">
                                Website Redesign
                            </Text>
                            <Text className="font-bold text-indigo-500">
                                {projectProgress}%
                            </Text>
                        </View>

                        <View className="gap-2">
                            <Text className="text-xs font-extralight text-slate-600">
                                Design &amp; Development
                            </Text>
                            <Host matchContents>
                                <LinearProgressIndicator
                                    progress={projectProgress / 100}
                                    color="#6366F1"
                                    trackColor="#E2E8F0"
                                    strokeCap="round"
                                    gapSize={0}
                                    drawStopIndicator={{ stopSize: 0 }}
                                    modifiers={[
                                        fillMaxWidth(),
                                        height(6),
                                    ]}
                                />
                            </Host>
                        </View>

                        <View className="flex-row items-center justify-between py-4">
                            <View className="flex-row items-center gap-2">
                                <Ionicons
                                    name="calendar-clear-outline"
                                    color="#64748B"
                                    size={16}
                                />
                                <Text className="text-[10px] font-ligh  text-slate-600">
                                    Due Sep 28
                                </Text>
                            </View>

                            <View className="flex-row">
                                <Profile_icon bg="#E8EAF6" name="SC" text="#2B0071" />
                                <Profile_icon bg="#ADD8E6" name="MR" text="#00008B" />
                                <Profile_icon bg="#D7CCC8" name="OP" text="#410200" />
                                <Profile_icon bg="#D3D3D3" name="2+" text="#686868" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View>
                <Title_Bar
                    title="Team pulse"
                    sub="See team"
                    href="/(tabs)/team"
                />

                <View className="mx-3 my-4 flex-row items-center gap-4 rounded-[22px] bg-white px-5 py-6 border border-slate-200">
                    <View className="flex-row"> 

                        <Profile_icon bg="#E8EAF6" name="SC" text="#2B0071" />
                       
                        <Profile_icon bg="#ADD8E6" name="MR" text="#00008B" />
                        <Profile_icon bg="#D7CCC8" name="OP" text="#410200" />
                        <Profile_icon bg="#D3D3D3" name="2+" text="#686868" />
                    </View>

                    <View className="flex-1 gap-1">
                        <Text className="text-[13px] font-semibold">
                            8 teammates online
                        </Text>
                        <Text className="text-xs font-light  text-slate-600">
                            Your team is collaborating on Website Redesign
                        </Text>
                    </View>
                </View>
            </View>

            <View>
                <Title_Bar
                    title="Needs attention"
                    sub="View tasks"
                    href="/(tabs)/tasks"
                />

                <View className="mx-3 mt-4 flex-row items-center gap-4 rounded-[22px] bg-white px-5 py-6 border border-slate-200">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                        <Ionicons
                            name="alert-circle-outline"
                            size={22}
                            color="#D97706"
                        />
                    </View>

                    <View className="flex-1 gap-1">
                        <Text className="text-[13px] font-semibold">
                            2 task is overdue
                        </Text>
                        <Text className="text-xs font-light text-slate-600">
                            Website Redesign · 1 day overdue
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
