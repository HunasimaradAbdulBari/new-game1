'use client';

import { useEffect, useState } from 'react';

export default function ResultPage() {
  const [results, setResults] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Get results from localStorage
    const savedResults = window.localStorage.getItem('gameResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        
        // Show confetti if passed (70%+)
        if (parsedResults.passed) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } catch (error) {
        console.error('Failed to parse results:', error);
        setResults(null);
      }
    }
  }, [isClient]);

  const handlePlayAgain = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('gameResults');
      window.location.href = '/QuestGame';
    }
  };

  const handleShareScore = async () => {
    if (!results) return;

    const shareData = {
      title: 'Quest Flight - Space Quiz Game',
      text: `🚀 I scored ${results.score} points in Quest Flight! Got ${results.correctAnswers}/${results.totalQuestions} questions right (${results.percentage}%)!`,
      url: window.location.origin + '/QuestGame'
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed:', error);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    if (!results) return;

    const shareText = `🚀 I scored ${results.score} points in Quest Flight! Got ${results.correctAnswers}/${results.totalQuestions} questions right (${results.percentage}%)! Play at ${window.location.origin}/QuestGame`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('✅ Score copied to clipboard! Share it with your friends!');
      }).catch(() => {
        prompt('Copy this text to share your score:', shareText);
      });
    } else {
      prompt('Copy this text to share your score:', shareText);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-2xl font-bold text-white mb-4">No Results Found</h1>
          <p className="text-gray-300 mb-6">It looks like you haven't played the game yet!</p>
          <button
            onClick={() => window.location.href = '/QuestGame'}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🚀 Play Quest Flight
          </button>
        </div>
      </div>
    );
  }

  const getPerformanceData = () => {
    if (results.percentage >= 90) return { 
      emoji: "🏆", 
      title: "Outstanding!", 
      message: "You're a space quiz master!", 
      color: "from-yellow-400 to-yellow-600",
      bgColor: "from-yellow-50 to-orange-50" 
    };
    if (results.percentage >= 80) return { 
      emoji: "⭐", 
      title: "Excellent!", 
      message: "Stellar performance!", 
      color: "from-green-400 to-green-600",
      bgColor: "from-green-50 to-emerald-50" 
    };
    if (results.percentage >= 70) return { 
      emoji: "🎯", 
      title: "Great Job!", 
      message: "You passed with flying colors!", 
      color: "from-blue-400 to-blue-600",
      bgColor: "from-blue-50 to-sky-50" 
    };
    if (results.percentage >= 50) return { 
      emoji: "💫", 
      title: "Good Effort!", 
      message: "Keep practicing and you'll ace it!", 
      color: "from-orange-400 to-orange-600",
      bgColor: "from-orange-50 to-yellow-50" 
    };
    return { 
      emoji: "🚀", 
      title: "Keep Learning!", 
      message: "Every journey starts with a single step!", 
      color: "from-purple-400 to-purple-600",
      bgColor: "from-purple-50 to-pink-50" 
    };
  };

  const performance = getPerformanceData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-purple-500/20 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-pink-500/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-green-500/20 rounded-full animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F38BA8'][Math.floor(Math.random() * 6)]
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-md w-full z-10">
        {/* Results Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center border border-white/20">
          {/* Header */}
          <div className="mb-6">
            <div className="text-6xl mb-3">{performance.emoji}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Mission Complete!</h1>
            <p className={`text-2xl font-semibold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}>
              {performance.title}
            </p>
            <p className="text-gray-600 mt-1">{performance.message}</p>
          </div>

          {/* Score Circle */}
          <div className="mb-8 relative">
            <svg className="w-32 h-32 mx-auto transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - results.percentage / 100)}`}
                className={`transition-all duration-2000 ease-out ${
                  results.percentage >= 70 ? 'text-green-500' : 
                  results.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}
                style={{ transitionDelay: '0.5s' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-800">
                {results.percentage}%
              </span>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
              <div className="text-sm text-green-700 font-medium">Correct ✓</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{results.wrongAnswers}</div>
              <div className="text-sm text-red-700 font-medium">Wrong ✗</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{results.score}</div>
              <div className="text-sm text-blue-700 font-medium">Score 🎯</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{results.livesUsed}/3</div>
              <div className="text-sm text-purple-700 font-medium">Lives Used 💔</div>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="mb-6">
            {results.passed ? (
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full border border-green-300">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                🎉 Mission Passed! (70%+ required)
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-full border border-orange-300">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                🚀 Try Again (70%+ to pass)
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              🎮 Play Again
            </button>
            
            <button
              onClick={handleShareScore}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              📱 Share Score
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg text-lg"
            >
              🏠 Return Home
            </button>
          </div>

          {/* Fun Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="mb-1">
                ⏱️ Questions answered: <span className="font-semibold text-gray-800">{results.totalQuestions}</span>
              </p>
              <p className="mb-1">
                💯 Accuracy: <span className="font-semibold text-gray-800">{results.totalQuestions > 0 ? Math.round((results.correctAnswers / results.totalQuestions) * 100) : 0}%</span>
              </p>
              <p>
                🎯 Performance: <span className="font-semibold text-gray-800">
                  {results.percentage >= 90 ? 'Space Ace' :
                   results.percentage >= 80 ? 'Star Navigator' :
                   results.percentage >= 70 ? 'Cosmic Explorer' :
                   results.percentage >= 50 ? 'Space Cadet' : 'Rookie Pilot'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">
            {results.passed ? 
              "🌟 Congratulations! You've mastered this cosmic challenge!" :
              "🚀 Don't give up! Every astronaut started as a beginner!"
            }
          </p>
        </div>
      </div>
    </div>
  );
}