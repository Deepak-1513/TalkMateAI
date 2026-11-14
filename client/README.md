# TalkMate AI – Real-Time Chat Application

TalkMate AI is a real-time chat application that enables users to communicate through private and group chats. It also integrates Google Gemini AI to generate context-aware replies based on ongoing conversations.

## Features

- Real-time private messaging using Socket.IO.
- Group chat using Socket.IO rooms.
- Online users tracking.
- Typing indicators.
- AI-powered replies using Google Gemini.
- Context-aware AI responses.
- Adaptive AI conversational personality.

## Tech Stack

**Frontend**
- React.js
- Tailwind CSS
- Socket.IO Client

**Backend**
- Node.js
- Express.js
- Socket.IO

**AI Integration**
- Google Gemini API
- Google GenAI SDK

## Project Structure

```text
TalkMate/
├── client/
│   └── src/
├── server/
│   ├── server.js
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd TalkMate
```

### 2. Setup Frontend

```bash
cd client
npm install
npm run dev
```

### 3. Setup Backend

Open another terminal:

```bash
cd server
npm install
```

Create a `.env` file inside the server folder:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
node server.js
```

## Environment Variables

| Variable | Description |
|---|---|
| GEMINI_API_KEY | Google Gemini API key |

## Future Improvements

- Persistent chat history using MongoDB.
- User authentication and authorization.
- Improved AI conversation context management.
- Enhanced chat UI and user experience.
