import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodide = null;
let pyodidePromise = null;

async function getPyodide() {
  if (pyodide) {
    return pyodide;
  }

  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });
  }

  try {
    pyodide = await pyodidePromise;
    return pyodide;
  } catch (error) {
    pyodidePromise = null;
    throw error;
  }
}

self.onmessage = async (event) => {
  const { code } = event.data;

  try {
    const py = await getPyodide();
    const output = [];

    py.setStdout({
      batched: (text) => output.push(text),
    });

    py.setStderr({
      batched: (text) => output.push(text),
    });

    await py.runPythonAsync(code);

    self.postMessage({
      ok: true,
      output: output.join("\n") || "Program finished with no output.",
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      output: String(error),
    });
  }
};