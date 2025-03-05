const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://subtle-faun-804e92.netlify.app/",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const PORT = process.env.PORT || 5000;

// Store users and messages
const users = new Map();
const messages = [];

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (username) => {
    users.set(socket.id, username);
    
    // Emit existing messages to the new user
    socket.emit('load_messages', messages);

    // Broadcast new user joined
    io.emit('user_joined', {
      username,
      users: Array.from(users.values())
    });
  });

  socket.on('send_message', (messageData) => {
    const message = {
      ...messageData,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    messages.push(message);
    
    // Limit messages to last 100
    if (messages.length > 100) {
      messages.shift();
    }

    io.emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);

    if (username) {
      io.emit('user_left', {
        username,
        users: Array.from(users.values())
      });
    }

    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});