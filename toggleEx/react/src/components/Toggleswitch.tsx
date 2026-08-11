import "@/styles/Toggleswitch.css";
interface ToggleswitchProps {
    visible_6152_0?: boolean;
    IsEnabled?: string;
    IsOn?: string;
    State?: string;
    id?: string;
    className?: string;
    slot_1_198?: React.ReactNode;
    slot_1_201?: React.ReactNode;
    slot_1_209?: React.ReactNode;
    slot_1_222?: React.ReactNode;
}
const Toggleswitch = (props: ToggleswitchProps) => {
    const {
        visible_6152_0 = false,
        IsEnabled,
        IsOn,
        State,
        id,
        className = "",
        slot_1_198,
        slot_1_201,
        slot_1_209,
        slot_1_222
    } = props;

    return (
        <div
            className={["component-1_187", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="1_187" className="Pixso-symbol-1_187">
                {State === "Idle" &&
                    IsOn === "False" &&
                    IsEnabled === "False" && (
                        <div id="1_188" className="Pixso-symbol-1_188">
                            <div id="1_196" className="Pixso-frame-1_196"></div>
                            <div id="1_197" className="Pixso-frame-1_197">
                                <div className="frame-content-1_197">
                                    {slot_1_198 ??
                                        (visible_6152_0 && (
                                            <div
                                                id="1_198"
                                                className="Pixso-vector-1_198"
                                            ></div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                {State === "Pressed" &&
                    IsOn === "False" &&
                    IsEnabled === "False" && (
                        <div id="1_189" className="Pixso-symbol-1_189">
                            <div id="1_199" className="Pixso-frame-1_199"></div>
                            <div id="1_200" className="Pixso-frame-1_200">
                                <div className="frame-content-1_200">
                                    {slot_1_201 ??
                                        (visible_6152_0 && (
                                            <div
                                                id="1_201"
                                                className="Pixso-vector-1_201"
                                            ></div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                {State === "Idle" &&
                    IsOn === "True" &&
                    IsEnabled === "False" && (
                        <div id="1_190" className="Pixso-symbol-1_190">
                            <div id="1_202" className="Pixso-frame-1_202">
                                <div className="frame-content-1_202">
                                    {visible_6152_0 && (
                                        <div
                                            id="1_203"
                                            className="Pixso-rectangle-1_203"
                                        ></div>
                                    )}
                                </div>
                            </div>
                            <div id="1_204" className="Pixso-frame-1_204"></div>
                        </div>
                    )}
                {State === "Pressed" &&
                    IsOn === "True" &&
                    IsEnabled === "False" && (
                        <div id="1_191" className="Pixso-symbol-1_191">
                            <div id="1_205" className="Pixso-frame-1_205">
                                <div className="frame-content-1_205">
                                    {visible_6152_0 && (
                                        <div
                                            id="1_206"
                                            className="Pixso-rectangle-1_206"
                                        ></div>
                                    )}
                                </div>
                            </div>
                            <div id="1_207" className="Pixso-frame-1_207"></div>
                        </div>
                    )}
                {State === "Pressed" &&
                    IsOn === "False" &&
                    IsEnabled === "True" && (
                        <div id="1_192" className="Pixso-symbol-1_192">
                            <div id="1_208" className="Pixso-frame-1_208">
                                <div className="frame-content-1_208">
                                    {slot_1_209 ??
                                        (visible_6152_0 && (
                                            <div
                                                id="1_209"
                                                className="Pixso-vector-1_209"
                                            ></div>
                                        ))}
                                </div>
                            </div>
                            <div id="1_210" className="Pixso-frame-1_210">
                                <div
                                    id="1_211"
                                    className="stroke-wrapper-1_211"
                                >
                                    <div className="Pixso-frame-1_211"></div>
                                    <div className="stroke-1_211"></div>
                                </div>
                                <div
                                    id="1_212"
                                    className="stroke-wrapper-1_212"
                                >
                                    <div className="Pixso-frame-1_212">
                                        <div className="shadow-blend-unknown-2"></div>
                                        <div className="shadow-blend-unknown-1"></div>
                                        <div className="shadow-blend-unknown-0"></div>
                                    </div>
                                    <div className="stroke-1_212"></div>
                                </div>
                                <div id="1_213" className="Pixso-frame-1_213">
                                    <div className="shadow-blend-1_213-1"></div>
                                    <div className="shadow-blend-1_213-0"></div>
                                </div>
                            </div>
                        </div>
                    )}
                {State === "Pressed" &&
                    IsOn === "True" &&
                    IsEnabled === "True" && (
                        <div id="1_193" className="Pixso-symbol-1_193">
                            <div id="1_214" className="Pixso-frame-1_214">
                                <div className="frame-content-1_214">
                                    {visible_6152_0 && (
                                        <div
                                            id="1_215"
                                            className="Pixso-rectangle-1_215"
                                        ></div>
                                    )}
                                </div>
                            </div>
                            <div id="1_216" className="Pixso-frame-1_216">
                                <div
                                    id="1_217"
                                    className="stroke-wrapper-1_217"
                                >
                                    <div className="Pixso-frame-1_217"></div>
                                    <div className="stroke-1_217"></div>
                                </div>
                                <div
                                    id="1_218"
                                    className="stroke-wrapper-1_218"
                                >
                                    <div className="Pixso-frame-1_218">
                                        <div className="shadow-blend-unknown-2"></div>
                                        <div className="shadow-blend-unknown-1"></div>
                                        <div className="shadow-blend-unknown-0"></div>
                                    </div>
                                    <div className="stroke-1_218"></div>
                                </div>
                                <div id="1_219" className="Pixso-frame-1_219">
                                    <div className="shadow-blend-1_219-1"></div>
                                    <div className="shadow-blend-1_219-0"></div>
                                </div>
                            </div>
                        </div>
                    )}
                {State === "Idle" &&
                    IsOn === "False" &&
                    IsEnabled === "True" && (
                        <div id="1_194" className="Pixso-symbol-1_194">
                            <div id="1_220" className="Pixso-frame-1_220"></div>
                            <div id="1_221" className="Pixso-frame-1_221">
                                <div className="frame-content-1_221">
                                    {slot_1_222 ??
                                        (visible_6152_0 && (
                                            <div
                                                id="1_222"
                                                className="Pixso-vector-1_222"
                                            ></div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                {State === "Idle" &&
                    IsOn === "True" &&
                    IsEnabled === "True" && (
                        <div id="1_195" className="Pixso-symbol-1_195">
                            <div id="1_223" className="Pixso-frame-1_223">
                                <div className="frame-content-1_223">
                                    {visible_6152_0 && (
                                        <div
                                            id="1_224"
                                            className="Pixso-rectangle-1_224"
                                        ></div>
                                    )}
                                </div>
                            </div>
                            <div id="1_225" className="Pixso-frame-1_225"></div>
                        </div>
                    )}
            </div>
        </div>
    );
};
export default Toggleswitch;
