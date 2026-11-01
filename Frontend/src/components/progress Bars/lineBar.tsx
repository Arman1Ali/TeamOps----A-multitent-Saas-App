import { Host, LinearProgressIndicator } from "@expo/ui/jetpack-compose";
import {
    fillMaxWidth,
    height,
} from "@expo/ui/jetpack-compose/modifiers";

type Props = {projectProgress: number;
    hight:number
}

export default function Line_progress_Bar({projectProgress, hight}: Props ) {
    return(

    
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
                                        height(hight),
                                    ]}
                                />
                            </Host>

                );
};