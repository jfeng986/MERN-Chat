import React, { useContext, useState } from "react";
import {UserContext} from "./UserContext.jsx";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

  async function register(event){
    event.preventDefault();
    const {data} = await axios.post("/register", {username, password});
    setLoggedInUsername(username);
    setId(data.id);
  }
  

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto" onSubmit={register}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2"
        />
        <button className="bg-blue-500 text-white w-full rounded-sm p-2">
          Register
        </button>
      </form>
    </div>
  );
}
