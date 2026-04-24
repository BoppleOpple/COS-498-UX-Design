import { useState, Fragment } from "react";
import { streamResponse } from "../../claudeIntegration";
import { useMessageDispacher, useMessages } from "../contexts/chatContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Message({ message, image }) {
  return (
    <div
      className={`chat-row ${
        message.sender === "user" ? "user-row" : "tutor-row"
      }`}
    >
      {message.sender === "assistant" && (
        <img className="chat-avatar" src={image} alt="assistant" />
      )}

      <div
        className={`chat-message ${
          message.sender === "user" ? "user-message" : "tutor-message"
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
  attemptPersonaSwitch,
  lionImg,
  pandaImg,
}) {
  const [isChatFocused, setIsChatFocused] = useState(false);
  const messages = useMessages();
  const messageDispacher = useMessageDispacher();

  function handleSendMessage() {
    if (!chatInput.trim()) return;

    setHasError(false);

    const responseIndex = messages.length + 1;

    messageDispacher({
      action: "add",
      sender: "user",
      text: chatInput,
    });
    messageDispacher({
      action: "add",
      sender: "assistant",
      text: "",
    });

    streamResponse(selectedPersona, chatInput, (responseText) => {
      messageDispacher({
        action: "update",
        id: responseIndex,
        text: responseText,
      });
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
                  image={selectedPersona === "lion" ? lionImg : pandaImg}
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
