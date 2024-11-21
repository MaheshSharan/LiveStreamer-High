const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Allow both development and production frontend URLs
const allowedOrigins = [
    'http://localhost:3000',
    'https://live-streamer-high.vercel.app'
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    // Force WebSocket transport only
    transports: ['websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1 MB max message size
    allowEIO3: true // Enable compatibility with Socket.IO v3 clients
});

// Store active streams in memory only
const activeStreams = new Map();

// Cleanup inactive streams every 5 minutes
setInterval(() => {
    const now = Date.now();
    activeStreams.forEach((stream, streamId) => {
        // Remove streams inactive for more than 1 hour
        if (now - stream.lastActivity > 3600000) {
            console.log('Cleaning up inactive stream:', streamId);
            activeStreams.delete(streamId);
        }
    });
}, 300000);

// Basic health check for Render
app.get('/', (req, res) => {
    res.send('LiveStreamer Backend is running!');
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle stream creation
    socket.on('create-stream', () => {
        const streamId = generateStreamId();
        activeStreams.set(streamId, {
            broadcasterId: socket.id,
            viewers: new Set(),
            lastActivity: Date.now()
        });
        socket.emit('stream-created', streamId);
        console.log('Stream created:', streamId);
    });

    // Handle viewer joining
    socket.on('join-stream', (streamId) => {
        console.log('Viewer joining stream:', streamId);
        const stream = activeStreams.get(streamId);
        if (stream) {
            stream.lastActivity = Date.now();
            stream.viewers.add(socket.id);
            io.to(stream.broadcasterId).emit('viewer-joined', socket.id);
            io.to(stream.broadcasterId).emit('viewer-count', stream.viewers.size);
            socket.emit('viewer-count', stream.viewers.size);
            socket.emit('stream-status', { isLive: true });
            console.log('Viewer joined:', socket.id, 'Viewer count:', stream.viewers.size);
        } else {
            socket.emit('stream-status', { isLive: false });
            console.log('Stream not found:', streamId);
        }
    });

    // Handle WebRTC signaling with memory optimization
    socket.on('signal', ({ to, signal }) => {
        // Update stream activity
        activeStreams.forEach(stream => {
            if (stream.broadcasterId === socket.id || stream.viewers.has(socket.id)) {
                stream.lastActivity = Date.now();
            }
        });
        
        console.log('Signal from', socket.id, 'to', to);
        io.to(to).emit('signal', {
            from: socket.id,
            signal
        });
    });

    // Handle disconnection with cleanup
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        activeStreams.forEach((stream, streamId) => {
            if (stream.broadcasterId === socket.id) {
                console.log('Broadcaster disconnected, ending stream:', streamId);
                activeStreams.delete(streamId);
                stream.viewers.forEach(viewerId => {
                    io.to(viewerId).emit('stream-ended');
                });
            } else if (stream.viewers.has(socket.id)) {
                console.log('Viewer disconnected from stream:', streamId);
                stream.viewers.delete(socket.id);
                io.to(stream.broadcasterId).emit('viewer-count', stream.viewers.size);
            }
        });
    });
});

// Generate random stream ID
function generateStreamId() {
    return Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
