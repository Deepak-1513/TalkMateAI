
import express from "express";
import { appendFile } from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import generateAIReply from "./index.js";

const app = express();

const PORT = 3000;
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}));

const users = new Map();

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// AI Reply API
app.post("/api/ai/reply", async (req, res) => {
    try {
        const { chatHistory } = req.body;

        if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
            return res.status(400).json({
                message: "Chat history is required"
            });
        }

        const aiReply = await generateAIReply(chatHistory);

        res.status(200).json({
            reply: aiReply
        });

    } catch (error) {
        console.error("AI Reply Error:", error.message);

        res.status(500).json({
            message: "Failed to generate AI reply"
        });
    }
});

io.on("connection", (socket) => {

    console.log("connected");
    console.log("id", socket.id);
    

    // NEW: User joins with username
        socket.on("join", (username) => {

            users.set(username, socket.id);

            console.log("Online Users:", users);

            // Send updated online users list to everyone
            io.emit("online-users", Array.from(users.keys()));

        });
// NEW: Join Socket.IO room
        socket.on("join-room", (roomId) => {

            socket.join(roomId);

            console.log(socket.id, "joined room:", roomId);

        });
    socket.on("message", (data) => {

    const messageData = {
        message: data.message,
        username: data.username,
        senderId: socket.id,
        timestamp: Date.now()
    };

    // Private Chat
    if (data.to) {

        const receiverId = users.get(data.to);

        if (receiverId) {
            io.to(receiverId).emit("message", messageData);
            socket.emit("message", messageData);
        }

    }

    // Room Group Chat
    else if (data.roomId) {

        io.to(data.roomId).emit("message", messageData);

    }

});

    socket.on("typing", (username) => {
        socket.broadcast.emit("typing", username);
    });

    socket.on("stop-typing", () => {
        socket.broadcast.emit("stop-typing");
    });

    socket.on("disconnect", () => {
        console.log("User Disconnect", socket.id);

        for (const [username, id] of users) {
        if (id === socket.id) {
            users.delete(username);
        }
    }
    // NEW: Update online users list
    io.emit("online-users", Array.from(users.keys()));

    });

});

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});
