import LiquidGlassClear from "@/components/Liquidglassclear";
import CustomIcon from "@/components/Customicon";
import Time from "@/components/Time";
import "@/styles/Notificationcollapsed.css";
interface NotificationcollapsedProps {
    text_135_0?: string;
    text_135_4?: string;
    visible_8483_0?: boolean;
    Stack?: string;
    id?: string;
    className?: string;
    slot_1_134?: React.ReactNode;
    slot_1_136?: React.ReactNode;
    slot_1_137?: React.ReactNode;
    slot_1_138?: React.ReactNode;
    slot_1_141?: React.ReactNode;
    slot_1_142?: React.ReactNode;
    slot_1_144?: React.ReactNode;
    slot_1_147?: React.ReactNode;
    slot_1_148?: React.ReactNode;
    slot_1_149?: React.ReactNode;
    slot_1_152?: React.ReactNode;
    slot_1_153?: React.ReactNode;
    slot_1_155?: React.ReactNode;
    slot_1_157?: React.ReactNode;
    slot_1_158?: React.ReactNode;
    slot_1_161?: React.ReactNode;
    slot_1_162?: React.ReactNode;
    slot_1_164?: React.ReactNode;
}
const Notificationcollapsed = (props: NotificationcollapsedProps) => {
    const {
        text_135_0 = "Title",
        text_135_4 = "Message",
        visible_8483_0 = false,
        Stack,
        id,
        className = "",
        slot_1_134,
        slot_1_136,
        slot_1_137,
        slot_1_138,
        slot_1_141,
        slot_1_142,
        slot_1_144,
        slot_1_147,
        slot_1_148,
        slot_1_149,
        slot_1_152,
        slot_1_153,
        slot_1_155,
        slot_1_157,
        slot_1_158,
        slot_1_161,
        slot_1_162,
        slot_1_164
    } = props;

    return (
        <div
            className={["component-1_129", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="1_129" className="Pixso-symbol-1_129">
                {Stack === "3" && (
                    <div id="1_130" className="Pixso-symbol-1_130">
                        <div id="1_133" className="Pixso-frame-1_133">
                            <div className="frame-content-1_133">
                                {slot_1_134 ?? (
                                    <LiquidGlassClear
                                        id="1_134"
                                        className="Pixso-instance-1_134"
                                    ></LiquidGlassClear>
                                )}
                            </div>
                        </div>
                        <div id="1_135" className="Pixso-frame-1_135">
                            <div className="frame-content-1_135">
                                {slot_1_136 ?? (
                                    <LiquidGlassClear
                                        id="1_136"
                                        className="Pixso-instance-1_136"
                                    ></LiquidGlassClear>
                                )}
                            </div>
                        </div>
                        {slot_1_137 ?? (
                            <LiquidGlassClear
                                id="1_137"
                                className="Pixso-instance-1_137"
                            ></LiquidGlassClear>
                        )}
                        {slot_1_138 ?? (
                            <CustomIcon
                                id="1_138"
                                className="Pixso-instance-1_138"
                                Mode="Default"
                            ></CustomIcon>
                        )}
                        <div id="1_139" className="Pixso-frame-1_139">
                            <div className="frame-content-1_139">
                                <div id="1_140" className="Pixso-frame-1_140">
                                    <div className="frame-content-1_140">
                                        {slot_1_141 ?? (
                                            <p
                                                id="1_141"
                                                className="Pixso-paragraph-1_141"
                                            >
                                                {text_135_0 ?? "Title"}
                                            </p>
                                        )}
                                        {slot_1_142 ?? (
                                            <p
                                                id="1_142"
                                                className="Pixso-paragraph-1_142"
                                            >
                                                {text_135_4 ?? "Message"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div id="1_143" className="Pixso-frame-1_143">
                                    {slot_1_144 ?? (
                                        <Time
                                            id="1_144"
                                            className="Pixso-instance-1_144"
                                            Mode="Dark"
                                        ></Time>
                                    )}
                                    {visible_8483_0 && (
                                        <div
                                            id="1_145"
                                            className="Pixso-rectangle-1_145"
                                        ></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {Stack === "2" && (
                    <div id="1_131" className="Pixso-symbol-1_131">
                        <div id="1_146" className="Pixso-frame-1_146">
                            <div className="frame-content-1_146">
                                {slot_1_147 ?? (
                                    <LiquidGlassClear
                                        id="1_147"
                                        className="Pixso-instance-1_147"
                                    ></LiquidGlassClear>
                                )}
                            </div>
                        </div>
                        {slot_1_148 ?? (
                            <LiquidGlassClear
                                id="1_148"
                                className="Pixso-instance-1_148"
                            ></LiquidGlassClear>
                        )}
                        {slot_1_149 ?? (
                            <CustomIcon
                                id="1_149"
                                className="Pixso-instance-1_149"
                                Mode="Default"
                            ></CustomIcon>
                        )}
                        <div id="1_150" className="Pixso-frame-1_150">
                            <div className="frame-content-1_150">
                                <div id="1_151" className="Pixso-frame-1_151">
                                    <div className="frame-content-1_151">
                                        {slot_1_152 ?? (
                                            <p
                                                id="1_152"
                                                className="Pixso-paragraph-1_152"
                                            >
                                                {text_135_0 ?? "Title"}
                                            </p>
                                        )}
                                        {slot_1_153 ?? (
                                            <p
                                                id="1_153"
                                                className="Pixso-paragraph-1_153"
                                            >
                                                {text_135_4 ?? "Message"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div id="1_154" className="Pixso-frame-1_154">
                                    {slot_1_155 ?? (
                                        <Time
                                            id="1_155"
                                            className="Pixso-instance-1_155"
                                            Mode="Dark"
                                        ></Time>
                                    )}
                                    {visible_8483_0 && (
                                        <div
                                            id="1_156"
                                            className="Pixso-rectangle-1_156"
                                        ></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {Stack === "1" && (
                    <div id="1_132" className="Pixso-symbol-1_132">
                        {slot_1_157 ?? (
                            <LiquidGlassClear
                                id="1_157"
                                className="Pixso-instance-1_157"
                            ></LiquidGlassClear>
                        )}
                        {slot_1_158 ?? (
                            <CustomIcon
                                id="1_158"
                                className="Pixso-instance-1_158"
                                Mode="Default"
                            ></CustomIcon>
                        )}
                        <div id="1_159" className="Pixso-frame-1_159">
                            <div className="frame-content-1_159">
                                <div id="1_160" className="Pixso-frame-1_160">
                                    <div className="frame-content-1_160">
                                        {slot_1_161 ?? (
                                            <p
                                                id="1_161"
                                                className="Pixso-paragraph-1_161"
                                            >
                                                {text_135_0 ?? "Title"}
                                            </p>
                                        )}
                                        {slot_1_162 ?? (
                                            <p
                                                id="1_162"
                                                className="Pixso-paragraph-1_162"
                                            >
                                                {text_135_4 ?? "Message"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div id="1_163" className="Pixso-frame-1_163">
                                    {slot_1_164 ?? (
                                        <Time
                                            id="1_164"
                                            className="Pixso-instance-1_164"
                                            Mode="Dark"
                                        ></Time>
                                    )}
                                    {visible_8483_0 && (
                                        <div
                                            id="1_165"
                                            className="Pixso-rectangle-1_165"
                                        ></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Notificationcollapsed;
