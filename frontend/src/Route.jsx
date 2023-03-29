import Register from "./Register";
import {UserContext} from "./UserContext.jsx";
import { useContext } from "react";

export default function Route() {
    const {username, id} = useContext(UserContext);

    if(username && id){
        return "You are logged in";
    }

  return (
    <Register/>
  );
}