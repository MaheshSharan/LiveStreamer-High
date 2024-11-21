'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function WatchPage() {
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const streamId = formData.get('streamId');
    if (streamId) {
      router.push(`/watch/${streamId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
      
      <div className="relative container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="max-w-xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Watch Stream
          </h1>
          
          <p className="text-lg text-gray-400">
            Enter a stream ID to join a live broadcast
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20" />
              <div className="relative bg-gray-900 border border-gray-800 rounded-lg p-1">
                <input
                  type="text"
                  name="streamId"
                  placeholder="Enter Stream ID"
                  className="w-full bg-gray-900 px-4 py-3 rounded-md text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-lg font-semibold transition-all hover:from-blue-500 hover:to-blue-600 hover:scale-105 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                Join Stream
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-16">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="text-blue-500 text-2xl mb-4">🎥</div>
              <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
              <p className="text-gray-400 text-sm">Experience crystal clear video streaming with minimal latency</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="text-blue-500 text-2xl mb-4">🌐</div>
              <h3 className="text-lg font-semibold text-white mb-2">Easy Access</h3>
              <p className="text-gray-400 text-sm">Join any stream instantly with just a stream ID</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
