import { useState } from "react";
import { streamResponse } from "../../claudeIntegration";

export default function ChatPanel({
  collapsed,
  selectedPersona,
  messages,
  setMessages,
  chatInput,
  setChatInput,
  hasError,
  setHasError,
  attemptPersonaSwitch,
  lionImg,
  pandaImg,
}) {
  const [isChatFocused, setIsChatFocused] = useState(false);

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
        text: "",
      },
    ]);

    streamResponse(selectedPersona, chatInput, (responseText) => {
      setMessages((prevMessages) => {
        let messageIndex = null;

        // find the last message from the tutor
        for (let i = prevMessages.length - 1; i >= 0; i--) {
          if (prevMessages[i].sender === "tutor") {
            messageIndex = i;
            break;
          }
        }

        // if no message was found, escape
        if (messageIndex === null) {
          return prevMessages;
        }

        // update messages with new text
        prevMessages[messageIndex].text = responseText;

        return [...prevMessages];
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
  );
}
