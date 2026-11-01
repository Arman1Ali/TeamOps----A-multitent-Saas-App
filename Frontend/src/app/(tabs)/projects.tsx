import AppHeder from "@/components/layout/AppHeader";
import ProjectCard from "@/components/projects/projectCard";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function Home() {

    const [Focused, setFocused] = useState(false)

    const onPress = () => setFocused(!Focused)

    return(
        <View className="flex-1 bg-slate-50 pb-3 pt-12">

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                    
                    <AppHeder title="Projects" subtitle="Track your team's work" />

                <View className=" mx-4 ">

                        <View className=" flex-row justify-between items-center my-7 ">
                            
                                <Text className="text-xs font-light  text-slate-600">
                                    Keep every initiative moving forward.
                                </Text>

                                <Ionicons name="add-outline" color="white" size={30} className=" bg-indigo-600 rounded-2xl p-3 "/>
                                
                        </View>

                        <View className=" bg-slate-200 rounded-full px-2 py-2.5   mb-5 flex-row justify-around items-center">

                            <Pressable className={`flex-row gap-2 rounded-[22px] px-5 py-3 items-center ${
                                Focused? "bg-white " : "text-slate-400"
                            } `} onPress={onPress}>


                                <Text className=" font-bold text-xs">Active</Text>
                                <Text className=" bg-indigo-200 text-indigo-600 font-bold px-3 py-1 rounded-[22px] text-xs ">6</Text>

                            </Pressable>


                            <Pressable className={`flex-row gap-2 rounded-[22px] px-5 py-3 items-center ${
                                Focused? "bg-white " : "text-slate-400"
                            } `} onPress={onPress}>



                                <Text className=" font-bold text-xs">
                                    Completed
                                </Text>


                            </Pressable>

                            <Pressable className={`flex-row gap-2 rounded-[22px] px-5 py-3 items-center ${
                                Focused? "bg-white " : "text-slate-400"
                            } `} onPress={onPress}>


                                <Text className=" font-bold text-xs">
                                    Archived
                                </Text>

                                
                            </Pressable>

                        </View>


                        <View>


                          <ProjectCard title="Website Redesign" task="Design & Development" dueTask={4} completedTask={12} TaskDate="Sep 28"  />

                           <ProjectCard title="Website Redesign" task="Design & Development" dueTask={4} completedTask={12} TaskDate="Sep 28"  />

                          <ProjectCard title="Website Redesign" task="Design & Development" dueTask={4} completedTask={12} TaskDate="Sep 28"  />


                        </View>
                </View>

        </ScrollView>

        </View>

    );
}