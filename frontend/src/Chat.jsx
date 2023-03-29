import { useEffect,useState } from "react"
import Avatar from "./Avatar.jsx"

export default function Chat() {
    const[ws,setWs] = useState(null);
    const [onlineUser,setOnlineUser] = useState({});
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
    return(
        <div className="flex h-screen">
            <div className="bg-green-100 w-1/4 pl-4 pt-4">
                <div className="text-green-600 font-bold flex gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
                </svg>
                mernChat
                </div>
                {Object.keys(onlineUser).map(userId=>
                <div key={userId} 
                className="border-b border-gray-100 p-2 flex items-center gap-2">
                <Avatar username={onlineUser[userId]} userId={userId} online={onlineUser}/>
                <span className="text-xl">{onlineUser[userId]}</span>
                </div>)}
            </div>
            <div className="bg-green-300 w-3/4 p-1 flex flex-col">
                <div className="flex-grow">messages</div>
                <div className="flex gap-2">
                    <input type="text" 
                    placeholder="Message to"
                    className="bg-white border p-2 rounded-lg flex-grow"/>
                    <button className="p-2 text-white">
                        <img src="https://d1b1fjiwh8olf2.cloudfront.net/icon/premium/png-256/115096.png?token=eyJhbGciOiJoczI1NiIsImtpZCI6ImRlZmF1bHQifQ__.eyJpc3MiOiJkMWIxZmppd2g4b2xmMi5jbG91ZGZyb250Lm5ldCIsImV4cCI6MTY4MDMwNzIwMCwicSI6bnVsbCwiaWF0IjoxNjgwMTE1MzE0fQ__.c12762a95052daecce2f67a81c521ab82b2ab5937b75287cb5aeca3826ef23aa" 
                        alt="Send" 
                        className="w-8 h-8"/>
                    </button>
                </div>
            </div>
        </div>
    )

}
