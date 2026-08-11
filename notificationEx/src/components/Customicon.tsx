import "@/styles/Customicon.css";
interface CustomiconProps {
    Mode?: string;
    id?: string;
    className?: string;
}
const Customicon = (props: CustomiconProps) => {
    const { Mode, id, className = "" } = props;

    return (
        <div
            className={["component-1_114", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="1_114" className="Pixso-symbol-1_114">
                {Mode === "Clear Light" && (
                    <div id="1_115" className="Pixso-symbol-1_115">
                        <div id="1_118" className="Pixso-rectangle-1_118"></div>
                    </div>
                )}
                {Mode === "Dark" && (
                    <div id="1_116" className="Pixso-symbol-1_116">
                        <div id="1_119" className="Pixso-rectangle-1_119"></div>
                    </div>
                )}
                {Mode === "Default" && (
                    <div id="1_117" className="Pixso-symbol-1_117">
                        <div id="1_120" className="Pixso-rectangle-1_120"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Customicon;
