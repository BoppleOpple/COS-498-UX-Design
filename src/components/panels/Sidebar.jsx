import InfoButton from "../InfoButton";
import SettingsButton from "../SettingsButton";

export default function SidebarPanel({ setShowSettingsModal, setShowInfoModal }) {
  return <section className="sidebar">
    <SettingsButton setShowSettingsModal={setShowSettingsModal} />
    <InfoButton setShowInfoModal={setShowInfoModal} />
  </section>
}