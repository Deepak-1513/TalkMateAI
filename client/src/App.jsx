
import React from 'react'
import { useEffect, useState, useRef, useMemo } from 'react';
import { io } from "socket.io-client";
import NotificationComponent  from "./Notification";
import { Box } from '@mui/material';

const App = () => {

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [myId, setMyId] = useState("");
    const [username, setUsername] = useState("");
    const [typingUser, setTypingUser] = useState("");
    const [receiverId, setReceiverId] = useState("");

    const typingTimeout = useRef(null);

    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");

    // NEW: Room states
    const [roomId, setRoomId] = useState("");
    const [joinedRoom, setJoinedRoom] = useState("");

    const [aiLoading, setAiLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const socket = useMemo(() => {
        return io("http://localhost:3000/");
    }, []);

    // Send Message
    const sendMessage = () => {

        if (!message.trim()) return;

        clearTimeout(typingTimeout.current);
        socket.emit("stop-typing");

        // Private Chat
        if (selectedUser) {

            socket.emit("message", {
                message,
                username,
                to: selectedUser
            });

        }

        // Room Group Chat
        else if (joinedRoom) {

            socket.emit("message", {
                message,
                username,
                roomId: joinedRoom
            });

        }

        else {

            alert("Please select a user or join a room");
            return;

        }

        setMessage("");
    };

    const handleuser = () => {

        if (!username.trim()) return;

        socket.emit("join", username);

    };

     
const handleAIReply = async () => {

    if (messages.length === 0) {
        alert("No conversation available for AI reply");
        return;
    }

    try {
        setAiLoading(true);

        // Convert existing chat messages into Gemini format
      const chatHistory = messages
    .filter((msg) => msg.senderId !== "AI")
    .map((msg) => ({
        role: msg.senderId === myId ? "user" : "model",
        parts: [{ text: msg.message }]
    }));

// Ensure the last message is from the user
while (
    chatHistory.length > 0 &&
    chatHistory[chatHistory.length - 1].role !== "user"
) {
    chatHistory.pop();
}
        // Send chat history to backend
        const response = await fetch(
            "http://localhost:3000/api/ai/reply",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chatHistory
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "AI request failed");
        }

        // Show AI reply in chat UI
        const aiMessage = {
            message: data.reply,
            username: "TalkMate AI",
            senderId: "AI",
            timestamp: Date.now()
        };

        setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
        console.error("AI Reply Error:", error);
        alert(error.message);

    } finally {
        setAiLoading(false);
    }
};


    const handleInputChange = (e) => {

        const value = e.target.value;

        setMessage(value);

        if (value.trim()) {

            socket.emit("typing", username);

            clearTimeout(typingTimeout.current);

            typingTimeout.current = setTimeout(() => {
                socket.emit("stop-typing");
            }, 1000);

        } else {

            clearTimeout(typingTimeout.current);
            socket.emit("stop-typing");

        }
    };

    // NEW: Join Room Function
    const joinRoom = () => {

        if (!roomId.trim()) return;

        socket.emit("join-room", roomId);

        setJoinedRoom(roomId);
        setSelectedUser("");

        console.log("Joined Room:", roomId);

    };



    const handlePayment = async () => {
    try {
        setPaymentLoading(true);

        const response = await fetch(
            "http://localhost:3000/api/payment/create-order",
            {
                method: "POST"
            }
        );

            const data = await response.json();
            //             {
            //     success: true,
            //     order: {
            //         id: "order_ABC123",
            //         amount: 1000,
            //         currency: "INR",
            //         receipt: "receipt_123" yhi aayega
            //     }
            // }

            if (!response.ok) {
                throw new Error(data.message || "Order creation failed");
            }

            console.log("Created Order:", data.order);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "TalkMate",
                description: "TalkMate Payment",
                order_id: data.order.id,

                // handler: function (response) {
                //   //  console.log("Payment Response:", response);  
                // //                     {
                // //     razorpay_payment_id: "pay_ABC123",
                // //     razorpay_order_id: "order_XYZ456",
                // //     razorpay_signature: "a1b2c3..."
                // // } yha ye response h razorpay pop window se aa rhi
                // }

                handler: async function (paymentResponse) {
                try {
                    const verifyResponse = await fetch(
                        "http://localhost:3000/api/payment/verify",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(paymentResponse)
                        }
                    );

                    const verifyData = await verifyResponse.json();

                    if (!verifyResponse.ok) {
                        throw new Error(verifyData.message);
                    }

                    alert("Payment verified successfully!");

                    console.log("Verification Result:", verifyData);

                } catch (error) {
                    console.error("Verification Error:", error);
                    alert(error.message || "Payment verification failed");
                }
            }
            };
            // Pehla response order create hone ka result hai, doosra payment hone ka result hai. Dono alag objects hain.

            const razorpay = new window.Razorpay(options);

            razorpay.open();

        } catch (error) {
            console.error("Payment Error:", error);
            alert(error.message);
        } finally {
            setPaymentLoading(false);
        }
    };




    useEffect(() => {

        // const handleConnect = () => {
        //     console.log("user Connected");
        //     setMyId(socket.id);
        //     console.log("My Socket ID:", socket.id);
        // };

        const handleWelcome = (s) => {
            console.log(s);
        };

        socket.on("typing", (username) => {
            setTypingUser(username);
        });

        socket.on("stop-typing", () => {
            setTypingUser("");
        });

        socket.on("online-users", (users) => {
            setOnlineUsers(users);
        });

        socket.on("message", (data) => {
            setMessages((prev) => [...prev, data]);  
        });

      //  socket.on("connection", handleConnect);
        socket.on("welcome", handleWelcome);

        return () => {

            clearTimeout(typingTimeout.current);

            socket.disconnect();
        };

    }, [socket]);

    return (

        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            flexWrap: "wrap",
            marginTop: "10px",
            margin: "30px"
        }}>
            <NotificationComponent socket={socket} />
            
         <button
            onClick={handlePayment}
            disabled={paymentLoading}
         >
            {paymentLoading ? "Processing..." : "Pay Now"}
         </button>

            {/* Online Users */}
            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "15px",
                flexWrap: "wrap",
                marginTop: "10px"
            }}>

                {onlineUsers
                    .filter((user) => user !== username)
                    .map((user, index) => (

                    <p
                        key={index}
                        onClick={() => {
                            setSelectedUser(user);
                            setJoinedRoom(""); // NEW
                        }}
                        style={{
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "8px",
                            background: selectedUser === user
                                ? "#dbeafe"
                                : "white"
                        }}
                    >
                        🟢 {user}
                    </p>

                ))}

            </div>

            {/* NEW: Room ID Input */}
            <div className="flex gap-2 my-3">

                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="border p-2 rounded-lg w-full"
                />

                <button
                    onClick={joinRoom}
                    className="bg-green-600 text-white px-4 rounded-lg"
                >
                    Join Room
                </button>

            </div>

          <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', p: 3, borderRadius: 3, boxShadow: 3, width: 384, }}>

                <h2 className="text-xl font-bold mb-4 text-center">
                    Chat Room
                </h2>

                {/* Username */}
                <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <button
                    onClick={handleuser}
                    className="bg-blue-600 text-white px-4 rounded-lg"
                >
                    Done
                </button>

                {/* NEW: Current Chat Name */}
                <div className="my-3 font-semibold text-sm">
                    {selectedUser
                        ? `Private Chat: ${selectedUser}`
                        : joinedRoom
                            ? `Group Room: ${joinedRoom}`
                            : "Select a user or join a room"}
                </div>

                {/* Message Input */}
                
         
               <Box
                    sx={{
                        display: 'flex',
                        gap: '8px',
                        padding: '1px',
                        margin: '3px'
                    }}
                    >
                    <input
                        type="text"
                        placeholder="Enter your message..."
                        value={message}
                        onChange={handleInputChange}
                        onBlur={() => {
                            clearTimeout(typingTimeout.current);
                            socket.emit("stop-typing");
                        }}
                        className="border border-gray-300 rounded-lg p-3 w-full outline-none"
                    />

                    <button
                        onClick={sendMessage}
                        className="bg-blue-600 text-white px-4 rounded-lg"
                    >
                        Send
                    </button>
                   
                   <button
                        onClick={handleAIReply}
                        disabled={aiLoading}
                        className="bg-purple-600 text-white px-4 rounded-lg"
                    >
                        {aiLoading ? "Thinking..." : "MitraAi🫂"}
                    </button>

                    </Box>
               

                {/* Typing Indicator */}
                <div style={{
                    marginTop: "15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                }}>

                    {typingUser && (
                        <p style={{
                            fontSize: "13px",
                            color: "gray",
                            marginTop: "8px"
                        }}>
                            {typingUser} is typing...
                        </p>
                    )}

                    {/* Messages */}
                    {messages.map((msg, index) => (

                        <div
                            key={index}
                            style={{
                                display: "flex",
                                justifyContent:
                                    msg.senderId === myId
                                        ? "flex-end"
                                        : "flex-start"
                            }}
                        >

                            <div style={{
                                backgroundColor:
                                    msg.senderId === myId
                                        ? "#2563eb"
                                        : "#e5e7eb",

                                color:
                                    msg.senderId === myId
                                        ? "white"
                                        : "black",

                                padding: "8px 12px",
                                borderRadius: "12px",
                                maxWidth: "75%",
                                overflowWrap: "anywhere"
                            }}>

                                <div style={{
                                    fontSize: "11px",
                                    marginBottom: "3px",
                                    opacity: 0.7
                                }}>
                                    {msg.senderId === myId
                                        ? "You"
                                        : msg.username}
                                </div>

                                <div>
                                    {msg.message}
                                </div>

                                <div style={{
                                    fontSize: "10px",
                                    textAlign: "right",
                                    marginTop: "4px",
                                    opacity: 0.7
                                }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </Box>

        </div>
    );
};

export default App;
