import infoSVG from "../assets/info.svg";

export default function InfoButton({ setShowInfoModal }) {
  return (
    <button
      className="sidebar-button"
      onClick={() => setShowInfoModal(true)}
      aria-label="Open help"
    >
      <img className="sidebar-button-icon" src={infoSVG} title="Info"></img>
    </button>
  );
}
