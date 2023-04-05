import { useEffect, useState, useContext, useId, useRef } from "react";
import Avatar from "./Avatar.jsx";
import uniqBy from "lodash/uniqBy";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlineUser, setOnlineUser] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, id } = useContext(UserContext);
  const [messageText, setMessageText] = useState("");
  const [messageList, setMessageList] = useState([]);
  const messageRef = useRef();

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:3000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(connectToWs(), 1000);
    });
  }

  function showOnlineUser(onlineUser) {
    const onlineUserSet = {};
    onlineUser.forEach(({ userId, username }) => {
      onlineUserSet[userId] = username;
    });
    setOnlineUser(onlineUserSet);
  }

  function handleMessage(event) {
    const messageData = JSON.parse(event.data);
    console.log(event, messageData);
    if ("online" in messageData) {
      showOnlineUser(messageData.online);
    } else if ("text" in messageData) {
      setMessageList((prev) => [...prev, { ...messageData }]);
    }
  }

  function sendMessage(event) {
    console.log("send message");
    event.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: messageText,
      })
    );
    setMessageText("");
    setMessageList((prev) => [
      ...prev,
      {
        text: messageText,
        sender: id,
        recipient: selectedUserId,
        id: Date.now(),
      },
    ]);
  }

  useEffect(() => {
    const div = messageRef.current;
    if (div) div.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageList]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId); //.then(res=>setMessageList(res.data))
    }
  }, [selectedUserId]);

  const onlineUserExcluderUser = { ...onlineUser };
  delete onlineUserExcluderUser[id];

  const messageWithoutDupes = uniqBy(messageList, "id");

  return (
    <div className="flex h-screen">
      <div className="bg-green-50 w-1/5">
        <div className="text-green-600 font-bold flex gap-2 my-4 px-6 text-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64"
            />
          </svg>
          mernChat
        </div>

        {Object.keys(onlineUserExcluderUser).map((userId) => (
          <div
            key={userId}
            className={
              "border-b border-gray-100 py-2 pl-4 flex items-center gap-2 cursor-pointer" +
              (userId === selectedUserId ? " bg-green-100" : "")
            }
            onClick={() => setSelectedUserId(userId)}
          >
            {userId === selectedUserId && (
              <div className="w-1 bg-green-500 h-12 rounded-r-md"></div>
            )}
            <div className="flex gap-1 py-2 pl-4 items-center">
              <Avatar
                username={onlineUser[userId]}
                userId={userId}
                online={onlineUser}
              />
              <span className="text-xl">{onlineUser[userId]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-green-100 w-4/5 p-1 flex flex-col">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center text-green-500 font-extrabold text-3xl">
              Select a user to start chat
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute inset-0">
                {messageWithoutDupes.map((message) => (
                  <div
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        "text-left inline-block p-2 my-2 rounded-md text-sm " +
                        (message.sender === id
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-500")
                      }
                    >
                      sender: {message.sender}
                      <br />
                      my id: {id}
                      <br />
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={messageRef}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Message to"
              className="bg-white border p-2 rounded-lg flex-grow"
            />
            <button type="submit" className="p-2 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-10 bg-green-400 text-green-800 rounded-md"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
