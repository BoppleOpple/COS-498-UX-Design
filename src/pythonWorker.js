import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodide = null;

async function getPyodide() {
  if (!pyodide) {
    pyodide = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });
  }
  return pyodide;
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