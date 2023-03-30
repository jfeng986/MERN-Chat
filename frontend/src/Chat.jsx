import { useEffect,useState, useContext } from "react"
import Avatar from "./Avatar.jsx"
import Send from "./assets/Send.jsx";
import Logo from "./assets/Logo.jsx";
import {UserContext} from "./UserContext.jsx";


export default function Chat() {
    const [ws,setWs] = useState(null);
    const [onlineUser,setOnlineUser] = useState({});
    const [selectedUserId,setSelectedUserId] = useState(null);
    const {username,id} = useContext(UserContext);

    useEffect(()=>{    
        const ws = new WebSocket("ws://localhost:3000");
        setWs(ws);
        ws.addEventListener('message',sendMessage)
    },[]);

    function showOnlineUser(onlineUser){
        const onlineUserSet = {};
        onlineUser.forEach(({userId,username}) => {
            onlineUserSet[userId] = username;
        });
        setOnlineUser(onlineUserSet);
    }

    function sendMessage(event){
        const messageData = JSON.parse(event.data);
        if('online' in messageData){
            showOnlineUser(messageData.online);
        }
    }

    const onlinePeopleExcluderUser = {...onlineUser};
    delete onlinePeopleExcluderUser[id];

    return(
        <div className="flex h-screen">
            <div className="bg-green-50 w-1/5">
                <Logo />
                
                {Object.keys(onlineUser).map(userId=>
                    <div key={userId} 
                    className={"border-b border-gray-100 py-2 pl-4 flex items-center gap-2 cursor-pointer"
                    +(userId === selectedUserId ? " bg-green-100" : "")}
                    onClick={()=>setSelectedUserId(userId)}>
                        <Avatar username={onlineUser[userId]} userId={userId} online={onlineUser}/>
                        <span className="text-xl">{onlineUser[userId]}</span>
                    </div>)}
            </div>
            <div className="bg-green-100 w-4/5 p-1 flex flex-col">
                <div className="flex-grow">messages</div>
                <div className="flex gap-2">
                    <input type="text" 
                    placeholder="Message to"
                    className="bg-white border p-2 rounded-lg flex-grow"/>
                    <Send />
                </div>
            </div>
        </div>
    )

}
