import { Text, View } from "react-native";

type Props = {
    bg:string,
    name:string,
    text:string,
    overlap?: boolean,
}


export default function Profile_icon ({bg ,name ,text, overlap = true}: Props) {
    return(
        <View className={`h-[38px] w-[38px] items-center justify-center rounded-[10px] border-2 border-slate-200 ${overlap ? "-ml-3" : ""}`} style= {{backgroundColor:bg}}>
                                                    
                                       <Text className="text-[8px] font-bold  " style= {{color: text}}>{name}</Text>
                                                
                                 </View>

    );
};