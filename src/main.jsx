import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChatContextProvider } from "./components/contexts/chatContext.jsx";
import { TabContextProvider } from "./components/contexts/tabContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TabContextProvider>
      <ChatContextProvider>
        <App />
      </ChatContextProvider>
    </TabContextProvider>
  </React.StrictMode>,
);
