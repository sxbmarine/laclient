import "@/styles/Knob.css";
interface KnobProps {
    id?: string;
    className?: string;
}
const Knob = (props: KnobProps) => {
    const { id, className = "" } = props;

    return (
        <div
            className={["component-3_84", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="3_84" className="Pixso-symbol-3_84">
                <div id="3_85" className="Pixso-rectangle-3_85"></div>
            </div>
        </div>
    );
};
export default Knob;
