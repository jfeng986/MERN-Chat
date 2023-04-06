import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext.jsx";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("register");
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(event) {
    event.preventDefault();
    const url = isLoginOrRegister === "register" ? "/register" : "/login";
    const { data } = await axios.post(url, { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }

  return (
    <div className="bg-green-50 h-screen flex items-center">
      <form className="w-64 mx-auto" onSubmit={handleSubmit}>
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
        <button className="bg-green-500 text-white w-full rounded-sm p-2">
          {isLoginOrRegister === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === "register" && (
            <div>
              Already a member?
              <button
                onClick={() => setIsLoginOrRegister("login")}
                className="ml-3"
              >
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === "login" && (
            <div>
              Don't have an account?
              <button
                onClick={() => setIsLoginOrRegister("register")}
                className="ml-1"
              >
                register here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
