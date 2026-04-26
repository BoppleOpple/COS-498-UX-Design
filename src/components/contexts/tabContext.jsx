/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer } from "react";

const DEFAULT_TABS = [
  {
    id: "main.py",
    name: "main.py",
    language: "python",
    content: `print("Hello world")`,
    isBinary: false,
  },
];

// create JSX contexts to provide access to tabs
//
// think of this as a "getter"
const TabsContext = createContext(null);
export const useTabs = () => useContext(TabsContext);

// think of this as a "setter"
const TabDispatchContext = createContext(null);
export const useTabDispacher = () => useContext(TabDispatchContext);

// tabsReducer handles all updates to tabs
// args:
//   tabs: the current value of the tabs state
//   data: an object containing...
//     action: the action to perform (add, addMany, remove, update, set, reset, erase)
//     id?: the id of the tab (when used with remove, add, or update)
//     name?: the name of the added tab (when used with add)
//     language?: the language of the added tab (when used with add)
//     content?: the content of the added tab (when used with add or update)
//     isBinary?: whether the added tab is a binary file (when used with add)
//     tabs?: the new array of tabs (when used with set or addMany)
//     tutor?: the tutor to use after resetting (when used with reset)
function tabsReducer(tabs, data) {
  let index = null;
  switch (data.action) {
    // add a tab to the array
    case "add":
      return [
        ...tabs,
        {
          id: data.id,
          name: data.name,
          language: data.language,
          content: data.content,
          isBinary: data.isBinary
        },
      ];

    case "addMany":
      return [
        ...tabs,
        ...data.tabs
      ];

    // remove tab with id `id` from the array
    case "remove":
      return tabs.filter((message) => message.id !== data.id);

    // alter the content of the tab with id `id`
    case "update":
      index = tabs.findIndex((message) => message.id == data.id)

      tabs[index].content = data.content;
      return [...tabs];

    // set the tab data directly
    case "set":
      return data.tabs;
    
    // return tabs to default values
    case "reset":
      return [...DEFAULT_TABS]
    
    // erase ALL tabs
    case "erase":
      return [];

    default:
      throw Error(`unknown action: ${data.action}`);
  }
}

// a wrapper element for any components that need access to editor tabs
export function TabContextProvider({ children }) {
  const [tabs, tabDispatch] = useReducer(
    tabsReducer,
    DEFAULT_TABS,
  );

  return (
    <TabsContext value={tabs}>
      <TabDispatchContext value={tabDispatch}>
        {children}
      </TabDispatchContext>
    </TabsContext>
  );
}
