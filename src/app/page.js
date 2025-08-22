export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple-500/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-40 w-20 h-20 bg-pink-500/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-green-500/10 rounded-full animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-6 animate-pulse-slow">
            🚀 Quest Flight
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
            Embark on an epic space adventure where knowledge is your fuel!
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Navigate through the cosmos, dodge dangerous obstacles, and prove your intelligence by answering challenging questions. Each correct answer propels you further into the unknown!
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-blue-400 mb-2">Arcade Action</h3>
            <p className="text-gray-300 text-sm">
              Classic arcade-style gameplay with modern physics. Simple controls, challenging obstacles, and endless fun!
            </p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold text-purple-400 mb-2">Brain Training</h3>
            <p className="text-gray-300 text-sm">
              Test your knowledge across multiple subjects. From science to history, challenge yourself and learn something new!
            </p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-pink-500/50 transition-all duration-300 transform hover:scale-105">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-pink-400 mb-2">Achievement</h3>
            <p className="text-gray-300 text-sm">
              Track your progress, beat your high scores, and share your achievements with friends. Become a space quiz master!
            </p>
          </div>
        </div>

        {/* Game Stats Preview */}
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-slate-600/30">
          <h2 className="text-2xl font-semibold text-white mb-6">🎯 Game Features</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">10</div>
              <div className="text-gray-300 text-sm">Questions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">3</div>
              <div className="text-gray-300 text-sm">Lives</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">70%</div>
              <div className="text-gray-300 text-sm">Pass Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-400">∞</div>
              <div className="text-gray-300 text-sm">Replays</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <button
            onClick={() => window.location.href = '/QuestGame'}
            className="px-12 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-110 animate-pulse-slow"
          >
            🚀 Launch Quest Flight
          </button>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/QuestGame/result'}
              className="px-6 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              📊 View Sample Results
            </button>
            
            <button
              onClick={() => alert('🔧 Coming Soon! API integration for dynamic questions will be available in the next update.')}
              className="px-6 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              🔧 API Integration
            </button>
          </div>
        </div>

        {/* How to Play Quick Guide */}
        <div className="mt-16 text-left max-w-2xl mx-auto">
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">🕹️ Quick Start Guide</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <h4 className="font-semibold text-white">Launch Your Rocket</h4>
                <p className="text-gray-300 text-sm">Use SPACEBAR (desktop) or tap (mobile) to fly up. Gravity pulls you down naturally.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <h4 className="font-semibold text-white">Dodge Obstacles</h4>
                <p className="text-gray-300 text-sm">Avoid the red falling obstacles. Each hit costs a life - you only have 3!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <h4 className="font-semibold text-white">Answer Questions</h4>
                <p className="text-gray-300 text-sm">When questions appear, fly into the correct answer zone or click it. Each correct answer gives you 10 points!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700">
          <p className="text-gray-500 text-sm">
            Built with ❤️ using Next.js, Phaser, and Tailwind CSS • Ready for API integration
          </p>
        </div>
      </div>
    </div>
  );
}