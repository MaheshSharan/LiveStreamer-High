'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function BroadcastPage() {
  const [streamId, setStreamId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [bandwidthLimit, setBandwidthLimit] = useState(2500); // 2.5 Mbps default

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const createPeerConnection = (viewerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', {
          to: viewerId,
          signal: event.candidate
        });
      }
    };

    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        pc.addTrack(track, streamRef.current!);
      });
    }

    peerConnectionsRef.current.set(viewerId, pc);
    return pc;
  };

  useEffect(() => {
    const SOCKET_URL = process.env.NODE_ENV === 'production' 
      ? 'https://livestreamer-backend.onrender.com'
      : 'http://localhost:3001';
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server with socket ID:', socketRef.current?.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('viewer-joined', async (viewerId: string) => {
      console.log('New viewer joined:', viewerId);
      try {
        const pc = createPeerConnection(viewerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', {
          to: viewerId,
          signal: offer
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    socketRef.current.on('signal', async ({ from, signal }) => {
      try {
        const pc = peerConnectionsRef.current.get(from);
        if (!pc) return;

        if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    socketRef.current.on('viewer-count', (count: number) => {
      setViewerCount(count);
    });

    socketRef.current.on('stream-created', (id: string) => {
      console.log('Stream created with ID:', id);
      setStreamId(id);
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://live-streamer-high.vercel.app'
        : window.location.origin;
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Base URL selected:', baseUrl);
      const url = `${baseUrl}/watch/${id}`;
      setStreamUrl(url);
      console.log('Final stream URL:', url);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  const startStream = async () => {
    try {
      // Ensure socket is connected
      if (!socketRef.current) {
        const SOCKET_URL = process.env.NODE_ENV === 'production' 
          ? 'https://livestreamer-backend.onrender.com'
          : 'http://localhost:3001';
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: audioEnabled
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Generate stream ID and notify server
      socketRef.current?.emit('create-stream');
      setIsStreaming(true);
      setIsLive(true);

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopStream();
      };
    } catch (error) {
      console.error('Error starting stream:', error);
      setIsStreaming(false);
      setIsLive(false);
    }
  };

  const stopStream = () => {
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsStreaming(false);
    setIsLive(false);
    setStreamId('');
    setViewerCount(0);
    setStreamUrl('');
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const updateBandwidth = async (limit: number) => {
    setBandwidthLimit(limit);
    if (isStreaming) {
      const sender = peerConnectionsRef.current.values().next().value?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        const params = sender.getParameters();
        params.encodings = [
          {
            maxBitrate: limit * 1000, // Convert to bps
            maxFramerate: 30
          }
        ];
        await sender.setParameters(params);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(streamUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
      
      <div className="relative container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-400">{isLive ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-400">Viewers</p>
              <p className="text-xl font-semibold text-center text-white">{viewerCount}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm ${
                process.env.NODE_ENV === 'production' 
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {process.env.NODE_ENV === 'production' ? 'Production Mode' : 'Development Mode'}
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Window */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                  <p className="text-2xl font-semibold text-gray-400">Start streaming to preview</p>
                </div>
              )}
            </div>

            {/* Stream URL */}
            {streamUrl && (
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Stream URL</h2>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={streamUrl}
                    readOnly
                    className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy URL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Stream Controls */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Stream Controls</h2>
              <div className="space-y-4">
                <button
                  onClick={startStream}
                  disabled={isLive}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    isLive
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'
                  }`}
                >
                  {isLive ? 'Broadcasting' : 'Start Broadcasting'}
                  {isLive && (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
                
                <button
                  onClick={stopStream}
                  disabled={!isLive}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    !isLive
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white hover:scale-105'
                  }`}
                >
                  Stop Broadcasting
                </button>
              </div>
            </div>

            {/* Stream Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Stream Settings</h2>
              <div className="space-y-4">
                {/* Bandwidth */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bandwidth Limit (Mbps)</label>
                  <select
                    value={bandwidthLimit}
                    onChange={(e) => updateBandwidth(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="1000">1 Mbps</option>
                    <option value="2500">2.5 Mbps</option>
                    <option value="5000">5 Mbps</option>
                    <option value="8000">8 Mbps</option>
                  </select>
                </div>

                {/* Audio Toggle */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Audio</label>
                  <button
                    onClick={toggleAudio}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                      audioEnabled
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {audioEnabled ? 'Audio Enabled' : 'Audio Disabled'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Stream Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <p className="font-semibold text-white">
                    {isLive ? 'Live' : 'Offline'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Viewers</p>
                  <p className="font-semibold text-white">{viewerCount}</p>
                </div>
                {streamUrl && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Stream ID</p>
                    <p className="font-semibold text-white">{streamUrl.split('/').pop()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
