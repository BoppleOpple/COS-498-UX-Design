export default function TutorSelectionModal({
  active,
  lionOnClick,
  pandaOnClick,
}) {
  return (
    active && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Please select an AI tutor!</h3>
          <p><b>Note:</b> You can change your decision at any time using the buttons above the chat, but your conversation will reset.</p>
          <div className="modal-buttons">
            <button className="lion" onClick={lionOnClick}>
              Strict, teacher-like
            </button>
            <button className="panda" onClick={pandaOnClick}>
              Friendly, peer like
            </button>
          </div>
        </div>
      </div>
    )
  );
}
