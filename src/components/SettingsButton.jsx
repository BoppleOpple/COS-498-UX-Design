import gearSVG from "../assets/gear.svg";

export default function SettingsButton({ setShowSettingsModal }) {
  return (
    <button
      className="sidebar-button"
      onClick={() => setShowSettingsModal(true)}
      aria-label="Open settings"
    >
      <img className="sidebar-button-icon" src={gearSVG} title="Settings"></img>
    </button>
  );
}
