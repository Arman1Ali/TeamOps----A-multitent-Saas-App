import Bar from "@/components/dashboard/bar";
import InfoBar from "@/components/dashboard/infoBar";
import RecentTaskCard from "@/components/dashboard/RecentTaskCard";
import Title_Bar from "@/components/dashboard/Title";
import AppHeder from "@/components/layout/AppHeader";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
    const getFormattedGreeting = (): string => {
        
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning, Alex";
    if (hour < 17) return "Good afternoon, Alex";
    return "Good evening, Alex";
    
    };

    const getFormattedDate = (): string => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
    return(
        
       
 <SafeAreaView className="flex-1 bg-slate-300" edges={["top", "left", "right"]}>
        <ScrollView>
                    
                    <AppHeder title={getFormattedGreeting()} subtitle={getFormattedDate()} />

          {/* Dashboard content will go here */}

                    <Bar completedTask={12} dueTask={4} need_action={12} ctp={68} active_projects={6}/>

                 <InfoBar completedProjectPercent={78} />


                 <View>

                    <View className="mb-5">

                     <Title_Bar title="Recent tasks" />

                    </View>

                    <RecentTaskCard title="Finalize onboarding flow" projectName="Mobile App Launch" priority="High" time="Today, 4:00 PM" initials="" />
                    <RecentTaskCard title="Review analytics dashboard" projectName="Website Redesign" priority="Medium" time="Today, 6:30 PM" initials="" />
                    <RecentTaskCard title="Prepare user interview notes" projectName="Customer Portal" priority="Low" time="Today, 4:00 PM" initials="" />
                  
                </View>

        </ScrollView>

  </SafeAreaView>
    );
}