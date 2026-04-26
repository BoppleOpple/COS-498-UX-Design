import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

import pythonWorker from "../../pythonWorker.js?worker";
import { EditorTutorIcon } from "../Icon";
import { useTabDispacher, useTabs } from "../contexts/tabContext";

export default function EditorPanel({
  accessibilityMode,
  textSize,
  uploadedFiles,
  activeTabId,
  setActiveTabId,
  setHasError,
  selectedPersona,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("Program output will appear here.");
  const tabs = useTabs();
  const tabDispacher = useTabDispacher();

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) || tabs[0],
    [tabs, activeTabId],
  );

  const workerRef = useRef(null);
  useEffect(() => {
    workerRef.current = new pythonWorker({ type: "module" });

    workerRef.current.onmessage = (event) => {
      const { output: workerOutput, ok } = event.data;
      setOutput(workerOutput);
      setIsLoading(false);
      setHasError(ok === false || workerOutput.toLowerCase().includes("error"));
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setHasError]);

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

  function updateTabContent(tabId, value) {
    tabDispacher({
      action: "update",
      id: tabId,
      content: value
    })
  }

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

  function addNewPythonTab() {
    const newId = `main-${Date.now()}.py`;
    const newTabNumber = tabs.filter((tab) =>
      tab.name.startsWith("main"),
    ).length;

    tabDispacher({
      action: "add",
      id: newId,
      name: `main-${newTabNumber}.py`,
      language: "python",
      content: "",
      isBinary: false,
    });

    setActiveTabId(newId);
  }

  function closeTab(tabId) {
    if (tabs.length === 1) return;

    const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
    const nextTabs = tabs.filter((tab) => tab.id !== tabId);

    if (activeTabId === tabId) {
      const nextActive =
        nextTabs[currentIndex - 1] || nextTabs[currentIndex] || nextTabs[0];
      setActiveTabId(nextActive.id);
    }

    tabDispacher({
      action: "remove",
      id: tabId
    });

  }

  return (
    <section className="left-panel">
      <div className="top-bar">
        <div className="top-left">
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
          <EditorTutorIcon persona={selectedPersona} />
          <div className="tutor-preview-title">
            {selectedPersona === "lion" ? "Lion Tutor" : "Panda Tutor"}
          </div>
          <div className="tutor-preview-subtitle">
            {uploadedFiles.length ? uploadedFiles[0].name : "No file uploaded"}
          </div>
        </div>
      </div>
    </section>
  );
}
