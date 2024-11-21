import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden flex-grow">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 pb-2">
              Live<span className="text-white">Streamer</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto">
              Share your content with the world in real-time. High-quality, low-latency streaming made simple.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 text-gray-400">
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="text-blue-500 text-2xl mb-2">🎥</div>
                <h3 className="text-white text-lg font-semibold mb-2">Screen Sharing</h3>
                <p className="text-sm">Share your screen with crystal clear quality and minimal delay</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="text-blue-500 text-2xl mb-2">⚡</div>
                <h3 className="text-white text-lg font-semibold mb-2">Low Latency</h3>
                <p className="text-sm">Real-time streaming with minimal delay for better interaction</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="text-blue-500 text-2xl mb-2">🌐</div>
                <h3 className="text-white text-lg font-semibold mb-2">Easy Sharing</h3>
                <p className="text-sm">Share your stream with a simple, unique URL</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mt-12">
              <Link 
                href="/broadcast"
                className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-lg font-semibold transition-all hover:from-blue-500 hover:to-blue-600 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  Start Broadcasting
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
              
              <Link
                href="/watch"
                className="group relative overflow-hidden px-8 py-4 bg-gray-800 rounded-lg text-lg font-semibold transition-all hover:bg-gray-700 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  Watch Stream
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
