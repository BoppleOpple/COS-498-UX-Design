import { useEffect, useRef, useState } from "react";
import lionImg from "./assets/lionDraft 1.png";
import pandaImg from "./assets/redPandaDraft 1.png";
import TutorSelectionModal from "./components/modals/TutorSelection";
import AssignmentUploadModal from "./components/modals/Upload";
import FileConfirmationModal from "./components/modals/FileConfirm";
import SettingsModal from "./components/modals/Settings";
import ChangeTutorModal from "./components/modals/ChangeTutor";
import EditorPanel from "./components/panels/Editor";
import ChatPanel from "./components/panels/Chat";
import {
  ChatContextProvider,
  useMessageDispacher,
  useMessages,
} from "./components/contexts/chatContext";

const DEFAULT_CODE = `print("Hello world")`;

const MIN_RIGHT_PANEL_WIDTH = 320;
const MAX_RIGHT_PANEL_WIDTH = 900;
const DEFAULT_RIGHT_PANEL_WIDTH = 640;

export default function App() {
  const [hasError, setHasError] = useState(false);
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

  const [chatInput, setChatInput] = useState("");
  const messages = useMessages();
  const messageDispacher = useMessageDispacher();
  // const [messages, setMessages] = useState([
  //   {
  //     id: 1,
  //     sender: "tutor",
  //     text: "Select a tutor to begin.",
  //   },
  // ]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rightPanelWidth, setRightPanelWidth] = useState(
    DEFAULT_RIGHT_PANEL_WIDTH,
  );

  const appRef = useRef(null);
  const isResizingRef = useRef(false);
  const lastExpandedWidthRef = useRef(DEFAULT_RIGHT_PANEL_WIDTH);

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isResizingRef.current || !appRef.current || isTutorCollapsed) return;

      const appRect = appRef.current.getBoundingClientRect();
      const nextWidth = appRect.right - event.clientX;
      const clampedWidth = Math.max(
        MIN_RIGHT_PANEL_WIDTH,
        Math.min(MAX_RIGHT_PANEL_WIDTH, nextWidth),
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

  function handleChooseTutor(persona) {
    setSelectedPersona(persona);
    setShowTutorModal(false);
    setShowUploadPrompt(true);
    messageDispacher({
      action: "reset",
      tutor: persona,
    });
  }

  function attemptPersonaSwitch(newPersona) {
    if (newPersona === selectedPersona) return;

    if (messages.length <= 1) {
      setSelectedPersona(newPersona);
      messageDispacher({
        action: "reset",
        tutor: newPersona,
      });
      return;
    }

    setPendingPersona(newPersona);
    setShowResetWarning(true);
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

    messageDispacher({
      action: "add",
      sender: "user",
      text:
        files.length === 1
          ? `Uploaded file: ${files[0].name}`
          : `Uploaded files: ${files.map((file) => file.name).join(", ")}`,
    });

    messageDispacher({
      action: "add",
      sender: "assistant",
      text:
        files.length === 1
          ? `Got it — I can use ${files[0].name} for context.`
          : "Got it — I can use those files for context.",
    });

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
      setRightPanelWidth(
        lastExpandedWidthRef.current || DEFAULT_RIGHT_PANEL_WIDTH,
      );
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
        "--right-panel-width": isTutorCollapsed
          ? "0px"
          : `${rightPanelWidth}px`,
      }}
    >
      {showTutorModal && (
        <TutorSelectionModal
          lionOnClick={() => handleChooseTutor("lion")}
          pandaOnClick={() => handleChooseTutor("panda")}
        />
      )}

      {showUploadPrompt && (
        <AssignmentUploadModal
          uploadOnClick={() => document.getElementById("fileInput").click()}
          cancelOnClick={() => setShowUploadPrompt(false)}
        />
      )}

      {showFileConfirm && (
        <FileConfirmationModal
          uploadedFiles={uploadedFiles}
          uploadOnClick={() => document.getElementById("fileInput").click()}
          doneOnClick={() => setShowFileConfirm(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          accessibilityMode={accessibilityMode}
          setAccessibilityMode={setAccessibilityMode}
          textSize={textSize}
          setTextSize={setTextSize}
          doneOnClick={() => setShowSettingsModal(false)}
        />
      )}

      {showResetWarning && (
        <ChangeTutorModal
          continueOnClick={() => {
            if (pendingPersona) {
              setSelectedPersona(pendingPersona);
              messageDispacher({
                action: "reset",
                tutor: pendingPersona,
              });
            }

            setPendingPersona(null);
            setShowResetWarning(false);
            setChatInput("");
          }}
          cancelOnClick={() => {
            setPendingPersona(null);
            setShowResetWarning(false);
          }}
        />
      )}

      <input
        id="fileInput"
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFilesSelected}
      />

      <EditorPanel
        accessibilityMode={accessibilityMode}
        textSize={textSize}
        uploadedFiles={uploadedFiles}
        tabs={tabs}
        setTabs={setTabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        setShowSettingsModal={setShowSettingsModal}
        setHasError={setHasError}
        selectedPersona={selectedPersona}
        lionImg={lionImg}
        pandaImg={pandaImg}
      />

      <div className={`resize-handle ${isTutorCollapsed ? "collapsed" : ""}`}>
        <div className="resize-hitbox" onMouseDown={startResize} />

        <button
          type="button"
          className="collapse-toggle"
          onClick={toggleTutorPanel}
          aria-label={
            isTutorCollapsed ? "Expand tutor panel" : "Collapse tutor panel"
          }
        >
          {isTutorCollapsed ? "‹" : "›"}
        </button>
      </div>

      <ChatContextProvider>
        <ChatPanel
          collapsed={isTutorCollapsed}
          selectedPersona={selectedPersona}
          chatInput={chatInput}
          setChatInput={setChatInput}
          hasError={hasError}
          setHasError={setHasError}
          attemptPersonaSwitch={attemptPersonaSwitch}
          lionImg={lionImg}
          pandaImg={pandaImg}
        />
      </ChatContextProvider>
    </div>
  );
}
