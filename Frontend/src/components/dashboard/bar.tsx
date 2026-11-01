import { Pressable, Text, View } from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";
import TaskCard from "./TaskCard";
import { router } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";



export type Bar_Props = {
    ctp:number;
    dueTask:number;
    need_action: number;
    completedTask:number;
    active_projects:number;

}






export default function Bar({
    completedTask,
    dueTask,
    need_action,
    ctp,
    active_projects
    
}: Bar_Props) {

    const onPress =  () => {
        router.push("/(tabs)/tasks")
    }
    return(

           
    <View className="mx-3">
        {/* //   main card */}
                <View className=" bg-indigo-600 px-5 py-5 overflow-hidden rounded-[22px] mt-7 "> 

            {/* Text & Bar Area */}
                        <View className=" flex-row items-center ">


           {/* Text Area */}
                            <View className=" flex-1 pr-10">
                                <Text className=" text-indigo-200 uppercase text-[13px] mt-2 font-bold py-2 ">TODAY&apos;S FOCUS</Text>

                                <Text className=" text-white font-bold mt-2 text-[18px] ">Make today count.</Text>

                                <Text className=" text-indigo-100 font-bold mt-2 text-[11px]">You have {dueTask} tasks due today. {need_action} need your attention.</Text>

                                 <Pressable className="rounded-full mt-4  py-1 flex-row items-center   " onPress={onPress} >
                        
                             <Text className=" text-[13px] font-bold text-white   ">View my tasks </Text>
                             <Ionicons name="arrow-forward-outline" color="white" size={13} className=" relative top-0.5 " />

                                </Pressable>


                            </View>

            {/* Bar Area */}
                            <View className=" h-[78px] w-[78px] items-center justify-center relative right-2  ">
                                    <CircularProgress 
                                    value={ctp}
                                     radius={40}
                                     duration={600}
                                     activeStrokeColor="#FFFFFF"
                                     inActiveStrokeColor="#818CF8"
                                     activeStrokeWidth={10}
                                     inActiveStrokeWidth={10}
                                     showProgressValue={false}
                                    
                                    />
                                    <View className=" items-center absolute">

                                    <Text className=" text-white font-bold text-xl text-[20px] relative left-1 ">{ctp}%</Text>
                                    <Text className=" text-white font-bold text-[8px]">Done</Text>

                                    </View>


                            </View>

 {/* Text & Bar Area End */}
                        </View>
         

   {/* Main card end */}
                </View>
 

  
    <View className=" gap-2.5 flex-row mt-4  ">
           <TaskCard
               completedTask={completedTask}
               taskLabel="Tasks Done"
               trendText="+18% this week"
               iconName="checkmark-circle-outline"
               iconColor="#6366F1"
               backroundColor="#EEF2FF"
           />

           <TaskCard
               completedTask={dueTask}
               taskLabel="Due today"
               trendText="2 high priority"
               iconName="time-outline"
               iconColor="#F59E0B"
               backroundColor="#FFF4E5"
           />

             <TaskCard
               completedTask={active_projects}
               taskLabel="Active projects"
               trendText="2 near completion"
               iconName="folder-outline"
               iconColor="#10B981"
               backroundColor="#E5F7F0"
           /> 


              
            </View>
{/* FULL CARD ENDS */}
    </View>
        
    )
}