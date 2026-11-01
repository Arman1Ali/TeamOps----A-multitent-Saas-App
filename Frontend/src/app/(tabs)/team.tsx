
import { View, ScrollView } from "react-native";
import AppHeader from "../../components/layout/AppHeader";

export default function TeamScreen() {
  return (
    <View className=" pb-3 pt-12">
      <ScrollView>
        <AppHeader
          title="Our Team"
          subtitle="People and collaboration"
        />
      </ScrollView>
    </View>
  );
}
