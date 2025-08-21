'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../../../components/Quest/scenes/GameScene.js';

// Questions JSON data embedded in the page
const QUESTIONS = [
  {
    "question": "Which of the following is a feature of Core Java?",
    "answers": ["Platform Dependent", "Object-Oriented", "No Memory Management"],
    "correctAnswer": "Object-Oriented"
  },
  {
    "question": "Which keyword is used to inherit a class in Java?",
    "answers": ["this", "super", "extends"],
    "correctAnswer": "extends"
  },
  {
    "question": "What is the SI unit of force?",
    "answers": ["Newton", "Joule", "Watt"],
    "correctAnswer": "Newton"
  },
  {
    "question": "Which process do green plants use to make food using sunlight?",
    "answers": ["Photosynthesis", "Respiration", "Transpiration"],
    "correctAnswer": "Photosynthesis"
  },
  {
    "question": "What is the pH value of pure neutral water at 25°C?",
    "answers": ["7", "0", "14"],
    "correctAnswer": "7"
  },
  {
    "question": "Which formula gives the area of a circle?",
    "answers": ["πr^2", "2πr", "πd"],
    "correctAnswer": "πr^2"
  },
  {
    "question": "What does CPU stand for in computer science?",
    "answers": ["Central Processing Unit", "Central Program Unit", "Control Processing Unit"],
    "correctAnswer": "Central Processing Unit"
  },
  {
    "question": "Which is the largest ocean on Earth?",
    "answers": ["Indian Ocean", "Atlantic Ocean", "Pacific Ocean"],
    "correctAnswer": "Pacific Ocean"
  },
  {
    "question": "Who led the Salt March in India in 1930?",
    "answers": ["Jawaharlal Nehru", "Subhas Chandra Bose", "Mahatma Gandhi"],
    "correctAnswer": "Mahatma Gandhi"
  },
  {
    "question": "Which of the following words is a pronoun?",
    "answers": ["They", "Run", "Beautiful"],
    "correctAnswer": "They"
  }
];

export default function QuestGamePage() {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Prevent multiple game instances
    if (phaserGameRef.current) return;

    try {
      // Phaser game configuration
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        backgroundColor: '#87CEEB',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 }, // We'll handle gravity manually
            debug: false
          }
        },
        scene: GameScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
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
      const game = new Phaser.Game(config);
      phaserGameRef.current = game;

      // Pass questions to the game scene
      game.scene.start('GameScene', { questions: QUESTIONS });

      setGameLoaded(true);

    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError('Failed to load game. Please refresh the page.');
    }

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Game Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Game Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Quest Flight</h1>
        <p className="text-gray-300">Fly through obstacles and answer questions to win!</p>
      </div>

      {/* Game Container */}
      <div className="relative">
        <div 
          ref={gameRef} 
          className="border-4 border-gray-700 rounded-lg overflow-hidden shadow-2xl"
          style={{ 
            width: '800px', 
            height: '600px',
            maxWidth: '100vw',
            maxHeight: '80vh'
          }}
        />
        
        {!gameLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading Game...</p>
            </div>
          </div>
        )}
      </div>

      {/* Game Instructions */}
      <div className="mt-6 max-w-2xl text-center">
        <h2 className="text-xl font-semibold text-white mb-3">How to Play</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">Controls</h3>
            <p><strong>Desktop:</strong> Press SPACEBAR to fly up</p>
            <p><strong>Mobile:</strong> Tap screen to fly up</p>
            <p>Release to let gravity pull you down</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">Gameplay</h3>
            <p>• Avoid red obstacles</p>
            <p>• Answer questions when they appear</p>
            <p>• Fly into the correct answer</p>
            <p>• You have 3 lives - don't waste them!</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6">
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}