import { useState, Fragment, useEffect } from "react";
import { streamResponse } from "../../claudeIntegration";
import { useMessageDispacher, useMessages } from "../contexts/chatContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatTutorIcon } from "../Icon";
import { useTabs } from "../contexts/tabContext";

function Message({ message, selectedPersona }) {
  return (
    <div
      className={`chat-row ${
        message.sender === "user" ? "user-row" : "tutor-row"
      }`}
    >
      {message.sender === "assistant" && (
        <ChatTutorIcon persona={selectedPersona}/>
      )}

      <div
        className={`chat-message ${
          message.sender === "user" ? "user-message" : `tutor-message ${selectedPersona}`
        }`}
      >
        <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
      </div>
    </div>
  );
}

export default function ChatPanel({
  collapsed,
  selectedPersona,
  chatInput,
  setChatInput,
  hasError,
  setHasError,
  attemptPersonaSwitch
}) {
  const [isChatFocused, setIsChatFocused] = useState(false);
  const messages = useMessages();
  const messageDispacher = useMessageDispacher();

  const tabs = useTabs();

  useEffect(()=>{
    if (messages[messages.length - 1].sender === "user") {
      const responseIndex = messages.length

      streamResponse(selectedPersona, messages, tabs, (responseText) => {
        messageDispacher({
          action: "update",
          id: responseIndex,
          text: responseText,
        });
      });

      messageDispacher({
        action: "add",
        sender: "assistant",
        text: "*thinking...*",
      });
    }
  },[messages, tabs, messageDispacher, selectedPersona] );

  function handleSendMessage() {
    if (!chatInput.trim()) return;

    setHasError(false);

    messageDispacher({
      action: "add",
      sender: "user",
      text: chatInput,
    });
    

    setChatInput("");
  }

  return (
    <section className={`right-panel ${collapsed ? "collapsed" : ""}`}>
      {!collapsed && (
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
                <Message
                  message={message}
                  selectedPersona={selectedPersona}
                  key={message.id}
                />
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
  );
}
