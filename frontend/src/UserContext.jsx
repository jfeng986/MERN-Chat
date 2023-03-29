import {createContext, useEffect, useState} from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({children}) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);

  return (
    <UserContext.Provider value={{username, setUsername, id, setId}}>
      {children}
    </UserContext.Provider>
  );
}