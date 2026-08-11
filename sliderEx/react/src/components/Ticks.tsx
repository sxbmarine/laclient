import "@/styles/Ticks.css";
interface TicksProps {
    id?: string;
    className?: string;
    slot_3_79?: React.ReactNode;
    slot_3_80?: React.ReactNode;
    slot_3_81?: React.ReactNode;
    slot_3_82?: React.ReactNode;
    slot_3_83?: React.ReactNode;
}
const Ticks = (props: TicksProps) => {
    const {
        id,
        className = "",
        slot_3_79,
        slot_3_80,
        slot_3_81,
        slot_3_82,
        slot_3_83
    } = props;

    return (
        <div
            className={["component-3_78", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="3_78" className="Pixso-symbol-3_78">
                {slot_3_79 ?? (
                    <div id="3_79" className="Pixso-vector-3_79"></div>
                )}
                {slot_3_80 ?? (
                    <div id="3_80" className="Pixso-vector-3_80"></div>
                )}
                {slot_3_81 ?? (
                    <div id="3_81" className="Pixso-vector-3_81"></div>
                )}
                {slot_3_82 ?? (
                    <div id="3_82" className="Pixso-vector-3_82"></div>
                )}
                {slot_3_83 ?? (
                    <div id="3_83" className="Pixso-vector-3_83"></div>
                )}
            </div>
        </div>
    );
};
export default Ticks;
