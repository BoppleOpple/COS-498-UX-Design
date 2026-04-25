export default function FileConfirmationModal({
  active,
  uploadedFiles,
  uploadOnClick,
  doneOnClick,
}) {
  return (
    active && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Add additional assignment files?</h3>
          <div className="uploaded-files">
            <strong>Uploaded Files:</strong>
            {uploadedFiles.length ? (
              <ul>
                {uploadedFiles.map((file) => (
                  <li key={file.id}>{file.name}</li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
          </div>
          <div className="modal-buttons">
            <button onClick={uploadOnClick}>Upload More</button>
            <button onClick={doneOnClick}>Done</button>
          </div>
        </div>
      </div>
    )
  );
}
