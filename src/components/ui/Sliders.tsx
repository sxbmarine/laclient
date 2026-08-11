import Separator from "@/components/ui/Separator";
import Track from "@/components/ui/Track";
import Fill from "@/components/ui/Fill";
import Ticks from "@/components/ui/Ticks";
import Knob from "@/components/ui/Knob";
import "@/styles/Sliders.css";
interface SlidersProps {
    text_495_0?: string;
    text_495_45?: string;
    visible_520_0?: boolean;
    visible_5430_0?: boolean;
    Value?: string;
    id?: string;
    className?: string;
    slot_3_92?: React.ReactNode;
    slot_3_94?: React.ReactNode;
    slot_3_96?: React.ReactNode;
    slot_3_97?: React.ReactNode;
    slot_3_99?: React.ReactNode;
    slot_3_100?: React.ReactNode;
    slot_3_101?: React.ReactNode;
    slot_3_102?: React.ReactNode;
    slot_3_104?: React.ReactNode;
    slot_3_106?: React.ReactNode;
    slot_3_107?: React.ReactNode;
    slot_3_109?: React.ReactNode;
    slot_3_110?: React.ReactNode;
    slot_3_111?: React.ReactNode;
    slot_3_112?: React.ReactNode;
    slot_3_114?: React.ReactNode;
    slot_3_116?: React.ReactNode;
    slot_3_117?: React.ReactNode;
    slot_3_119?: React.ReactNode;
    slot_3_120?: React.ReactNode;
    slot_3_121?: React.ReactNode;
    slot_3_122?: React.ReactNode;
    slot_3_124?: React.ReactNode;
    slot_3_126?: React.ReactNode;
    slot_3_127?: React.ReactNode;
    slot_3_129?: React.ReactNode;
    slot_3_130?: React.ReactNode;
    slot_3_131?: React.ReactNode;
    slot_3_132?: React.ReactNode;
    slot_3_134?: React.ReactNode;
    slot_3_136?: React.ReactNode;
    slot_3_138?: React.ReactNode;
    slot_3_139?: React.ReactNode;
    slot_3_140?: React.ReactNode;
}
const Sliders = (props: SlidersProps) => {
    const {
        text_495_0 = "􀓏",
        text_495_45 = "􀓑",
        visible_520_0 = true,
        visible_5430_0 = true,
        Value,
        id,
        className = "",
        slot_3_92,
        slot_3_94,
        slot_3_96,
        slot_3_97,
        slot_3_99,
        slot_3_100,
        slot_3_101,
        slot_3_102,
        slot_3_104,
        slot_3_106,
        slot_3_107,
        slot_3_109,
        slot_3_110,
        slot_3_111,
        slot_3_112,
        slot_3_114,
        slot_3_116,
        slot_3_117,
        slot_3_119,
        slot_3_120,
        slot_3_121,
        slot_3_122,
        slot_3_124,
        slot_3_126,
        slot_3_127,
        slot_3_129,
        slot_3_130,
        slot_3_131,
        slot_3_132,
        slot_3_134,
        slot_3_136,
        slot_3_138,
        slot_3_139,
        slot_3_140
    } = props;

    return (
        <div
            className={["component-3_86", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="3_86" className="Pixso-symbol-3_86">
                {Value === "100%" && (
                    <div id="3_87" className="Pixso-symbol-3_87">
                        {slot_3_92 ?? (
                            <Separator
                                id="3_92"
                                className="Pixso-instance-3_92"
                                Mode="Light"
                            ></Separator>
                        )}
                        <div id="3_93" className="Pixso-frame-3_93">
                            <div className="frame-content-3_93">
                                {slot_3_94 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_94"
                                            className="Pixso-paragraph-3_94"
                                        >
                                            {text_495_45 ?? "􀓑"}
                                        </p>
                                    ))}
                                <div id="3_95" className="Pixso-frame-3_95">
                                    {slot_3_96 ?? (
                                        <Track
                                            id="3_96"
                                            className="Pixso-instance-3_96"
                                        ></Track>
                                    )}
                                    {slot_3_97 ?? (
                                        <Fill
                                            id="3_97"
                                            className="Pixso-instance-3_97"
                                        ></Fill>
                                    )}
                                    <div id="3_98" className="Pixso-frame-3_98">
                                        {slot_3_99 ??
                                            (visible_5430_0 && (
                                                <Ticks
                                                    id="3_99"
                                                    className="Pixso-instance-3_99"
                                                ></Ticks>
                                            ))}
                                        {slot_3_100 ?? (
                                            <Knob
                                                id="3_100"
                                                className="Pixso-instance-3_100"
                                            ></Knob>
                                        )}
                                    </div>
                                </div>
                                {slot_3_101 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_101"
                                            className="Pixso-paragraph-3_101"
                                        >
                                            {text_495_0 ?? "􀓏"}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
                {Value === "75%" && (
                    <div id="3_88" className="Pixso-symbol-3_88">
                        {slot_3_102 ?? (
                            <Separator
                                id="3_102"
                                className="Pixso-instance-3_102"
                                Mode="Light"
                            ></Separator>
                        )}
                        <div id="3_103" className="Pixso-frame-3_103">
                            <div className="frame-content-3_103">
                                {slot_3_104 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_104"
                                            className="Pixso-paragraph-3_104"
                                        >
                                            {text_495_45 ?? "􀓑"}
                                        </p>
                                    ))}
                                <div id="3_105" className="Pixso-frame-3_105">
                                    {slot_3_106 ?? (
                                        <Track
                                            id="3_106"
                                            className="Pixso-instance-3_106"
                                        ></Track>
                                    )}
                                    {slot_3_107 ?? (
                                        <Fill
                                            id="3_107"
                                            className="Pixso-instance-3_107"
                                        ></Fill>
                                    )}
                                    <div
                                        id="3_108"
                                        className="Pixso-frame-3_108"
                                    >
                                        {slot_3_109 ??
                                            (visible_5430_0 && (
                                                <Ticks
                                                    id="3_109"
                                                    className="Pixso-instance-3_109"
                                                ></Ticks>
                                            ))}
                                        {slot_3_110 ?? (
                                            <Knob
                                                id="3_110"
                                                className="Pixso-instance-3_110"
                                            ></Knob>
                                        )}
                                    </div>
                                </div>
                                {slot_3_111 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_111"
                                            className="Pixso-paragraph-3_111"
                                        >
                                            {text_495_0 ?? "􀓏"}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
                {Value === "50%" && (
                    <div id="3_89" className="Pixso-symbol-3_89">
                        {slot_3_112 ?? (
                            <Separator
                                id="3_112"
                                className="Pixso-instance-3_112"
                                Mode="Light"
                            ></Separator>
                        )}
                        <div id="3_113" className="Pixso-frame-3_113">
                            <div className="frame-content-3_113">
                                {slot_3_114 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_114"
                                            className="Pixso-paragraph-3_114"
                                        >
                                            {text_495_45 ?? "􀓑"}
                                        </p>
                                    ))}
                                <div id="3_115" className="Pixso-frame-3_115">
                                    {slot_3_116 ?? (
                                        <Track
                                            id="3_116"
                                            className="Pixso-instance-3_116"
                                        ></Track>
                                    )}
                                    {slot_3_117 ?? (
                                        <Fill
                                            id="3_117"
                                            className="Pixso-instance-3_117"
                                        ></Fill>
                                    )}
                                    <div
                                        id="3_118"
                                        className="Pixso-frame-3_118"
                                    >
                                        {slot_3_119 ??
                                            (visible_5430_0 && (
                                                <Ticks
                                                    id="3_119"
                                                    className="Pixso-instance-3_119"
                                                ></Ticks>
                                            ))}
                                        {slot_3_120 ?? (
                                            <Knob
                                                id="3_120"
                                                className="Pixso-instance-3_120"
                                            ></Knob>
                                        )}
                                    </div>
                                </div>
                                {slot_3_121 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_121"
                                            className="Pixso-paragraph-3_121"
                                        >
                                            {text_495_0 ?? "􀓏"}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
                {Value === "25%" && (
                    <div id="3_90" className="Pixso-symbol-3_90">
                        {slot_3_122 ?? (
                            <Separator
                                id="3_122"
                                className="Pixso-instance-3_122"
                                Mode="Light"
                            ></Separator>
                        )}
                        <div id="3_123" className="Pixso-frame-3_123">
                            <div className="frame-content-3_123">
                                {slot_3_124 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_124"
                                            className="Pixso-paragraph-3_124"
                                        >
                                            {text_495_45 ?? "􀓑"}
                                        </p>
                                    ))}
                                <div id="3_125" className="Pixso-frame-3_125">
                                    {slot_3_126 ?? (
                                        <Track
                                            id="3_126"
                                            className="Pixso-instance-3_126"
                                        ></Track>
                                    )}
                                    {slot_3_127 ?? (
                                        <Fill
                                            id="3_127"
                                            className="Pixso-instance-3_127"
                                        ></Fill>
                                    )}
                                    <div
                                        id="3_128"
                                        className="Pixso-frame-3_128"
                                    >
                                        {slot_3_129 ??
                                            (visible_5430_0 && (
                                                <Ticks
                                                    id="3_129"
                                                    className="Pixso-instance-3_129"
                                                ></Ticks>
                                            ))}
                                        {slot_3_130 ?? (
                                            <Knob
                                                id="3_130"
                                                className="Pixso-instance-3_130"
                                            ></Knob>
                                        )}
                                    </div>
                                </div>
                                {slot_3_131 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_131"
                                            className="Pixso-paragraph-3_131"
                                        >
                                            {text_495_0 ?? "􀓏"}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
                {Value === "0%" && (
                    <div id="3_91" className="Pixso-symbol-3_91">
                        {slot_3_132 ?? (
                            <Separator
                                id="3_132"
                                className="Pixso-instance-3_132"
                                Mode="Light"
                            ></Separator>
                        )}
                        <div id="3_133" className="Pixso-frame-3_133">
                            <div className="frame-content-3_133">
                                {slot_3_134 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_134"
                                            className="Pixso-paragraph-3_134"
                                        >
                                            {text_495_45 ?? "􀓑"}
                                        </p>
                                    ))}
                                <div id="3_135" className="Pixso-frame-3_135">
                                    {slot_3_136 ?? (
                                        <Track
                                            id="3_136"
                                            className="Pixso-instance-3_136"
                                        ></Track>
                                    )}
                                    <div
                                        id="3_137"
                                        className="Pixso-frame-3_137"
                                    >
                                        {slot_3_138 ??
                                            (visible_5430_0 && (
                                                <Ticks
                                                    id="3_138"
                                                    className="Pixso-instance-3_138"
                                                ></Ticks>
                                            ))}
                                        {slot_3_139 ?? (
                                            <Knob
                                                id="3_139"
                                                className="Pixso-instance-3_139"
                                            ></Knob>
                                        )}
                                    </div>
                                </div>
                                {slot_3_140 ??
                                    (visible_520_0 && (
                                        <p
                                            id="3_140"
                                            className="Pixso-paragraph-3_140"
                                        >
                                            {text_495_0 ?? "􀓏"}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Sliders;
