import NotificationCollapsed from "@/components/Notificationcollapsed";
import Time from "@/components/Time";
import CustomIcon from "@/components/Customicon";
import LiquidGlassClear from "@/components/Liquidglassclear";
import "@/styles/Instance1166.css";
const Instance1166 = () => {
    return (
        <div className="scroll-container">
            <NotificationCollapsed
                id="1_166"
                className="Pixso-instance-1_166"
                Stack="1"
                slot_1_164={
                    <Time
                        id="2_255"
                        className="Pixso-instance-2_255"
                        Mode="Dark"
                        slot_1_127={
                            <p id="2_256" className="Pixso-paragraph-2_256">
                                {"9:41 AM"}
                            </p>
                        }
                    ></Time>
                }
                slot_1_162={
                    <p id="2_253" className="Pixso-paragraph-2_253">
                        {"Message"}
                    </p>
                }
                slot_1_161={
                    <p id="2_252" className="Pixso-paragraph-2_252">
                        {"Title"}
                    </p>
                }
                slot_1_158={
                    <CustomIcon
                        id="2_248"
                        className="Pixso-instance-2_248"
                        Mode="Default"
                    ></CustomIcon>
                }
                slot_1_157={
                    <LiquidGlassClear
                        id="2_245"
                        className="Pixso-instance-2_245"
                    ></LiquidGlassClear>
                }
            ></NotificationCollapsed>
        </div>
    );
};
export default Instance1166;
