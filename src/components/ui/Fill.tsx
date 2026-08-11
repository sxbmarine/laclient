import "@/styles/Fill.css";
interface FillProps {
    id?: string;
    className?: string;
}
const Fill = (props: FillProps) => {
    const { id, className = "" } = props;

    return (
        <div
            className={["component-3_75", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="3_75" className="Pixso-symbol-3_75">
                <div id="3_76" className="Pixso-rectangle-3_76"></div>
            </div>
        </div>
    );
};
export default Fill;
