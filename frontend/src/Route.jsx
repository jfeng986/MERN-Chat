import RegisterLogin from "./RegisterLogin";
import { UserContext } from "./UserContext.jsx";
import { useContext } from "react";
import Chat from "./Chat";

export default function Route() {
  const { username, id } = useContext(UserContext);

  if (username && id) {
    return <Chat />;
  }

  return <RegisterLogin />;
}
