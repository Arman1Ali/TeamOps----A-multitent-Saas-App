import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Navigation() {

//  Variables

    const icon_size = 20;

    const insets = useSafeAreaInsets();

    return(
            <Tabs 
              screenOptions={{
                
                headerShown:false,
                sceneStyle: { backgroundColor: "#CBD5E1" },
              
                tabBarActiveTintColor:"#4F46E5",
                tabBarInactiveTintColor:"#94A3B8",
                tabBarStyle:{
                
                    position:"absolute",
                    height:45+ insets.bottom,
                    paddingTop: 6,
                    paddingBottom: Math.max(insets.bottom,6),
                    backgroundColor: "#FFFFFF",
                    borderColor:"#90A1B9",
                    borderWidth:1,
                    elevation: 0,
                    borderRadius: 50,
                    marginHorizontal: 12,
                    marginVertical:15,
                    
                    
                    
                },
                tabBarLabelStyle:{
                    fontSize:11,
                    fontWeight:"600"
                }

              }}
            >
                  <Tabs.Screen name="index" options={{
                    title: "Home",
                    tabBarIcon:({ color,focused}) => (
                        <View className=" items-center justify-center">

                           { focused? <View className=" bg-indigo-600 h-[3px] w-5 absolute -top-4 rounded-full"></View>: null}

                            <Ionicons name={ focused? "home-outline" : "home-outline"}
                            
                            color={color}
                            size={icon_size}
                            
                            />

                        </View>

                    ),                 
                  }}/>

                  <Tabs.Screen name="projects" options={{
                    title:"Projects",
                     tabBarIcon:({ color, focused}) => (
                         <View className=" items-center justify-center">

                           { focused? <View className=" bg-indigo-600 h-[3px] w-5 absolute -top-4 rounded-full"></View>: null}


                            <Ionicons name="folder-outline"
                            
                            color={color}
                            size={icon_size}
                            
                            />
                        </View>
                        )
                    
                  }}/>

                  <Tabs.Screen name="tasks" options={{
                    title:"Tasks",
                    tabBarIcon:({ color, focused}) => (
                         <View className=" items-center justify-center">

                           { focused? <View className=" bg-indigo-600 h-[3px] w-5 absolute -top-4 rounded-full"></View>: null}


                            <Ionicons name={ focused? "checkmark-circle-outline" : "checkmark-circle-outline"}
                            
                            color={color}
                            size={icon_size}
                            
                            />
                        </View>

                        )
                  }}/>

                  <Tabs.Screen name="team" options={{
                    title:"Team",
                    tabBarIcon:({ color, focused}) => (
                         <View className=" items-center justify-center">

                           { focused? <View className=" bg-indigo-600 h-[3px] w-5 absolute -top-4 rounded-full"></View>: null}


                            <Ionicons name={ focused? "people-outline" : "people-outline"}
                            
                            color={color}
                            size={icon_size}
                            
                            />
                        </View>
    )}}/>

            </Tabs>
         

    );
};