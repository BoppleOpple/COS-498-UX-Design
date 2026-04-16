import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const FONT_SIZES = [14, 16, 18, 20];
const EDITOR_LINE_COUNT = 20;
const PYODIDE_VERSION = '0.26.4';

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<any>;
  }
}

type EditorFile = {
  id: string;
  name: string;
  content: string;
};

const INITIAL_FILES: EditorFile[] = [
  {
    id: 'file-1',
    name: 'file_name.py',
    content: 'print("Hello from Python")\nfor i in range(3):\n    print(i)',
  },
  {
    id: 'file-2',
    name: 'file_name_2.py',
    content: '',
  },
];

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appliedFontSize, setAppliedFontSize] = useState(16);
  const [draftFontSize, setDraftFontSize] = useState(16);
  const [files, setFiles] = useState<EditorFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState(INITIAL_FILES[0].id);
  const [outputValue, setOutputValue] = useState('Click Run to execute your Python code.');
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);
  const nextFileNumberRef = useRef(3);

  const activeFile = files.find((file) => file.id === activeFileId) ?? null;
  const activeEditorValue = activeFile?.content ?? '';

  const visibleLineCount = Math.max(
    EDITOR_LINE_COUNT,
    activeEditorValue.split('\n').length
  );

  useEffect(() => {
    if (!isSettingsOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  useEffect(() => {
    let isMounted = true;

    const setupPyodide = async () => {
      try {
        const existingScript = document.querySelector<HTMLScriptElement>(
          'script[data-pyodide="runtime"]'
        );

        if (!existingScript) {
          const script = document.createElement('script');
          script.src = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;
          script.async = true;
          script.dataset.pyodide = 'runtime';
          document.body.appendChild(script);
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Python runtime.'));
          });
        }

        if (!window.loadPyodide) {
          throw new Error('Python runtime loader is unavailable.');
        }

        const runtime = await window.loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
        });

        if (!isMounted) {
          return;
        }

        setPyodide(runtime);
        setIsRuntimeLoading(false);
        setOutputValue('Python runtime ready. Click Run to execute your code.');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setIsRuntimeLoading(false);
        setOutputValue(
          `Runtime error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };

    setupPyodide();

    return () => {
      isMounted = false;
    };
  }, []);

  const openSettings = () => {
    setDraftFontSize(appliedFontSize);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    setAppliedFontSize(draftFontSize);
    setIsSettingsOpen(false);
  };

  const handleEditorScroll = (
    event: React.UIEvent<HTMLTextAreaElement, UIEvent>
  ) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  const handleRun = async () => {
    if (!pyodide || isRuntimeLoading) {
      setOutputValue('Python runtime is still loading. Please wait a moment and try again.');
      return;
    }

    if (!activeFile) {
      setOutputValue('No file selected. Create or select a file to run Python code.');
      return;
    }

    setIsRunning(true);

    const stdout: string[] = [];
    const stderr: string[] = [];

    try {
      pyodide.setStdout({ batched: (message: string) => stdout.push(message) });
      pyodide.setStderr({ batched: (message: string) => stderr.push(message) });

      const result = await pyodide.runPythonAsync(activeFile.content);
      const pieces: string[] = [];

      if (stdout.length > 0) {
        pieces.push(stdout.join('\n'));
      }

      if (result !== undefined && result !== null) {
        pieces.push(String(result));
      }

      if (stderr.length > 0) {
        pieces.push(`stderr:\n${stderr.join('\n')}`);
      }

      setOutputValue(pieces.length > 0 ? pieces.join('\n') : '(no output)');
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      const stderrText = stderr.length > 0 ? `\n${stderr.join('\n')}` : '';
      setOutputValue(`Error:\n${errorText}${stderrText}`);
    } finally {
      setIsRunning(false);
    }
  };

  const updateActiveFileContent = (content: string) => {
    setFiles((previousFiles) =>
      previousFiles.map((file) =>
        file.id === activeFileId ? { ...file, content } : file
      )
    );
  };

  const addFile = () => {
    const nextFile: EditorFile = {
      id: `file-${Date.now()}`,
      name: `file_name_${nextFileNumberRef.current}.py`,
      content: '',
    };
    nextFileNumberRef.current += 1;
    setFiles((previousFiles) => [...previousFiles, nextFile]);
    setActiveFileId(nextFile.id);
  };

  const removeFile = (fileId: string) => {
    setFiles((previousFiles) => {
      const closingIndex = previousFiles.findIndex((file) => file.id === fileId);
      const remainingFiles = previousFiles.filter((file) => file.id !== fileId);

      setActiveFileId((currentActiveId) => {
        if (currentActiveId !== fileId) {
          return currentActiveId;
        }

        if (remainingFiles.length === 0) {
          return '';
        }

        const fallbackIndex = Math.max(0, closingIndex - 1);
        return remainingFiles[fallbackIndex]?.id ?? remainingFiles[0].id;
      });

      return remainingFiles;
    });
  };

  return (
    <div className="page" style={{ fontSize: `${appliedFontSize}px` }}>
      <aside className="rail" aria-label="Sidebar">
        <button
          className="iconButton"
          type="button"
          aria-label="Settings"
          onClick={openSettings}
        >
          ⚙
        </button>
      </aside>

      <main className="workspace">
        <header className="topBar">
          <div className="tabs" role="tablist" aria-label="Open files">
            {files.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <div className="tabItem" key={file.id}>
                  <button
                    className={`tab ${isActive ? 'active' : ''}`}
                    role="tab"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <span className="tabName">{file.name}</span>
                  </button>
                  <button
                    className="closeButton"
                    type="button"
                    aria-label={`Close ${file.name}`}
                    onClick={() => removeFile(file.id)}
                  >
                    x
                  </button>
                </div>
              );
            })}

            <button className="tab add" type="button" aria-label="Add file" onClick={addFile}>
              +
            </button>
          </div>

          <div className="actions">
            <button className="actionButton" type="button">
              Upload File...
            </button>
            <button
              className="actionButton run"
              type="button"
              onClick={handleRun}
              disabled={isRuntimeLoading || isRunning}
            >
              <span className="dot" />
              {isRuntimeLoading ? 'Loading...' : isRunning ? 'Running...' : 'Run'}
            </button>
          </div>
        </header>

        <section className="editor" aria-label="Editor surface">
          <div className="editorCanvas" aria-label="Editable coding space">
            <div className="lineNumbers" aria-hidden="true" ref={lineNumbersRef}>
              {Array.from({ length: visibleLineCount }, (_, index) => (
                <span key={`line-${index + 1}`}>{index + 1}</span>
              ))}
            </div>

            <div className="codeArea">
              <textarea
                className="editorInput"
                value={activeEditorValue}
                onChange={(event) => updateActiveFileContent(event.target.value)}
                onScroll={handleEditorScroll}
                aria-label="Code editor"
                spellCheck={false}
                placeholder={
                  activeFile
                    ? 'Start typing your code here...'
                    : 'No file is open. Click + to create a file.'
                }
                disabled={!activeFile}
              />
            </div>
          </div>
        </section>

        <section className="output" aria-label="Program output">
          <p className="outputTitle">output</p>
          <pre className="outputText">{outputValue}</pre>
        </section>
      </main>

      {isSettingsOpen && (
        <div
          className="modalScrim"
          onClick={() => setIsSettingsOpen(false)}
        >
          <section
            className="settingsDialog"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Settings</h2>

            <div className="settingRow">
              <p className="settingLabel">Font size:</p>

              <div className="sizePicker" role="radiogroup" aria-label="Font size">
                <div className="sizeLine" />

                {FONT_SIZES.map((size) => {
                  const isSelected = size === draftFontSize;
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`sizeDot${isSelected ? ' selected' : ''}`}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${size} pixels`}
                      onClick={() => setDraftFontSize(size)}
                    />
                  );
                })}
              </div>

              <div className="sizeLegend" aria-hidden="true">
                {FONT_SIZES.map((size) => (
                  <span
                    key={`legend-${size}`}
                    className={size === draftFontSize ? 'selectedLabel' : ''}
                  >
                    A
                  </span>
                ))}
              </div>
            </div>

            <button className="saveButton" type="button" onClick={saveSettings}>
              SAVE
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
