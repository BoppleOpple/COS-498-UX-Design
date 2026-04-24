/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer } from "react";

const LION_DEFAULT_TUTOR_MESSAGES = [
  {
    id: 0,
    sender: "assistant",
    text: "Hi! I’m your lion tutor. Ask me about your code whenever you want.",
  },
];

const PANDA_DEFAULT_TUTOR_MESSAGES = [
  {
    id: 0,
    sender: "assistant",
    text: "Hi! I’m your panda tutor. Ask me about your code whenever you want.",
  },
];

// create JSX contexts to provide access to messages
//
// think of this as a "getter"
const ChatContext = createContext(null);
export const useMessages = () => useContext(ChatContext);

// think of this as a "setter"
const ChatDispatchContext = createContext(null);
export const useMessageDispacher = () => useContext(ChatDispatchContext);

// messagesReducer handles all updates to messages
// args:
//   messages: the current value of the messages state
//   data: an object containing...
//     action: the action to perform (add, remove, update, set, reset, erase)
//     text?: the text of the added message (when used with add or update)
//     sender?: the sender of the added message (when used with add)
//     id?: the id of the message (when used with remove or update)
//     messages?: the new array of messages (when used with set)
//     tutor?: the tutor to use after resetting (when used with reset)
function messagesReducer(messages, data) {
  switch (data.action) {
    // add a message to the array
    case "add":
      return [
        ...messages,
        {
          id: messages.length,
          sender: data.sender,
          text: data.text,
        },
      ];

    // remove message with id `id` from the array
    case "remove":
      return messages.filter((message) => message.id !== data.id);

    // alter the text of the message with id `id`
    case "update":
      messages[data.id].text = data.text;
      return [...messages];

    // set the message data directly
    case "set":
      return data.messages;
    
    // return messages to default values
    case "reset":
      switch (data.tutor) {
        case "lion":
          return LION_DEFAULT_TUTOR_MESSAGES;

        case "panda":
          return PANDA_DEFAULT_TUTOR_MESSAGES;

        default:
          throw Error(`unknown action: ${data.action}`);
      }
    
    // erase ALL messages
    case "erase":
      return [];

    default:
      throw Error(`unknown action: ${data.action}`);
  }
}

// a wrapper element for any components that need access to chat messages
export function ChatContextProvider({ children }) {
  const [messages, messageDispatch] = useReducer(
    messagesReducer,
    LION_DEFAULT_TUTOR_MESSAGES,
  );

  return (
    <ChatContext value={messages}>
      <ChatDispatchContext value={messageDispatch}>
        {children}
      </ChatDispatchContext>
    </ChatContext>
  );
}
