export default function AssignmentUploadModal({
  active,
  uploadOnClick,
  cancelOnClick,
}) {
  return (
    active && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Would you like to add a copy of your assignment for context?</h3>
          <div className="modal-buttons">
            <button onClick={uploadOnClick}>Upload</button>
            <button onClick={cancelOnClick}>Skip</button>
          </div>
        </div>
      </div>
    )
  );
}
