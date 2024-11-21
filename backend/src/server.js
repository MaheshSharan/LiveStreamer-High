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
    'https://live-streamer.vercel.app'
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Basic health check for Render
app.get('/', (req, res) => {
    res.send('LiveStreamer Backend is running!');
});

// Store active streams
const activeStreams = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle stream creation
    socket.on('create-stream', () => {
        const streamId = generateStreamId();
        activeStreams.set(streamId, {
            broadcasterId: socket.id,
            viewers: new Set()
        });
        socket.emit('stream-created', streamId);
        console.log('Stream created:', streamId);
    });

    // Handle viewer joining
    socket.on('join-stream', (streamId) => {
        console.log('Viewer joining stream:', streamId);
        const stream = activeStreams.get(streamId);
        if (stream) {
            stream.viewers.add(socket.id);
            // Notify broadcaster of new viewer
            io.to(stream.broadcasterId).emit('viewer-joined', socket.id);
            // Update viewer count for everyone in the stream
            io.to(stream.broadcasterId).emit('viewer-count', stream.viewers.size);
            socket.emit('viewer-count', stream.viewers.size);
            console.log('Viewer joined:', socket.id, 'Viewer count:', stream.viewers.size);
        }
    });

    // Handle WebRTC signaling
    socket.on('signal', ({ to, signal }) => {
        console.log('Signal from', socket.id, 'to', to, 'type:', signal.type || 'candidate');
        io.to(to).emit('signal', {
            from: socket.id,
            signal
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up streams and viewers
        activeStreams.forEach((stream, streamId) => {
            if (stream.broadcasterId === socket.id) {
                // Broadcaster disconnected
                console.log('Broadcaster disconnected, ending stream:', streamId);
                activeStreams.delete(streamId);
                // Notify all viewers
                stream.viewers.forEach(viewerId => {
                    io.to(viewerId).emit('stream-ended');
                });
            } else if (stream.viewers.has(socket.id)) {
                // Viewer disconnected
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
