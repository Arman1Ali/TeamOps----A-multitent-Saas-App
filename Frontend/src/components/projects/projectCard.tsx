import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import Line_progress_Bar from "../progress Bars/lineBar";
import Profile_icon from "../dashboard/profilr";



type Props = {
    title:string,
    task:string,
    completedTask:number,
    dueTask:number
    TaskDate:string,

}


export default function ProjectCard({
    title,
     task,
    completedTask,
    dueTask,
    TaskDate,
    }: Props )  {


    const projectProgress = 77;

    return(
        

        // main
        <View className="mb-4 w-full rounded-[22px] border-2 border-slate-200 bg-white px-5">
                 <View className="my-5 flex-row items-center justify-between rounded-2xl">

                    <Ionicons name="basket-outline" color="#4F46E5" size={25}  className=" self-start rounded-[20px] p-4 bg-indigo-100" />
                    <Pressable className=" relative bottom-4 ">
                        <Text className="text-2xl text-slate-500">...</Text>
                    </Pressable>

                </View>
        {/* FINISH 1 */}

                 

                <View className="self-stretch gap-1">
                    <Text className="text-[15px] font-semibold text-slate-900">
                        {title}
                    </Text>
                    <Text className="text-xs font-normal text-slate-600">
                        {task}
                    </Text>


                </View>
 {/* FINISH 1 */}
            


                <View className="flex-row justify-between my-4 " >

                    <Text className="text-[13px] font-semibold text-slate-600">
                                Progress
                            </Text>
                            <Text className="font-bold text-indigo-500">
                                {projectProgress}%
                            </Text>


                </View>
 {/* FINISH 1 */}


                <View>

                    <Line_progress_Bar projectProgress={projectProgress} hight={6}/>
                </View>
 {/* FINISH 1 */}
                <View className="flex-row items-center justify-between my-6">
                        <View  className="flex-row px-2">
                           <Profile_icon bg="#E8EAF6" name="SC" text="#2B0071" />
                              <Profile_icon bg="#ADD8E6" name="MR" text="#00008B" />
                           <Profile_icon bg="#D7CCC8" name="OP" text="#410200" />
                        </View>

                        <View className="flex-row items-center justify-between gap-3">
                            <View className="flex-row items-center gap-2">

                                <Ionicons name="checkmark-circle-outline"/>
                                <Text className="text-[10px] font-ligh  text-slate-600">{dueTask}/{completedTask} Tasks</Text>

                            </View>

                            <View className="flex-row items-center gap-2">

                                <Ionicons name="calendar-clear-outline" />
                                <Text className="text-[10px] font-ligh  text-slate-600">{TaskDate}</Text>

                            </View>
                        </View>
                </View>

        </View>

    );
};