import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

function App() {
  const [hasError, setHasError] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [isTutorCollapsed, setIsTutorCollapsed] = useState(false);

  const [selectedPersona, setSelectedPersona] = useState("lion");
  const [showTutorModal, setShowTutorModal] = useState(true);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [showFileConfirm, setShowFileConfirm] = useState(false);

  const [code, setCode] = useState(`print("Hello world")`);
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
  const [uploadedFile, setUploadedFile] = useState(null);

  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./pythonWorker.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (event) => {
      const { output, ok } = event.data;

      setOutput(output);
      setIsLoading(false);

      if (ok === false || output.toLowerCase().includes("error")) {
        setHasError(true);
      } else {
        setHasError(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  function handleRun() {
    setIsLoading(true);
    setOutput("Loading Python...");
    workerRef.current?.postMessage({ code });
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

  function handleEditorWillMount(monaco) {
    monaco.editor.defineTheme("softGreenTheme", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#bfe7b9",
        "editor.foreground": "#1f2f26",
        "editorGutter.background": "#a7d3a2",
        "editorGutter.border": "#375847",
        "editorLineNumber.foreground": "#2f4d3d",
        "editorLineNumber.activeForeground": "#1f2f26",
        "editorCursor.foreground": "#1f2f26",
        "editor.selectionBackground": "#9ed39a",
        "editor.inactiveSelectionBackground": "#aedcab",
        "editor.lineHighlightBackground": "#b6e0b0",
      },
    });
  }

  return (
    <div className={`app ${isTutorCollapsed ? "tutor-collapsed" : ""}`}>
      {showTutorModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Please select an AI tutor!</h3>
            <div className="modal-buttons">
              <button
                className="lion"
                onClick={() => {
                  setSelectedPersona("lion");
                  setShowTutorModal(false);
                  setShowUploadPrompt(true);
                  setMessages([
                    {
                      id: 1,
                      sender: "tutor",
                      text: "Hi! I’m your lion tutor. Ask me about your code whenever you want.",
                    },
                  ]);
                }}
              >
                Strict, teacher-like
              </button>

              <button
                className="panda"
                onClick={() => {
                  setSelectedPersona("panda");
                  setShowTutorModal(false);
                  setShowUploadPrompt(true);
                  setMessages([
                    {
                      id: 1,
                      sender: "tutor",
                      text: "Hi! I’m your panda tutor. Ask me about your code whenever you want.",
                    },
                  ]);
                }}
              >
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

      <input
        id="fileInput"
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setUploadedFile(file);
          setShowUploadPrompt(false);
          setShowFileConfirm(true);
        }}
      />

      {showFileConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add additional assignment files?</h3>
            <div className="uploaded-files">
              <strong>Uploaded Files:</strong>
              {uploadedFile ? (
                <ul>
                  <li>{uploadedFile.name}</li>
                </ul>
              ) : (
                <p>None</p>
              )}
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowFileConfirm(false)}>Upload</button>
              <button onClick={() => setShowFileConfirm(false)}>Skip</button>
            </div>
          </div>
        </div>
      )}

      <section className="left-panel">
        <div className="top-bar">
          <div className="top-left">
            <button className="icon-button">⚙</button>
            <button className="tab active">main.py</button>
            <button className="tab">+</button>
          </div>

          <div className="top-right">
            <button className="action-button">Upload File</button>
            <button className="action-button run-button" onClick={handleRun}>
              {isLoading ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              beforeMount={handleEditorWillMount}
              theme="softGreenTheme"
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 16,
                fontFamily: "Consolas, 'Courier New', monospace",
                minimap: { enabled: false },
                wordWrap: "on",
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
        </div>
      </section>

      <section className={`right-panel ${isTutorCollapsed ? "collapsed" : ""}`}>
        <button
          className="collapse-toggle"
          onClick={() => setIsTutorCollapsed((prev) => !prev)}
          aria-label={isTutorCollapsed ? "Expand tutor panel" : "Collapse tutor panel"}
        >
          {isTutorCollapsed ? "‹" : "›"}
        </button>

        {!isTutorCollapsed && (
          <div className="right-panel-content">
            <div className="persona-selector">
              <button
                className={`persona-button lion ${
                  selectedPersona === "lion" ? "selected" : ""
                }`}
                onClick={() => setSelectedPersona("lion")}
              >
                Lion
              </button>

              <button
                className={`persona-button panda ${
                  selectedPersona === "panda" ? "selected" : ""
                }`}
                onClick={() => setSelectedPersona("panda")}
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
                      <div className="avatar">
                        {selectedPersona === "lion" ? "🦁" : "🐼"}
                      </div>
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
                  placeholder="Ask the tutor something..."
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
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;