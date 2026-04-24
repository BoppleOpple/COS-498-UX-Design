import lionImg from "../assets/lionDraft 1.png";
import pandaImg from "../assets/redPandaDraft 1.png";

export function EditorTutorIcon({ persona }) {
  if (!["lion", "panda"].includes(persona)) {
    throw Error(`persona "${persona}" does not exist!`);
  }

  const imageSource = persona === "lion" ? lionImg : pandaImg;

  return (
    <div className="tutor-preview-icon">
      <img src={imageSource} alt={`${persona} icon`} />
    </div>
  );
}

export function ChatTutorIcon({ persona }) {
  if (!["lion", "panda"].includes(persona)) {
    throw Error(`persona "${persona}" does not exist!`);
  }

  const imageSource = persona === "lion" ? lionImg : pandaImg;

  return (
    <div className={`chat-avatar-container ${persona}`}>
      <img className="chat-avatar" src={imageSource} alt="assistant" />
    </div>
  );
}
