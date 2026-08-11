import "@/styles/Track.css";
interface TrackProps {
    id?: string;
    className?: string;
}
const Track = (props: TrackProps) => {
    const { id, className = "" } = props;

    return (
        <div
            className={["component-3_72", className].filter(Boolean).join(" ")}
            id={id}
        >
            <div id="3_72" className="Pixso-symbol-3_72">
                <div id="3_73" className="Pixso-rectangle-3_73"></div>
            </div>
        </div>
    );
};
export default Track;
