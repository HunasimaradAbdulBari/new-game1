'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { QUESTIONS } from './questions.js';

export default function QuestGamePage() {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use useCallback with proper dependencies and client-side checks
  const handleHomeClick = useCallback(() => {
    if (typeof window !== 'undefined' && mounted) {
      window.location.href = '/';
    }
  }, [mounted]);

  const handleRestartClick = useCallback(() => {
    if (phaserGameRef.current && mounted) {
      try {
        const scene = phaserGameRef.current.scene.getScene('GameScene');
        if (scene) {
          scene.scene.restart({ questions: QUESTIONS });
        }
      } catch (error) {
        console.error('Error restarting game:', error);
      }
    }
  }, [mounted]);

  const handleReloadClick = useCallback(() => {
    if (typeof window !== 'undefined' && mounted) {
      window.location.reload();
    }
  }, [mounted]);

  useEffect(() => {
    // Only run on client side after mount
    if (!mounted || typeof window === 'undefined') return;

    // Prevent multiple game instances
    if (phaserGameRef.current) return;

    const initGame = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const [PhaserModule, { GameScene }] = await Promise.all([
          import('phaser'),
          import('../../components/Quest/scenes/GameScene.js')
        ]);
        
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
              gravity: { y: 0 },
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
          }
        };

        // Create Phaser game instance
        const game = new PhaserModule.default.Game(config);
        phaserGameRef.current = game;

        // Wait for scene to be ready before initializing
        game.events.on('ready', () => {
          const scene = game.scene.getScene('GameScene');
          if (scene && scene.scene) {
            scene.scene.restart({ questions: QUESTIONS });
          }
          setGameLoaded(true);
        });

        // Fallback timer in case 'ready' event doesn't fire
        setTimeout(() => {
          if (!gameLoaded) {
            const scene = game.scene.getScene('GameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
          }
        }, 2000);

      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(`Failed to load game: ${err.message || 'Unknown error'}. Please refresh the page.`);
      }
    };

    initGame();

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        try {
          phaserGameRef.current.destroy(true);
          phaserGameRef.current = null;
        } catch (error) {
          console.warn('Error destroying Phaser game:', error);
        }
      }
    };
  }, [mounted, gameLoaded]);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
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
            <span className="block sm:inline mt-2">{error}</span>
          </div>
          {/* Fixed button structure with proper event handling */}
          {mounted && (
            <>
              <button 
                type="button"
                onClick={handleReloadClick}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors mr-2"
              >
                🔄 Reload Page
              </button>
              <button 
                type="button"
                onClick={handleHomeClick}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                🏠 Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Game Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
          🚀 Quest Flight
        </h1>
        <p className="text-gray-300 text-lg">Navigate through space, dodge obstacles, and answer questions!</p>
      </div>

      {/* Game Container */}
      <div className="relative">
        <div 
          ref={gameRef} 
          className="border-4 border-blue-500 rounded-lg overflow-hidden shadow-2xl bg-black"
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
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white font-semibold">Loading Game...</p>
              <p className="text-gray-400 text-sm mt-2">Initializing Phaser...</p>
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
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-green-400 mb-3">Gameplay</h3>
            <p className="text-gray-300">• Avoid red obstacles</p>
            <p className="text-gray-300">• Answer questions correctly</p>
            <p className="text-gray-300">• Fly into correct answer zone</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">❤️</div>
            <h3 className="font-semibold text-red-400 mb-3">Lives</h3>
            <p className="text-gray-300">• Start with 3 lives</p>
            <p className="text-gray-300">• Wrong answers cost lives</p>
            <p className="text-gray-300">• Need 70%+ to pass</p>
          </div>
        </div>
      </div>

      {/* Navigation - Only render when mounted */}
      {mounted && (
        <div className="mt-8 flex gap-4">
          <button 
            type="button"
            onClick={handleHomeClick}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Home
          </button>
          
          {gameLoaded && (
            <button 
              type="button"
              onClick={handleRestartClick}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 Restart
            </button>
          )}
        </div>
      )}
    </div>
  );
}