export default function InfoModal({ active, doneOnClick }) {
  return (
    active && (
      <div className="modal-overlay">
        <div className="modal info-modal">
          <h3>Information</h3>
          This application is a research tool designed to study how people
          respond to being taught by different personality types. Refer any
          questions to <b>natalie.olsen@maine.edu</b>.
          <br />
          <br />
          Python code can be written in the central panel of the application. If
          an error occurs, the tutor in the bottom right will glow (not yet
          implemented) and clicking them will open the chat. The tutor will help
          to diagnose the issue without writing the code for you. This panel can
          be closed with the tab to the left of the chat, and re-opened with the
          tab on the right of the editor.
          <br />
          <br />
          The tutor can be changed at any time by opening the chat and selecting
          the desired tutor at the top of the pane.
          <br />
          <b>Warning: Changing the tutor will delete the current conversation!</b>
          <div className="modal-buttons">
            <button onClick={doneOnClick}>Done</button>
          </div>
        </div>
      </div>
    )
  );
}
