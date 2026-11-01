import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import Profile_icon from "./profilr";

type Priority = "High" | "Medium" | "Low";

type RecentTaskCardProps = {
  title: string;
  projectName: string;
  priority: Priority;
  time: string;
  initials: string;
};

const priorityStyles : Record< Priority, string> ={

    High:"bg-red-200 text-red-800",
    Medium:"bg-amber-50 text-amber-700",
    Low: "bg-green-200 text-green-800",
}


export default function RecentTaskCard({
  title,
  projectName,
  priority,
  time,
  initials,
}: RecentTaskCardProps) {

    const [completed, setCompleted] = useState(false)

    const onPress = () => {
        setCompleted(!completed)
    }

    return(
            <View className=" mt-3">

                 

                <View className="mx-3 flex-row items-start gap-5 rounded-[22px] border border-slate-300  bg-white px-5  py-5">

                    <Pressable onPress={onPress} className={`mt-1 h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                        completed? " border-indigo-500 bg-indigo-500" :
                        " border-slate-300 bg-white"
                    } `}>
                        {completed && (
                            <Ionicons

                            name="checkmark-circle-outline"
                            size={20}
                            color="#FFFFFF"
                            
                            />
                        )}
                    </Pressable>

                    <View className="flex-1"> 

                            <View className="gap-1">
 
                               
                               
                                   <Text className={`text-[13px] font-semibold ${
                                       completed? "line-through text-slate-400" : 
                                           " text-slate-900"
                                           } `}>{title}</Text>      

                                    
                         
                                      

                                   <Text className="text-xs font-light  text-slate-600">{projectName}</Text>

                            </View>

                            <View className="flex-row items-center gap-3 pt-3"> 

                                   <Text className={`rounded-[10px] p-2 text-[12px] font-semibold ${priorityStyles[priority]}`}>
                                       {priority}
                                   </Text>

                                   <Ionicons name="time-outline" size={14} color="#808080"  />

                                   <Text  className="text-xs font-light  text-slate-600">{time}</Text>

                            </View>
                    </View>

                    <View className="shrink-0">
                        <Profile_icon
                            bg="#E8EAF6"
                            name={initials || "SC"}
                            text="#2B0071"
                            overlap={false}
                        />
                    </View>

                    
                </View>
            </View>

    );
};