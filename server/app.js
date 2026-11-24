
import express from "express";
import { appendFile } from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import generateAIReply from "./index.js";
import "dotenv/config";
import paymentRoutes from "./routes/paymentRoutes.js";

const PORT = 3000;
const app = express();
app.use(express.json());


import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use("/api/payment", paymentRoutes);

const users = new Map();

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});






// 5. Multer ko batao file kahan rakhni hai — memory mein (RAM), disk par nahi
const storage = multer.memoryStorage();
// 6. Multer middleware banao, storage ke saath
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// 7. Upload route — POST /upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // 8. Check karo file aayi ya nahi
    if (!req.file) {
      return res.status(400).json({ message: 'Koi file nahi mili' });
    }

    // 9. File ko base64 string mein convert karo (Cloudinary SDK ko yahi chahiye)
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // 10. Cloudinary par upload karo
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'my-app-uploads',   // Cloudinary mein folder
      resource_type: 'auto',       // image/video/PDF sab auto-detect
    });

    // 11. Frontend ko URL bhej do
    res.json({
      message: 'Upload successful',
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    // 12. Error aaye toh 500 bhejo
    console.error(error);
    res.status(500).json({ message: 'Upload fail', error: error.message });
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
        // console.error("AI Reply Error:", error.message);

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

        if(receiverId) {
            io.to(receiverId).emit("message", messageData);
            socket.emit("message", messageData); 
        }
        
        // console.log("Sending notification to:", data.to);
        
        io.to(receiverId).emit("notification", {
            username: data.username,
            message: data.message,
            chatType: "private",
            chatId: data.username
        });

    }

    // Room Group Chat
    else if (data.roomId) {

        io.to(data.roomId).emit("message", messageData);

        socket.to(data.roomId).emit("notification", {
            username: data.username,
            message: data.message,
            chatType: "group",
            chatId: data.roomId
        });
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
