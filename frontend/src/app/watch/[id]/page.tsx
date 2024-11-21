'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function StreamPage({ params }: { params: { id: string } }) {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const SOCKET_URL = process.env.NODE_ENV === 'production' 
      ? 'https://livestreamer-backend.onrender.com'  // Replace with your actual Render.com URL
      : 'http://localhost:3001';
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server with socket ID:', socketRef.current?.id);
      // Join stream room after connection
      socketRef.current?.emit('join-stream', params.id);
    });

    socketRef.current.on('stream-status', ({ isLive: streamIsLive }) => {
      console.log('Stream status:', streamIsLive ? 'live' : 'offline');
      setIsLive(streamIsLive);
      setIsConnecting(false);
    });

    // Initialize WebRTC
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // Set up peer connection handlers
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received track:', event.streams[0]);
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setIsLive(true);
        setIsConnecting(false);
        videoRef.current.play().catch(error => {
          console.log('Auto-play failed, waiting for user interaction:', error);
          if (error.name === 'NotAllowedError') {
            console.log('Please click play to start the stream');
          }
        });
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', {
          to: params.id,
          signal: event.candidate
        });
      }
    };

    // Handle signaling
    socketRef.current.on('signal', async ({ from, signal }) => {
      try {
        if (!peerConnectionRef.current) return;

        if (signal.type === 'offer') {
          console.log('Received offer:', signal);
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socketRef.current?.emit('signal', {
            to: from,
            signal: answer
          });
        } else if (signal.type === 'answer') {
          console.log('Received answer:', signal);
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          console.log('Received ICE candidate:', signal);
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    // Set timeout for connection attempt
    const connectionTimeout = setTimeout(() => {
      if (isConnecting) {
        setIsConnecting(false);
        console.log('Connection timed out');
      }
    }, 10000);

    socketRef.current.on('viewer-count', (count: number) => {
      setViewerCount(count);
    });

    socketRef.current.on('stream-ended', () => {
      setIsLive(false);
      setViewerCount(0);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    return () => {
      clearTimeout(connectionTimeout);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      setIsConnecting(false);
    };
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
      
      <div className="relative container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/watch" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Streams
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-400">
                {isConnecting ? 'Connecting...' : isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-400">Viewers</p>
              <p className="text-xl font-semibold text-center text-white">{viewerCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Video */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls
                className="w-full h-full object-contain"
                style={{ backgroundColor: 'black' }}
              />
              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                  <div className="text-center">
                    {isConnecting ? (
                      <>
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-2xl font-semibold text-gray-300">Connecting to stream...</p>
                      </>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-300">Stream is offline</p>
                    )}
                  </div>
                </div>
              )}
              {isLive && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-end gap-4">
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
