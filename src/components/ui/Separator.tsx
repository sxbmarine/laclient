import "@/styles/Separator.css";
interface SeparatorProps {
    Mode?: string;
    id?: string;
    className?: string;
}
const Separator = (props: SeparatorProps) => {
    const { Mode, id, className = "" } = props;

    return (
        <div
            className={["component-3_67", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="3_67" className="Pixso-symbol-3_67">
                {Mode === "Dark" && (
                    <div id="3_68" className="stroke-wrapper-3_68">
                        <div className="Pixso-symbol-3_68"></div>
                        <div className="stroke-3_68"></div>
                    </div>
                )}
                {Mode === "Light" && (
                    <div id="3_69" className="stroke-wrapper-3_69">
                        <div className="Pixso-symbol-3_69"></div>
                        <div className="stroke-3_69"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Separator;
