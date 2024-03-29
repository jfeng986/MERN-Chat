import { useEffect, useState, useContext, useId, useRef } from "react";
import { uniqBy } from "lodash";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";
import Contact from "./Contact.jsx";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlineUser, setOnlineUser] = useState({});
  const [offlineUser, setOfflineUser] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const [messageText, setMessageText] = useState("");
  const [messageList, setMessageList] = useState([]);
  const messageRef = useRef();

  useEffect(() => {
    connectToWs();
  }, [selectedUserId]);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:3000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        connectToWs();
      }, 1000);
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
    if ("online" in messageData) {
      showOnlineUser(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessageList((prev) => [...prev, { ...messageData }]);
      }
    }
  }

  function sendMessage(event, file = null) {
    if (event) event.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: messageText,
        file,
      })
    );

    if (file) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessageList(res.data);
      });
    } else {
      setMessageText("");
      setMessageList((prev) => [
        ...prev,
        {
          text: messageText,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }
  }

  function sendFile(event) {
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        data: reader.result,
        name: event.target.files[0].name,
      });
    };
  }

  function logout() {
    axios.post("/logout").then(() => {
      setId(null);
      setUsername(null);
      localStorage.removeItem("id");
      localStorage.removeItem("username");
      setWs(null);
    });
  }

  useEffect(() => {
    const div = messageRef.current;
    if (div) div.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageList]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessageList(res.data);
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    axios.get("users").then((res) => {
      const offlineUserArr = res.data
        .filter((user) => user._id !== id)
        .filter((user) => !Object.keys(onlineUser).includes(user._id));
      const offlineUser = {};
      offlineUserArr.forEach((user) => {
        offlineUser[user._id] = user;
      });
      setOfflineUser(offlineUser);
    });
  }, [onlineUser]);

  const onlineUserExcludeThisUser = { ...onlineUser };
  delete onlineUserExcludeThisUser[id];

  const messagesWithoutDupes = uniqBy(messageList, "_id");

  return (
    <div className="flex h-screen">
      <div className="bg-green-50 w-1/5 flex flex-col">
        <div className="flex-grow">
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
            ChatRoom
          </div>

          {Object.keys(onlineUserExcludeThisUser).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlineUserExcludeThisUser[userId]}
              onClick={() => {
                setSelectedUserId(userId);
                console.log({ userId });
              }}
              selected={userId === selectedUserId}
            />
          ))}
          {Object.keys(offlineUser).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlineUser[userId].username}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
            />
          ))}
        </div>

        <div className="p-2 text-center flex items-center justify-center">
          <span className="text-gray-600 font-semibold mr-2 flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 "
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>

            {username}
          </span>
          <button
            className="text-green-500 font-bold py-1 px-2 rounded-md border bg-green-100"
            onClick={logout}
          >
            logout
          </button>
        </div>
      </div>
      <div className="bg-green-100 w-4/5 p-1 flex flex-col">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center text-green-500 font-extrabold text-3xl">
              Choose a user to chat with
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute inset-0">
                {messagesWithoutDupes.map((message) => (
                  <div
                    key={message._id}
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
                      {message.text}
                      {message.file && (
                        <a
                          target="_blank"
                          className="underline flex items-center gap-1"
                          href={
                            axios.defaults.baseURL + "/uploads/" + message.file
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-green-300"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {message.file}
                        </a>
                      )}
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
            <label type="button" className="text-white">
              <input type="file" className="hidden" onChange={sendFile} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-10 h-10 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <button type="submit" className="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 bg-green-400 text-green-800 rounded-md"
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
