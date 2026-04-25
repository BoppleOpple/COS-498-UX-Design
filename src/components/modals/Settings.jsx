export default function SettingsModal({
  active,
  accessibilityMode,
  setAccessibilityMode,
  textSize,
  setTextSize,
  doneOnClick,
}) {
  return (
    active && (
      <div className="modal-overlay">
        <div className="modal settings-modal">
          <h3>Settings</h3>

          <div className="settings-group">
            <label className="settings-row">
              <span>Accessibility mode</span>
              <input
                type="checkbox"
                checked={accessibilityMode}
                onChange={(e) => setAccessibilityMode(e.target.checked)}
              />
            </label>
            <p className="settings-note">
              Uses a higher-contrast blue / purple / orange palette.
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="textSizeRange">Text size: {textSize}px</label>
            <input
              id="textSizeRange"
              type="range"
              min="14"
              max="22"
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
            />
          </div>

          <div className="modal-buttons">
            <button onClick={doneOnClick}>Done</button>
          </div>
        </div>
      </div>
    )
  );
}
