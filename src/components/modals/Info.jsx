export default function InfoModal({ active, doneOnClick }) {
  return (
    active && (
      <div className="modal-overlay">
        <div className="modal info-modal">
          <h3>Information</h3>

          <div className="modal-buttons">
            <button onClick={doneOnClick}>Done</button>
          </div>
        </div>
      </div>
    )
  );
}
