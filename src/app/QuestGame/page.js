'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { QUESTIONS } from './questions.js';

// Dynamically import Phaser to prevent SSR issues
const Phaser = dynamic(() => import('phaser'), { ssr: false });

export default function QuestGamePage() {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient || typeof window === 'undefined') return;

    // Prevent multiple game instances
    if (phaserGameRef.current) return;

    const initGame = async () => {
      try {
        // Dynamic import of GameScene to avoid SSR issues
        const { GameScene } = await import('../../../components/Quest/scenes/GameScene.js');
        const PhaserModule = await import('phaser');
        
        // Phaser game configuration
        const config = {
          type: PhaserModule.default.AUTO,
          width: 800,
          height: 600,
          parent: gameRef.current,
          backgroundColor: '#1a1a2e',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0 }, // We handle gravity manually
              debug: false
            }
          },
          scene: GameScene,
          scale: {
            mode: PhaserModule.default.Scale.FIT,
            autoCenter: PhaserModule.default.Scale.CENTER_BOTH,
            min: {
              width: 400,
              height: 300
            },
            max: {
              width: 1200,
              height: 900
            }
          },
          audio: {
            disableWebAudio: false
          }
        };

        // Create Phaser game instance
        const game = new PhaserModule.default.Game(config);
        phaserGameRef.current = game;

        // Wait for scene to be ready then pass questions
        game.events.once('ready', () => {
          const scene = game.scene.getScene('GameScene');
          if (scene) {
            scene.scene.restart({ questions: QUESTIONS });
          }
        });

        setGameLoaded(true);
        console.log('Game initialized successfully');

      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError('Failed to load game. Please refresh the page.');
      }
    };

    initGame();

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [isClient]);

  // Handle page visibility change to pause/resume game
  useEffect(() => {
    if (!isClient) return;

    const handleVisibilityChange = () => {
      if (phaserGameRef.current) {
        if (document.hidden) {
          phaserGameRef.current.scene.pause('GameScene');
        } else {
          phaserGameRef.current.scene.resume('GameScene');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Initializing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Game Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Game Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2 animate-pulse-slow">
          🚀 Quest Flight
        </h1>
        <p className="text-gray-300 text-lg">Navigate through space, dodge obstacles, and answer questions!</p>
      </div>

      {/* Game Container */}
      <div className="relative">
        <div 
          ref={gameRef} 
          className="border-4 border-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-2xl bg-black"
          style={{ 
            width: '800px', 
            height: '600px',
            maxWidth: '100vw',
            maxHeight: '70vh'
          }}
        />
        
        {!gameLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <div className="animate-ping absolute top-2 left-2 h-12 w-12 rounded-full bg-blue-400 opacity-20"></div>
              </div>
              <p className="text-white font-semibold">Loading Game Assets...</p>
              <div className="mt-2">
                <div className="bg-gray-700 rounded-full h-2 w-48 mx-auto">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Instructions */}
      <div className="mt-8 max-w-4xl text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">🎮 How to Play</h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">⌨️</div>
            <h3 className="font-semibold text-blue-400 mb-3">Controls</h3>
            <p className="text-gray-300"><strong>Desktop:</strong> Press SPACEBAR to fly up</p>
            <p className="text-gray-300"><strong>Mobile:</strong> Tap screen to fly up</p>
            <p className="text-gray-300 mt-2">Release to let gravity pull you down</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-green-400 mb-3">Gameplay</h3>
            <p className="text-gray-300">• Avoid red obstacles falling from space</p>
            <p className="text-gray-300">• Answer questions when they appear</p>
            <p className="text-gray-300">• Fly into the correct answer zone</p>
            <p className="text-gray-300">• Each correct answer = 10 points!</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">❤️</div>
            <h3 className="font-semibold text-red-400 mb-3">Lives & Scoring</h3>
            <p className="text-gray-300">• You start with 3 lives</p>
            <p className="text-gray-300">• Lose 1 life for wrong answers</p>
            <p className="text-gray-300">• Lose 1 life for hitting obstacles</p>
            <p className="text-gray-300">• Get 70%+ to pass!</p>
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          📚 Ready to test your knowledge with <span className="text-blue-400 font-semibold">{QUESTIONS.length} questions</span>?
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          ← Back to Home
        </button>
        
        {gameLoaded && (
          <button 
            onClick={() => phaserGameRef.current?.scene.restart('GameScene')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🔄 Restart Game
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-xs">
        <p>Best played on desktop • Mobile friendly • Made with Phaser & Next.js</p>
      </div>
    </div>
  );
}