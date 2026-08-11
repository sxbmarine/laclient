import Sliders from "@/components/Sliders";
import Knob from "@/components/Knob";
import Track from "@/components/Track";
import Separator from "@/components/Separator";
import "@/styles/Instance3643.css";
const Instance3643 = () => {
    return (
        <div className="scroll-container">
            <Sliders
                id="3_643"
                className="Pixso-instance-3_643"
                text_495_45={`􀓑`}
                Value="0%"
                visible_5430_0={true}
                visible_520_0={true}
                slot_3_138={
                    <div id="2_384" className="Pixso-instance-2_384"></div>
                }
                slot_3_140={
                    <p id="2_392" className="Pixso-paragraph-2_392">
                        {"􀓏"}
                    </p>
                }
                slot_3_139={
                    <Knob id="2_390" className="Pixso-instance-2_390"></Knob>
                }
                slot_3_136={
                    <Track id="2_381" className="Pixso-instance-2_381"></Track>
                }
                slot_3_134={
                    <p id="2_379" className="Pixso-paragraph-2_379">
                        {"􀓑"}
                    </p>
                }
                slot_3_132={
                    <Separator
                        id="2_377"
                        className="Pixso-instance-2_377"
                        Mode="Light"
                    ></Separator>
                }
            ></Sliders>
        </div>
    );
};
export default Instance3643;
