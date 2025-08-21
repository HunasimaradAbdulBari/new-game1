'use client';

import { useEffect, useState } from 'react';

export default function ResultPage() {
  const [results, setResults] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Get results from localStorage
    if (typeof window !== 'undefined') {
      const savedResults = window.localStorage.getItem('gameResults');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setResults(parsedResults);
        
        // Show confetti if passed
        if (parsedResults.passed) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    }
  }, []);

  const handlePlayAgain = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('gameResults');
      window.location.href = '/QuestGame';
    }
  };

  const handleShareScore = () => {
    if (navigator.share && results) {
      navigator.share({
        title: 'Quest Flight Results',
        text: `I scored ${results.score} points in Quest Flight! Got ${results.correctAnswers}/${results.totalQuestions} questions right!`,
        url: window.location.origin + '/QuestGame'
      });
    } else if (results) {
      // Fallback: copy to clipboard
      const shareText = `I scored ${results.score} points in Quest Flight! Got ${results.correctAnswers}/${results.totalQuestions} questions right! Play at ${window.location.origin}/QuestGame`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Score copied to clipboard!');
      });
    }
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading results...</p>
        </div>
      </div>
    );
  }

  const getPerformanceMessage = () => {
    if (results.percentage >= 90) return { text: "Outstanding! 🎉", color: "text-yellow-400" };
    if (results.percentage >= 80) return { text: "Excellent! 🌟", color: "text-green-400" };
    if (results.percentage >= 70) return { text: "Great Job! ✨", color: "text-blue-400" };
    if (results.percentage >= 50) return { text: "Good Effort! 👍", color: "text-orange-400" };
    return { text: "Keep Practicing! 💪", color: "text-red-400" };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-md w-full">
        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Game Complete!</h1>
            <p className={`text-2xl font-semibold ${performance.color}`}>
              {performance.text}
            </p>
          </div>

          {/* Score Circle */}
          <div className="mb-8">
            <div className="relative inline-flex items-center justify-center w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
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
                  className={`transition-all duration-1000 ease-out ${
                    results.percentage >= 70 ? 'text-green-500' : 
                    results.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {results.percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{results.wrongAnswers}</div>
              <div className="text-sm text-red-700">Wrong</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{results.score}</div>
              <div className="text-sm text-blue-700">Total Score</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{results.livesUsed}</div>
              <div className="text-sm text-purple-700">Lives Used</div>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="mb-6">
            {results.passed ? (
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Passed! (70%+ required)
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Try Again (70%+ to pass)
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              🎮 Play Again
            </button>
            
            <button
              onClick={handleShareScore}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
            >
              📱 Share Score
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
            >
              🏠 Return Home
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #FFD700;
          animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}