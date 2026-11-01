
import { View, ScrollView } from "react-native";
import AppHeader from "../../components/layout/AppHeader";

export default function TasksScreen() {
  return (
    <View className=" pb-3 pt-12">
      <ScrollView>
        <AppHeader
          title="My Tasks"
          subtitle="Stay on top of your work"
        />
      </ScrollView>
    </View>
  );
}
