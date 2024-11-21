# LiveStreamer High 🎥

A modern WebRTC-based live streaming platform with real-time screen sharing and minimal latency, built with Next.js 14 and TypeScript.

## Features ✨

- **Real-time Screen Sharing**: High-quality screen broadcasting
- **WebRTC Technology**: Ultra-low latency streaming
- **Modern UI**: Built with Tailwind CSS for a sleek experience
- **Live Viewer Count**: Real-time audience tracking
- **Instant Stream URLs**: Easy-to-share unique stream links
- **Responsive Design**: Works on all devices

## Tech Stack 🛠️

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Socket.IO Client
- WebRTC

### Backend
- Node.js
- Express
- Socket.IO
- CORS

## Getting Started 🚀

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/LiveStreamerHigh.git
cd LiveStreamerHigh
```

2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

3. Install Backend Dependencies
```bash
cd ../backend
npm install
```

### Running Locally

1. Start the Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage 📝

1. **Broadcasting**:
   - Click "Start Broadcasting" on the home page
   - Select the screen/window to share
   - Share the generated stream URL with viewers

2. **Watching**:
   - Open the shared stream URL
   - Stream loads automatically
   - View the live stream with minimal delay

## Contributing 🤝

Contributions are welcome! Feel free to open issues and pull requests.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- WebRTC for making real-time communication possible
- Next.js team for the amazing framework
- Socket.IO for real-time server-client communication
