import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import lionImg from "./assets/lionDraft 1.png";
import pandaImg from "./assets/redPandaDraft 1.png";

const DEFAULT_CODE = `print("Hello world")`;

const DEFAULT_TUTOR_MESSAGES = {
  lion: "Hi! I’m your lion tutor. Ask me about your code whenever you want.",
  panda: "Hi! I’m your panda tutor. Ask me about your code whenever you want.",
};

const MIN_RIGHT_PANEL_WIDTH = 320;
const MAX_RIGHT_PANEL_WIDTH = 900;
const DEFAULT_RIGHT_PANEL_WIDTH = 640;

export default function App() {
  const [hasError, setHasError] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isTutorCollapsed, setIsTutorCollapsed] = useState(false);

  const [selectedPersona, setSelectedPersona] = useState("lion");
  const [pendingPersona, setPendingPersona] = useState(null);

  const [showTutorModal, setShowTutorModal] = useState(true);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [showFileConfirm, setShowFileConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);

  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [textSize, setTextSize] = useState(16);

  const [tabs, setTabs] = useState([
    {
      id: "main.py",
      name: "main.py",
      language: "python",
      content: DEFAULT_CODE,
      isBinary: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("main.py");

  const [output, setOutput] = useState("Program output will appear here.");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "tutor",
      text: "Select a tutor to begin.",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH);

  const workerRef = useRef(null);
  const appRef = useRef(null);
  const isResizingRef = useRef(false);
  const lastExpandedWidthRef = useRef(DEFAULT_RIGHT_PANEL_WIDTH);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./pythonWorker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (event) => {
      const { output: workerOutput, ok } = event.data;
      setOutput(workerOutput);
      setIsLoading(false);
      setHasError(ok === false || workerOutput.toLowerCase().includes("error"));
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isResizingRef.current || !appRef.current || isTutorCollapsed) return;

      const appRect = appRef.current.getBoundingClientRect();
      const nextWidth = appRect.right - event.clientX;
      const clampedWidth = Math.max(
        MIN_RIGHT_PANEL_WIDTH,
        Math.min(MAX_RIGHT_PANEL_WIDTH, nextWidth)
      );

      setRightPanelWidth(clampedWidth);
      lastExpandedWidthRef.current = clampedWidth;
    }

    function handleMouseUp() {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isTutorCollapsed]);

  function handleEditorWillMount(monaco) {
    monaco.editor.defineTheme("softGreenTheme", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#b8dbb2",
        "editor.foreground": "#13251c",
        "editorGutter.background": "#9fcb99",
        "editorGutter.border": "#355646",
        "editorLineNumber.foreground": "#244336",
        "editorLineNumber.activeForeground": "#12251d",
        "editorCursor.foreground": "#12251d",
        "editor.selectionBackground": "#8dc289",
        "editor.inactiveSelectionBackground": "#a1cf9d",
        "editor.lineHighlightBackground": "#b2d7ac",
      },
    });

    monaco.editor.defineTheme("accessibilityTheme", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#fff7cc",
        "editor.foreground": "#1a1540",
        "editorGutter.background": "#f4e58a",
        "editorGutter.border": "#5a35c8",
        "editorLineNumber.foreground": "#5a35c8",
        "editorLineNumber.activeForeground": "#22155f",
        "editorCursor.foreground": "#d9480f",
        "editor.selectionBackground": "#b8a4ff",
        "editor.inactiveSelectionBackground": "#d7cbff",
        "editor.lineHighlightBackground": "#fff0a8",
      },
    });
  }

  function handleChooseTutor(persona) {
    setSelectedPersona(persona);
    setShowTutorModal(false);
    setShowUploadPrompt(true);
    setMessages([
      {
        id: 1,
        sender: "tutor",
        text: DEFAULT_TUTOR_MESSAGES[persona],
      },
    ]);
  }

  function attemptPersonaSwitch(newPersona) {
    if (newPersona === selectedPersona) return;

    if (messages.length <= 1) {
      setSelectedPersona(newPersona);
      setMessages([
        {
          id: 1,
          sender: "tutor",
          text: DEFAULT_TUTOR_MESSAGES[newPersona],
        },
      ]);
      return;
    }

    setPendingPersona(newPersona);
    setShowResetWarning(true);
  }

  function handleRun() {
    if (!activeTab || activeTab.isBinary) {
      setOutput("This file cannot be run in the Python editor.");
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setOutput("Loading Python...");
    workerRef.current?.postMessage({ code: activeTab.content });
  }

  function handleSendMessage() {
    if (!chatInput.trim()) return;

    setHasError(false);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: chatInput,
      },
      {
        id: Date.now() + 1,
        sender: "tutor",
        text:
          selectedPersona === "lion"
            ? "Direct answer: check your logic."
            : "Hey! Maybe try checking your loop.",
      },
    ]);

    setChatInput("");
  }

  function updateTabContent(tabId, value) {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, content: value || "" } : tab
      )
    );
  }

  function addNewPythonTab() {
    const newId = `main-${Date.now()}.py`;
    const newTabNumber = tabs.filter((tab) => tab.name.startsWith("main")).length;

    const newTab = {
      id: newId,
      name: `main-${newTabNumber}.py`,
      language: "python",
      content: "",
      isBinary: false,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }

  function closeTab(tabId) {
    if (tabs.length === 1) return;

    const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
    const nextTabs = tabs.filter((tab) => tab.id !== tabId);

    setTabs(nextTabs);

    if (activeTabId === tabId) {
      const nextActive =
        nextTabs[currentIndex - 1] || nextTabs[currentIndex] || nextTabs[0];
      setActiveTabId(nextActive.id);
    }
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newTabs = [];
    const newFiles = [];

    for (const file of files) {
      const fileId = `${file.name}-${file.lastModified}`;

      newFiles.push({
        id: fileId,
        name: file.name,
      });

      const isTextFile =
        file.type.startsWith("text/") ||
        file.name.endsWith(".py") ||
        file.name.endsWith(".js") ||
        file.name.endsWith(".jsx") ||
        file.name.endsWith(".ts") ||
        file.name.endsWith(".tsx") ||
        file.name.endsWith(".css") ||
        file.name.endsWith(".html") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md");

      if (isTextFile) {
        const content = await file.text();

        newTabs.push({
          id: fileId,
          name: file.name,
          language: file.name.endsWith(".py")
            ? "python"
            : file.name.endsWith(".css")
            ? "css"
            : file.name.endsWith(".html")
            ? "html"
            : file.name.endsWith(".json")
            ? "json"
            : file.name.endsWith(".ts") || file.name.endsWith(".tsx")
            ? "typescript"
            : file.name.endsWith(".js") || file.name.endsWith(".jsx")
            ? "javascript"
            : "plaintext",
          content,
          isBinary: false,
        });
      } else {
        newTabs.push({
          id: fileId,
          name: file.name,
          language: "plaintext",
          content: "This file type cannot be previewed in the editor.",
          isBinary: true,
        });
      }
    }

    setUploadedFiles((prev) => {
      const existingIds = new Set(prev.map((file) => file.id));
      return [...prev, ...newFiles.filter((file) => !existingIds.has(file.id))];
    });

    setTabs((prev) => {
      const existingIds = new Set(prev.map((tab) => tab.id));
      const dedupedTabs = newTabs.filter((tab) => !existingIds.has(tab.id));
      return [...prev, ...dedupedTabs];
    });

    if (newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text:
          files.length === 1
            ? `Uploaded file: ${files[0].name}`
            : `Uploaded files: ${files.map((file) => file.name).join(", ")}`,
      },
      {
        id: Date.now() + 1,
        sender: "tutor",
        text:
          files.length === 1
            ? `Got it — I can use ${files[0].name} for context.`
            : "Got it — I can use those files for context.",
      },
    ]);

    setShowUploadPrompt(false);
    setShowFileConfirm(true);
    e.target.value = "";
  }

  function startResize() {
    if (isTutorCollapsed) return;
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function toggleTutorPanel() {
    if (isTutorCollapsed) {
      setRightPanelWidth(lastExpandedWidthRef.current || DEFAULT_RIGHT_PANEL_WIDTH);
      setIsTutorCollapsed(false);
      return;
    }

    lastExpandedWidthRef.current = rightPanelWidth;
    setIsTutorCollapsed(true);
  }

  return (
    <div
      ref={appRef}
      className={`app ${isTutorCollapsed ? "tutor-collapsed" : ""} ${
        accessibilityMode ? "accessibility-mode" : ""
      }`}
      style={{
        "--ui-font-size": `${textSize}px`,
        "--right-panel-width": isTutorCollapsed ? "0px" : `${rightPanelWidth}px`,
      }}
    >
      {showTutorModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Please select an AI tutor!</h3>
            <div className="modal-buttons">
              <button className="lion" onClick={() => handleChooseTutor("lion")}>
                Strict, teacher-like
              </button>
              <button className="panda" onClick={() => handleChooseTutor("panda")}>
                Friendly, peer like
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadPrompt && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Would you like to add a copy of your assignment for context?</h3>
            <div className="modal-buttons">
              <button onClick={() => document.getElementById("fileInput").click()}>
                Upload
              </button>
              <button onClick={() => setShowUploadPrompt(false)}>Skip</button>
            </div>
          </div>
        </div>
      )}

      {showFileConfirm && (
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
              <button onClick={() => document.getElementById("fileInput").click()}>
                Upload More
              </button>
              <button onClick={() => setShowFileConfirm(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
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
              <button onClick={() => setShowSettingsModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showResetWarning && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Warning</h3>
            <p>Switching tutors will clear your current conversation. Continue?</p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  if (pendingPersona) {
                    setSelectedPersona(pendingPersona);
                    setMessages([
                      {
                        id: 1,
                        sender: "tutor",
                        text: DEFAULT_TUTOR_MESSAGES[pendingPersona],
                      },
                    ]);
                  }

                  setPendingPersona(null);
                  setShowResetWarning(false);
                  setChatInput("");
                }}
              >
                Continue
              </button>

              <button
                onClick={() => {
                  setPendingPersona(null);
                  setShowResetWarning(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        id="fileInput"
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFilesSelected}
      />

      <section className="left-panel">
        <div className="top-bar">
          <div className="top-left">
            <button
              className="icon-button"
              onClick={() => setShowSettingsModal(true)}
              aria-label="Open settings"
            >
              ⚙
            </button>

            <div className="tab-list">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab ${tab.id === activeTabId ? "active" : ""}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span>{tab.name}</span>
                  {tabs.length > 1 && (
                    <button
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      aria-label={`Close ${tab.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button className="tab add-tab" onClick={addNewPythonTab}>
                +
              </button>
            </div>
          </div>

          <div className="top-right">
            <button
              className="action-button"
              onClick={() => document.getElementById("fileInput").click()}
            >
              Upload File...
            </button>
            <button className="action-button run-button" onClick={handleRun}>
              {isLoading ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-wrapper">
            <Editor
              key={activeTab?.id}
              height="100%"
              language={activeTab?.language || "python"}
              value={activeTab?.content || ""}
              beforeMount={handleEditorWillMount}
              theme={accessibilityMode ? "accessibilityTheme" : "softGreenTheme"}
              onChange={(value) => updateTabContent(activeTabId, value)}
              options={{
                readOnly: activeTab?.isBinary || false,
                fontSize: textSize,
                fontFamily: "Consolas, 'Courier New', monospace",
                minimap: { enabled: false },
                wordWrap: "off",
                scrollBeyondLastLine: false,
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 8,
                lineNumbersMinChars: 2,
                overviewRulerLanes: 0,
                renderLineHighlight: "none",
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                padding: {
                  top: 10,
                  bottom: 10,
                },
              }}
            />
          </div>
        </div>

        <div className="bottom-section">
          <div className="output-box">
            <div className="panel-title">Output</div>
            <pre>{output}</pre>
          </div>

          <div className={`tutor-preview ${selectedPersona}`}>
            <div className="tutor-preview-emoji">
              <img
                src={selectedPersona === "lion" ? lionImg : pandaImg}
                alt="tutor"
                />
            </div>
            <div className="tutor-preview-title">
              {selectedPersona === "lion" ? "Lion Tutor" : "Panda Tutor"}
            </div>
            <div className="tutor-preview-subtitle">
              {uploadedFiles.length ? uploadedFiles[0].name : "No file uploaded"}
            </div>
          </div>
        </div>
      </section>

      <div className={`resize-handle ${isTutorCollapsed ? "collapsed" : ""}`}>
        <div className="resize-hitbox" onMouseDown={startResize} />

        <button
          type="button"
          className="collapse-toggle"
          onClick={toggleTutorPanel}
          aria-label={isTutorCollapsed ? "Expand tutor panel" : "Collapse tutor panel"}
        >
          {isTutorCollapsed ? "‹" : "›"}
        </button>
      </div>

      <section className={`right-panel ${isTutorCollapsed ? "collapsed" : ""}`}>
        {!isTutorCollapsed && (
          <div className="right-panel-content">
            <div className="persona-selector">
              <button
                className={`persona-button lion ${
                  selectedPersona === "lion" ? "selected" : ""
                }`}
                onClick={() => attemptPersonaSwitch("lion")}
              >
                Lion
              </button>

              <button
                className={`persona-button panda ${
                  selectedPersona === "panda" ? "selected" : ""
                }`}
                onClick={() => attemptPersonaSwitch("panda")}
              >
                Panda
              </button>
            </div>

            <div className="chat-section">
              <div className="chat-messages">
  {messages.map((message) => (
    <div
      key={message.id}
      className={`chat-row ${
        message.sender === "user" ? "user-row" : "tutor-row"
      }`}
    >
      {message.sender === "tutor" && (
        <img
          className="chat-avatar"
          src={selectedPersona === "lion" ? lionImg : pandaImg}
          alt="tutor"
        />
      )}

      <div
        className={`chat-message ${
          message.sender === "user"
            ? "user-message"
            : "tutor-message"
        }`}
      >
        {message.text}
      </div>
    </div>
  ))}
</div>

              <div
                className={`chat-input-row ${
                  hasError ? "error" : isChatFocused ? "focused" : ""
                }`}
              >
                <input
                  type="text"
                  placeholder="Type something..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onFocus={() => setIsChatFocused(true)}
                  onBlur={() => setIsChatFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className={chatInput.trim() ? "send-active" : "send-disabled"}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}