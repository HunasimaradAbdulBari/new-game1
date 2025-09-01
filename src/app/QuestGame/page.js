// src/app/QuestGame/page.js
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { QUESTIONS } from './questions.js';

export default function QuestGamePage() {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHomeClick = useCallback(() => {
    if (typeof window !== 'undefined' && mounted) {
      window.location.href = '/';
    }
  }, [mounted]);

  const handleRestartClick = useCallback(() => {
    if (phaserGameRef.current && mounted) {
      try {
        const scene = phaserGameRef.current.scene.getScene('JetpackGameScene');
        if (scene) {
          scene.scene.restart({ questions: QUESTIONS });
        }
      } catch (error) {
        console.error('Error restarting game:', error);
        setError('Failed to restart game. Please reload the page.');
      }
    }
  }, [mounted]);

  const handleReloadClick = useCallback(() => {
    if (typeof window !== 'undefined' && mounted) {
      window.location.reload();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (phaserGameRef.current) return;

    const initGame = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🚀 Starting ENHANCED UI Jetpack game...');

        await loadPhaserFromCDN();
        console.log('✅ Phaser loaded successfully');

        const EnhancedJetpackScene = createEnhancedJetpackScene();
        console.log('✅ Enhanced UI scene created');

        const config = {
          type: window.Phaser.AUTO,
          width: 1400,
          height: 700,
          parent: gameRef.current,
          backgroundColor: '#0a0a0f',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 800 },
              debug: false
            }
          },
          scene: EnhancedJetpackScene,
          scale: {
            mode: window.Phaser.Scale.FIT,
            autoCenter: window.Phaser.Scale.CENTER_BOTH,
            min: { width: 800, height: 500 },
            max: { width: 1920, height: 1080 }
          }
        };

        const game = new window.Phaser.Game(config);
        phaserGameRef.current = game;
        console.log('✅ Enhanced UI Phaser game created');

        setTimeout(() => {
          try {
            const scene = game.scene.getScene('JetpackGameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
            console.log('🎯 Enhanced UI game loaded successfully!');
          } catch (err) {
            console.error('Error initializing scene:', err);
            setError('Failed to initialize game scene. Please try reloading.');
            setIsLoading(false);
          }
        }, 1000);

      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(`Failed to load game: ${err.message || 'Unknown error'}. Please refresh the page.`);
        setIsLoading(false);
      }
    };

    initGame();

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
  }, [mounted]);

  // Function to load Phaser from CDN
  const loadPhaserFromCDN = () => {
    return new Promise((resolve, reject) => {
      if (window.Phaser) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
      script.async = true;
      script.onload = () => {
        console.log('Phaser loaded from CDN');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Phaser from CDN'));
      };
      document.head.appendChild(script);
    });
  };

  // 🔥 ENHANCED UI JETPACK GAME SCENE WITH CONTINUOUS MOVEMENT
  const createEnhancedJetpackScene = () => {
    class JetpackGameScene extends window.Phaser.Scene {
      constructor() {
        super({ key: 'JetpackGameScene' });
        
        // Game state
        this.lives = 3;
        this.score = 0;
        this.distance = 0;
        this.questionIndex = 0;
        this.obstaclesPassed = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.gameState = 'PLAYING';
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;

        // Jetpack specific
        this.jetpackActive = false;
        this.jetpackFuel = 100;
        this.scrollSpeed = 200;
        // 🔥 NEW: Movement speeds for different states
        this.normalScrollSpeed = 200;
        this.questionScrollSpeed = 200 / 1.1; // 1.1x slower during questions

        // Game objects
        this.player = null;
        this.obstacles = null;
        this.background = null;
        this.backgroundVideo = null;
        this.jetpackParticles = [];
        this.coins = null;
        this.answerZones = null;

        // UI elements
        this.livesText = null;
        this.scoreText = null;
        this.distanceText = null;
        this.progressText = null;
        this.questionText = null;
        this.answerObjects = [];
        this.jetpackBar = null;

        // Input
        this.cursors = null;
        this.spaceKey = null;
        this.obstacleTimer = null;
        this.coinTimer = null;

        // Game data
        this.questions = [];
        this.currentQuestionElements = [];
        this.currentInstructionText = null;
      }

      init(data) {
        this.questions = data?.questions || QUESTIONS;
        
        // Reset all game state
        this.lives = 3;
        this.score = 0;
        this.distance = 0;
        this.questionIndex = 0;
        this.obstaclesPassed = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.gameState = 'PLAYING';
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;
        this.jetpackActive = false;
        this.jetpackFuel = 100;
        this.jetpackParticles = [];
        this.answerObjects = [];
        this.currentQuestionElements = [];
        this.currentInstructionText = null;
        this.scrollSpeed = this.normalScrollSpeed;
      }

      preload() {
        this.createEnhancedJetpackAssets();
        
        try {
          this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
          console.log('Loading custom bg.mp4...');
        } catch (error) {
          console.log('Custom bg.mp4 not found, will use fallback');
        }
      }

      createEnhancedJetpackAssets() {
        // Enhanced jetpack character with better details
        const playerGraphics = this.add.graphics();
        
        // Character body with gradient effect
        playerGraphics.fillStyle(0x0077ee);
        playerGraphics.fillRoundedRect(10, 18, 28, 35, 5);
        playerGraphics.fillStyle(0x0055bb);
        playerGraphics.fillRoundedRect(12, 20, 24, 6, 3);
        
        // Character head with better shading
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(24, 14, 12);
        playerGraphics.fillStyle(0xeeaa77);
        playerGraphics.fillEllipse(24, 16, 10, 8);
        
        // Enhanced helmet with better visor
        playerGraphics.fillStyle(0x444444);
        playerGraphics.fillRoundedRect(14, 6, 20, 10, 3);
        playerGraphics.fillStyle(0x77ddff, 0.9);
        playerGraphics.fillEllipse(19, 10, 5, 4);
        playerGraphics.fillEllipse(29, 10, 5, 4);
        playerGraphics.fillStyle(0xffffff, 0.6);
        playerGraphics.fillEllipse(18, 9, 2, 1);
        playerGraphics.fillEllipse(28, 9, 2, 1);
        
        // Enhanced jetpack with more detail
        playerGraphics.fillStyle(0x777777);
        playerGraphics.fillRoundedRect(5, 22, 12, 26, 4);
        playerGraphics.fillRoundedRect(31, 22, 12, 26, 4);
        
        // Jetpack fuel tanks with better design
        playerGraphics.fillStyle(0x999999);
        playerGraphics.fillRoundedRect(6, 24, 10, 22, 3);
        playerGraphics.fillRoundedRect(32, 24, 10, 22, 3);
        
        // Jetpack details and lights
        playerGraphics.fillStyle(0xffbb00);
        playerGraphics.fillRect(7, 26, 8, 4);
        playerGraphics.fillRect(33, 26, 8, 4);
        playerGraphics.fillStyle(0xff7700);
        playerGraphics.fillRect(8, 32, 6, 3);
        playerGraphics.fillRect(34, 32, 6, 3);
        
        // Status lights
        playerGraphics.fillStyle(0x00ff44);
        playerGraphics.fillCircle(11, 38, 2);
        playerGraphics.fillCircle(37, 38, 2);
        
        // Enhanced arms with better gloves
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(6, 28, 5);
        playerGraphics.fillCircle(42, 28, 5);
        playerGraphics.fillStyle(0x555555);
        playerGraphics.fillCircle(6, 28, 3);
        playerGraphics.fillCircle(42, 28, 3);
        
        // Enhanced legs with better boots
        playerGraphics.fillStyle(0x0077ee);
        playerGraphics.fillRoundedRect(15, 48, 8, 18, 3);
        playerGraphics.fillRoundedRect(25, 48, 8, 18, 3);
        
        // Enhanced boots with treads
        playerGraphics.fillStyle(0x333333);
        playerGraphics.fillRoundedRect(13, 62, 12, 8, 4);
        playerGraphics.fillRoundedRect(23, 62, 12, 8, 4);
        
        // Boot treads
        playerGraphics.fillStyle(0x555555);
        playerGraphics.fillRect(14, 66, 10, 2);
        playerGraphics.fillRect(24, 66, 10, 2);
        
        playerGraphics.generateTexture('enhanced-jetpack-player', 48, 70);
        playerGraphics.destroy();

        this.createEnhancedObstacles();

        // Enhanced coin with better animation potential
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xffdd00);
        coinGraphics.fillCircle(14, 14, 14);
        coinGraphics.fillStyle(0xffff44);
        coinGraphics.fillCircle(14, 14, 11);
        coinGraphics.fillStyle(0xffdd00);
        coinGraphics.fillRect(9, 11, 10, 6);
        coinGraphics.fillStyle(0xffaa00);
        coinGraphics.fillCircle(14, 14, 8);
        coinGraphics.fillStyle(0xffff88);
        coinGraphics.fillCircle(14, 12, 4);
        coinGraphics.fillStyle(0xffffff);
        coinGraphics.fillCircle(14, 10, 2);
        coinGraphics.generateTexture('enhanced-coin', 28, 28);
        coinGraphics.destroy();

        this.createEnhancedBackground();
      }

      createEnhancedObstacles() {
        // Enhanced laser obstacle with better effects
        const laserGraphics = this.add.graphics();
        laserGraphics.fillStyle(0xff0000, 0.95);
        laserGraphics.fillRect(0, 0, 20, 400);
        laserGraphics.fillStyle(0xff6666, 0.8);
        laserGraphics.fillRect(3, 0, 14, 400);
        laserGraphics.fillStyle(0xffffff, 0.95);
        laserGraphics.fillRect(8, 0, 4, 400);
        
        // Enhanced pulse effect
        for (let i = 0; i < 400; i += 25) {
          laserGraphics.fillStyle(0xffaaaa, 0.6);
          laserGraphics.fillRect(6, i, 8, 15);
          laserGraphics.fillStyle(0xffffff, 0.8);
          laserGraphics.fillRect(9, i + 5, 2, 5);
        }
        laserGraphics.generateTexture('enhanced-laser-obstacle', 20, 400);
        laserGraphics.destroy();

        // Enhanced missile with better flame
        const missileGraphics = this.add.graphics();
        missileGraphics.fillStyle(0x777777);
        missileGraphics.fillEllipse(22, 12, 40, 20);
        missileGraphics.fillStyle(0xff5555);
        missileGraphics.fillTriangle(2, 12, 14, 7, 14, 17);
        missileGraphics.fillStyle(0x555555);
        missileGraphics.fillRect(28, 9, 12, 6);
        missileGraphics.fillStyle(0xffbb00);
        missileGraphics.fillTriangle(40, 12, 48, 8, 48, 16);
        
        // Enhanced flame trail
        missileGraphics.fillStyle(0xff7700, 0.9);
        missileGraphics.fillTriangle(48, 12, 58, 9, 58, 15);
        missileGraphics.fillStyle(0xffbb00, 0.7);
        missileGraphics.fillTriangle(58, 12, 65, 10, 65, 14);
        missileGraphics.fillStyle(0xffffff, 0.5);
        missileGraphics.fillTriangle(65, 12, 70, 11, 70, 13);
        
        // Missile details
        missileGraphics.fillStyle(0x333333);
        missileGraphics.fillRect(30, 10, 8, 4);
        missileGraphics.generateTexture('enhanced-missile-obstacle', 70, 22);
        missileGraphics.destroy();

        // Enhanced electric obstacle with better lightning
        const electricGraphics = this.add.graphics();
        electricGraphics.lineStyle(8, 0x00ffff, 1);
        for (let i = 0; i < 15; i++) {
          const x = i * 4;
          const y1 = Math.sin(i * 0.9) * 30 + 70;
          const y2 = Math.sin((i + 1) * 0.9) * 30 + 70;
          electricGraphics.lineBetween(x, y1, x + 4, y2);
        }
        electricGraphics.lineStyle(4, 0xffffff, 1);
        for (let i = 0; i < 15; i++) {
          const x = i * 4;
          const y1 = Math.sin(i * 0.9) * 30 + 70;
          const y2 = Math.sin((i + 1) * 0.9) * 30 + 70;
          electricGraphics.lineBetween(x, y1, x + 4, y2);
        }
        electricGraphics.lineStyle(2, 0xccffff, 1);
        for (let i = 0; i < 15; i++) {
          const x = i * 4;
          const y1 = Math.sin(i * 0.9) * 30 + 70;
          const y2 = Math.sin((i + 1) * 0.9) * 30 + 70;
          electricGraphics.lineBetween(x, y1, x + 4, y2);
        }
        
        // Enhanced sparks
        for (let i = 0; i < 12; i++) {
          electricGraphics.fillStyle(0xffffff);
          electricGraphics.fillCircle(Math.random() * 60, 40 + Math.random() * 60, 3);
          electricGraphics.fillStyle(0x88ffff);
          electricGraphics.fillCircle(Math.random() * 60, 40 + Math.random() * 60, 2);
        }
        electricGraphics.generateTexture('enhanced-electric-obstacle', 60, 140);
        electricGraphics.destroy();
      }

      createEnhancedBackground() {
        const bgGraphics = this.add.graphics();
        
        // Enhanced gradient background with better colors
        bgGraphics.fillGradientStyle(0x0a0a22, 0x1a1a44, 0x0f0f33, 0x2a2a55, 1);
        bgGraphics.fillRect(0, 0, 1400, 700);
        
        // Enhanced grid pattern
        bgGraphics.lineStyle(1, 0x4444aa, 0.5);
        for (let x = 0; x < 1400; x += 50) {
          bgGraphics.lineBetween(x, 0, x, 700);
        }
        for (let y = 0; y < 700; y += 50) {
          bgGraphics.lineBetween(0, y, 1400, y);
        }
        
        // Enhanced tech panels with better design
        bgGraphics.fillStyle(0x444499, 0.6);
        for (let i = 0; i < 8; i++) {
          const x = i * 175 + 50;
          bgGraphics.fillRoundedRect(x, 50, 100, 140, 10);
          bgGraphics.fillRoundedRect(x, 510, 100, 140, 10);
          
          // Panel details
          bgGraphics.fillStyle(0x5555bb, 0.4);
          bgGraphics.fillRect(x + 15, 65, 70, 10);
          bgGraphics.fillRect(x + 15, 525, 70, 10);
          bgGraphics.fillStyle(0x6666cc, 0.3);
          bgGraphics.fillRect(x + 20, 85, 60, 6);
          bgGraphics.fillRect(x + 20, 545, 60, 6);
          bgGraphics.fillStyle(0x444499, 0.6);
        }
        
        // Enhanced glowing elements
        bgGraphics.fillStyle(0x00ffdd, 0.4);
        for (let i = 0; i < 12; i++) {
          const x = i * 120 + 60;
          bgGraphics.fillCircle(x, 140, 30);
          bgGraphics.fillCircle(x, 560, 30);
        }
        
        // Enhanced warning stripes
        bgGraphics.fillStyle(0xffbb00, 0.8);
        for (let x = 0; x < 1400; x += 60) {
          bgGraphics.fillRect(x, 0, 30, 30);
          bgGraphics.fillRect(x + 30, 670, 30, 30);
        }
        bgGraphics.fillStyle(0x000000, 0.8);
        for (let x = 30; x < 1400; x += 60) {
          bgGraphics.fillRect(x, 0, 30, 30);
          bgGraphics.fillRect(x - 30, 670, 30, 30);
        }
        
        bgGraphics.generateTexture('enhanced-lab-background', 1400, 700);
        bgGraphics.destroy();
      }

      create() {
        console.log('🚀 Creating ENHANCED UI jetpack game scene...');
        
        this.physics.world.setBounds(0, 0, 1400, 700);

        // Create scrolling background
        this.createScrollingBackground();

        // Create enhanced player
        this.createEnhancedJetpackPlayer();

        // 🎯 CRITICAL: Create physics groups for collision detection
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Create UI
        this.createEnhancedJetpackUI();

        // Setup input
        this.setupJetpackInput();

        // 🔥 COLLISION SETUP - Only obstacles and coins use physics collision
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Start spawning
        this.startJetpackSpawning();

        console.log('✅ ENHANCED UI jetpack game scene created successfully!');
      }

      createScrollingBackground() {
        try {
          if (this.cache.video.exists('bgvideo')) {
            this.backgroundVideo = this.add.video(0, 0, 'bgvideo');
            this.backgroundVideo.setOrigin(0, 0);
            this.backgroundVideo.setDisplaySize(1400, 700);
            this.backgroundVideo.play(true);
            console.log('Using custom bg.mp4 background');
            
            this.backgroundOverlay = this.add.tileSprite(0, 0, 1400, 700, 'enhanced-lab-background');
            this.backgroundOverlay.setOrigin(0, 0);
            this.backgroundOverlay.setAlpha(0.4);
          } else {
            this.background = this.add.tileSprite(0, 0, 1400, 700, 'enhanced-lab-background');
            this.background.setOrigin(0, 0);
            console.log('Using fallback enhanced lab background');
          }
        } catch (error) {
          console.warn('Background creation error, using fallback');
          this.background = this.add.tileSprite(0, 0, 1400, 700, 'enhanced-lab-background');
          this.background.setOrigin(0, 0);
        }
      }

      createEnhancedJetpackPlayer() {
        this.player = this.physics.add.sprite(140, 350, 'enhanced-jetpack-player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setScale(1.1);
        this.player.setSize(35, 55);
        this.player.setGravityY(0);
        this.player.setTint(0xffffff);
      }

      createEnhancedJetpackUI() {
        // Enhanced Lives display with better styling
        this.livesText = this.add.text(25, 25, `❤️ Lives: ${this.lives}`, {
          fontSize: '26px',
          fill: '#ff5555',
          stroke: '#ffffff',
          strokeThickness: 3,
          fontWeight: 'bold',
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#000000',
            blur: 3,
            stroke: true,
            fill: true
          }
        });

        // Enhanced Score display
        this.scoreText = this.add.text(25, 60, `💰 Score: ${this.score}`, {
          fontSize: '26px',
          fill: '#55ff55',
          stroke: '#000000',
          strokeThickness: 3,
          fontWeight: 'bold',
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#000000',
            blur: 3,
            stroke: true,
            fill: true
          }
        });

        // Enhanced Distance display
        this.distanceText = this.add.text(25, 95, `🚀 Distance: ${this.distance}m`, {
          fontSize: '22px',
          fill: '#55aaff',
          stroke: '#ffffff',
          strokeThickness: 2,
          fontWeight: 'bold',
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 2,
            stroke: true,
            fill: true
          }
        });

        // Enhanced Progress indicator
        const totalQuestions = this.questions.length;
        this.progressText = this.add.text(25, 130, `📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`, {
          fontSize: '20px',
          fill: '#ffaa55',
          stroke: '#ffffff',
          strokeThickness: 2,
          fontWeight: 'bold',
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 2,
            stroke: true,
            fill: true
          }
        });

        this.createEnhancedJetpackFuelBar();

        // Enhanced instructions with better positioning
        this.add.text(1375, 25, '🚀 HOLD SPACE for JETPACK BOOST!', {
          fontSize: '20px',
          fill: '#ffff55',
          stroke: '#000000',
          strokeThickness: 3,
          fontWeight: 'bold',
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#000000',
            blur: 3,
            stroke: true,
            fill: true
          }
        }).setOrigin(1, 0);

        // Additional UI enhancement - Mini radar/compass
        this.miniRadar = this.add.graphics();
        this.miniRadar.fillStyle(0x333333, 0.8);
        this.miniRadar.fillCircle(1300, 120, 30);
        this.miniRadar.lineStyle(2, 0x00ff44, 1);
        this.miniRadar.strokeCircle(1300, 120, 30);
        this.miniRadar.fillStyle(0x00ff44);
        this.miniRadar.fillCircle(1300, 120, 3);
      }

      createEnhancedJetpackFuelBar() {
        // Enhanced fuel bar with better design
        this.fuelBarBg = this.add.rectangle(1200, 90, 160, 30, 0x444444);
        this.fuelBarBg.setStrokeStyle(4, 0xffffff);
        
        this.fuelBarGlow = this.add.rectangle(1200, 90, 170, 40, 0x55ff55, 0.3);
        
        this.fuelBar = this.add.rectangle(1200, 90, 150, 25, 0x00ff55);
        
        // Enhanced fuel text
        this.fuelText = this.add.text(1200, 125, 'JETPACK FUEL', {
          fontSize: '16px',
          fill: '#ffffff',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: '#000000',
            blur: 1,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5, 0);

        // Fuel percentage text
        this.fuelPercentText = this.add.text(1200, 90, '100%', {
          fontSize: '14px',
          fill: '#000000',
          fontWeight: 'bold'
        }).setOrigin(0.5);
      }

      setupJetpackInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(window.Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.on('pointerdown', (pointer) => {
          this.jetpackActive = true;
          this.createTouchFeedback(pointer.x, pointer.y);
        });

        this.input.on('pointerup', (pointer) => {
          this.jetpackActive = false;
        });
      }

      createTouchFeedback(x, y) {
        const ripple = this.add.circle(x, y, 10, 0x55ff55, 0.9);
        this.tweens.add({
          targets: ripple,
          radius: 50,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => ripple.destroy()
        });
      }

      startJetpackSpawning() {
        this.obstacleTimer = this.time.addEvent({
          delay: 2200,
          callback: this.spawnEnhancedObstacle,
          callbackScope: this,
          loop: true
        });

        this.coinTimer = this.time.addEvent({
          delay: 1800,
          callback: this.spawnEnhancedCoin,
          callbackScope: this,
          loop: true
        });
      }

      spawnEnhancedObstacle() {
        if (this.gameState !== 'PLAYING') return;

        const obstacleTypes = ['enhanced-laser-obstacle', 'enhanced-missile-obstacle', 'enhanced-electric-obstacle'];
        const randomType = window.Phaser.Math.RND.pick(obstacleTypes);
        let obstacle;
        let yPos = window.Phaser.Math.Between(140, 560);

        if (randomType === 'enhanced-laser-obstacle') {
          yPos = window.Phaser.Math.Between(100, 300);
          obstacle = this.obstacles.create(1450, yPos, randomType);
          obstacle.setSize(18, 370);
        } else if (randomType === 'enhanced-missile-obstacle') {
          obstacle = this.obstacles.create(1450, yPos, randomType);
          obstacle.setSize(55, 18);
          obstacle.setAngularVelocity(150);
        } else {
          obstacle = this.obstacles.create(1450, yPos, randomType);
          obstacle.setSize(45, 120);
        }

        obstacle.setVelocityX(-this.scrollSpeed);
        obstacle.setTint(0xff9999);

        if (randomType === 'enhanced-missile-obstacle') {
          obstacle.setVelocityY(window.Phaser.Math.Between(-80, 80));
        }
      }

      spawnEnhancedCoin() {
        if (this.gameState !== 'PLAYING') return;

        const x = window.Phaser.Math.Between(1450, 1600);
        const y = window.Phaser.Math.Between(140, 560);
        const coin = this.coins.create(x, y, 'enhanced-coin');
        coin.setVelocityX(-this.scrollSpeed);
        coin.setScale(1.1);
        coin.setCircle(12);

        this.tweens.add({
          targets: coin,
          scaleX: 1.4,
          scaleY: 1.4,
          rotation: Math.PI * 2,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        coin.setTint(0xffffbb);
      }

      update() {
        // Enhanced jetpack input handling
        if (this.spaceKey.isDown || this.jetpackActive) {
          if (this.jetpackFuel > 0) {
            this.player.setVelocityY(-350);
            this.jetpackFuel = Math.max(0, this.jetpackFuel - 1.2);
            this.createEnhancedJetpackParticles();
            
            this.player.rotation = -0.25;
            this.player.setTint(0xbbddff);
          }
        } else {
          this.player.setVelocityY(this.player.body.velocity.y + 18);
          this.jetpackFuel = Math.min(100, this.jetpackFuel + 0.8);
          
          this.player.rotation = Math.min(0.4, this.player.body.velocity.y * 0.002);
          this.player.setTint(0xffffff);
        }

        this.updateEnhancedFuelBar();

        // 🔥 MODIFIED: Continue movement during questions but slower
        if (this.gameState === 'PLAYING') {
          this.scrollSpeed = this.normalScrollSpeed;
          this.scrollBackground();
          this.distance += 0.15;
        } else if (this.gameState === 'QUESTION_ACTIVE') {
          // 🚀 NEW: Continue movement during questions at 1.1x slower speed
          this.scrollSpeed = this.questionScrollSpeed;
          this.scrollBackground();
          this.distance += 0.15 / 1.1; // Slower distance accumulation
        }

        this.cleanupObjects();

        if (this.gameState === 'PLAYING') {
          this.checkQuestionTrigger();
        }

        this.updateEnhancedJetpackUI();
        this.updateParticles();

        // 🔄 UPDATE MOVING ANSWERS - Move them 1.3x faster (MODIFIED from 1.08x)
        if (this.gameState === 'QUESTION_ACTIVE') {
          this.updateMovingAnswers();
        }

        // 🔥 COLLISION CHECK - Manual detection every frame for moving answers
        if (this.gameState === 'QUESTION_ACTIVE') {
          this.checkAnswerCollisions();
        }
      }

      // 🎯 PERFECT ANSWER SELECTION with proper visual feedback
      selectAnswer(answerIndex) {
        console.log(`🚀 Selecting answer ${answerIndex}`);
        
        const answerObj = this.answerObjects[answerIndex];
        if (!answerObj || answerObj.answered) {
          console.log('Answer already selected or invalid');
          return;
        }
        
        const question = this.questions[this.questionIndex];
        const selectedAnswer = question.answers[answerIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;
        
        console.log(`Selected: "${selectedAnswer}", Correct: "${question.correctAnswer}", Is Correct: ${isCorrect}`);
        
        // Mark ALL answers as answered to prevent multiple selections
        this.answerObjects.forEach(obj => {
          obj.answered = true;
          if (obj.zone && obj.zone.body) {
            obj.zone.setVelocityX(0); // Stop all movement
          }
        });
        
        if (isCorrect) {
          console.log('✅ CORRECT ANSWER!');
          
          // 🟢 CORRECT ANSWER - GREEN HIGHLIGHT
          answerObj.bg.setFillStyle(0x00ff55); // Bright Green
          answerObj.glow.setFillStyle(0x55ff88); // Light Green Glow
          
          // SUCCESS EXPLOSION EFFECT
          this.createSuccessExplosion(answerObj.bg.x, answerObj.bg.y);
          
          // SUCCESS SCREEN FLASH - GREEN
          this.createSuccessFlash();
          
          // SCORE INCREASE
          this.score += 25;
          this.correctAnswers++;
          this.questionIndex++;
          
          // Show +25 score popup
          const scorePopup = this.add.text(answerObj.bg.x, answerObj.bg.y - 60, '+25', {
            fontSize: '44px',
            fill: '#00ff55',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 60,
            alpha: 0,
            scale: 1.6,
            duration: 1600,
            ease: 'Power2',
            onComplete: () => scorePopup.destroy()
          });
          
          // Hide question after 2 seconds
          this.time.delayedCall(2000, () => this.hideEnhancedQuestion());
          
        } else {
          console.log('❌ WRONG ANSWER!');
          
          // 🔴 WRONG ANSWER - RED HIGHLIGHT
          answerObj.bg.setFillStyle(0xff3333); // Bright Red
          answerObj.glow.setFillStyle(0xff7777); // Light Red Glow
          
          // 🟢 SHOW CORRECT ANSWER IN GREEN
          this.showCorrectAnswer(question.correctAnswer);
          
          // CAMERA SHAKE EFFECT
          this.cameras.main.shake(500, 0.025);
          
          // WRONG ANSWER SHAKE EFFECT
          this.tweens.add({
            targets: [answerObj.bg, answerObj.glow, answerObj.label, answerObj.text],
            x: '+=25',
            duration: 90,
            yoyo: true,
            repeat: 6,
            ease: 'Power2'
          });
          
          // LIFE DECREASE
          this.lives--;
          this.wrongAnswers++;
          
          console.log(`Lives remaining: ${this.lives}`);
          
          // DAMAGE FLASH - RED
          this.createDamageFlash();
          
          // Life lost text
          const damageText = this.add.text(this.player.x, this.player.y - 60, '-1 LIFE', {
            fontSize: '32px',
            fill: '#ff0000',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: damageText,
            y: damageText.y - 70,
            alpha: 0,
            duration: 1600,
            onComplete: () => damageText.destroy()
          });
          
          // Check if game over
          if (this.lives <= 0) {
            console.log('💀 GAME OVER - No lives remaining');
            this.gameState = 'GAME_OVER';
            this.time.delayedCall(2000, () => this.gameOver());
          } else {
            // Continue to next question
            this.time.delayedCall(2500, () => this.hideEnhancedQuestion());
          }
        }
      }

      // Show correct answer in GREEN when wrong answer is selected
      showCorrectAnswer(correctAnswer) {
        this.answerObjects.forEach((answerObj, index) => {
          const question = this.questions[this.questionIndex];
          if (question.answers[index] === correctAnswer) {
            // Highlight correct answer with green pulsing effect
            this.tweens.add({
              targets: [answerObj.bg, answerObj.glow],
              alpha: 0.9,
              duration: 350,
              yoyo: true,
              repeat: 3,
              onStart: () => {
                answerObj.bg.setFillStyle(0x00bb00); // Green
                answerObj.glow.setFillStyle(0x55bb55); // Light Green
              }
            });

            // Add checkmark to correct answer
            const checkmark = this.add.text(answerObj.bg.x + 170, answerObj.bg.y, '✓', {
              fontSize: '45px',
              fill: '#ffffff',
              fontWeight: 'bold',
              stroke: '#00bb00',
              strokeThickness: 4
            }).setOrigin(0.5);

            this.time.delayedCall(2500, () => {
              if (checkmark && checkmark.active) checkmark.destroy();
            });
          }
        });
      }

      createEnhancedJetpackParticles() {
        for (let i = 0; i < 6; i++) {
          const particle = this.add.circle(
            this.player.x - 25 + window.Phaser.Math.Between(-10, 10),
            this.player.y + 30,
            window.Phaser.Math.Between(4, 8),
            window.Phaser.Math.RND.pick([0xff7700, 0xff5500, 0xffbb00, 0xff9900]),
            0.9
          );

          this.jetpackParticles.push(particle);

          this.tweens.add({
            targets: particle,
            x: particle.x - window.Phaser.Math.Between(35, 70),
            y: particle.y + window.Phaser.Math.Between(20, 50),
            alpha: 0,
            scale: 0.1,
            duration: 550,
            ease: 'Power2',
            onComplete: () => {
              if (particle.active) {
                particle.destroy();
              }
              this.jetpackParticles = this.jetpackParticles.filter(p => p !== particle);
            }
          });
        }
      }

      updateEnhancedFuelBar() {
        const fuelPercent = this.jetpackFuel / 100;
        this.fuelBar.scaleX = fuelPercent;
        
        // Update percentage text
        this.fuelPercentText.setText(`${Math.round(this.jetpackFuel)}%`);

        if (fuelPercent > 0.6) {
          this.fuelBar.setFillStyle(0x00ff55);
          this.fuelBarGlow.setFillStyle(0x55ff55);
          this.fuelPercentText.setStyle({ fill: '#000000' });
        } else if (fuelPercent > 0.3) {
          this.fuelBar.setFillStyle(0xffbb00);
          this.fuelBarGlow.setFillStyle(0xffdd55);
          this.fuelPercentText.setStyle({ fill: '#000000' });
        } else {
          this.fuelBar.setFillStyle(0xff5555);
          this.fuelBarGlow.setFillStyle(0xff7777);
          this.fuelPercentText.setStyle({ fill: '#ffffff' });
          
          if (fuelPercent < 0.2) {
            this.fuelBarGlow.setAlpha(0.6 + Math.sin(this.time.now * 0.012) * 0.4);
          }
        }
      }

      scrollBackground() {
        if (this.background) {
          this.background.tilePositionX += this.scrollSpeed * 0.018;
        }
        if (this.backgroundOverlay) {
          this.backgroundOverlay.tilePositionX += this.scrollSpeed * 0.010;
        }
      }

      cleanupObjects() {
        this.obstacles.children.entries.forEach(obstacle => {
          if (obstacle.x < -180) {
            if (this.gameState === 'PLAYING') {
              this.obstaclesPassed++;
            }
            obstacle.destroy();
          }
        });

        this.coins.children.entries.forEach(coin => {
          if (coin.x < -100) {
            coin.destroy();
          }
        });
      }

      checkQuestionTrigger() {
        if (this.obstaclesPassed >= 4) {
          this.obstaclesPassed = 0;
          this.showEnhancedQuestion();
        }
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 8;

        const coinText = this.add.text(coin.x, coin.y, '+8', {
          fontSize: '22px',
          fill: '#ffdd00',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        });

        this.tweens.add({
          targets: coinText,
          y: coinText.y - 50,
          alpha: 0,
          scale: 1.6,
          duration: 1100,
          ease: 'Power2',
          onComplete: () => coinText.destroy()
        });

        this.createCoinSparkles(coin.x, coin.y);
      }

      createCoinSparkles(x, y) {
        const colors = [0xffff00, 0xffdd00, 0xffbb00];
        for (let i = 0; i < 8; i++) {
          const spark = this.add.circle(x, y, 4, colors[i % colors.length]);
          const angle = (i / 8) * Math.PI * 2;
          this.tweens.add({
            targets: spark,
            x: x + Math.cos(angle) * 35,
            y: y + Math.sin(angle) * 35,
            alpha: 0,
            duration: 700,
            onComplete: () => spark.destroy()
          });
        }
      }

      updateParticles() {
        this.jetpackParticles = this.jetpackParticles.filter(particle => particle && particle.active);
      }

      updateEnhancedJetpackUI() {
        this.livesText.setText(`❤️ Lives: ${this.lives}`);
        this.scoreText.setText(`💰 Score: ${this.score}`);
        this.distanceText.setText(`🚀 Distance: ${Math.floor(this.distance)}m`);
        
        if (this.progressText) {
          const totalQuestions = this.questions.length;
          this.progressText.setText(`📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`);
        }
      }

      showEnhancedQuestion() {
        if (this.questionIndex >= this.questions.length) {
          this.showResults();
          return;
        }

        const question = this.questions[this.questionIndex];
        if (!question) {
          this.showResults();
          return;
        }

        console.log(`🎯 Showing question ${this.questionIndex + 1}: "${question.question}"`);

        this.gameState = 'QUESTION_ACTIVE';

        // 🔥 MODIFIED: Don't pause timers completely, just slow them down
        this.obstacleTimer.paused = true;
        this.coinTimer.paused = true;

        // 🔥 MODIFIED: Don't stop obstacles completely, just slow them down
        this.obstacles.children.entries.forEach(obstacle => {
          obstacle.setVelocityX(-this.questionScrollSpeed); // Continue at slower speed
          this.tweens.add({
            targets: obstacle,
            alpha: 0.25,
            duration: 700
          });
        });

        this.coins.children.entries.forEach(coin => {
          coin.setVelocityX(-this.questionScrollSpeed); // Continue at slower speed
          this.tweens.add({
            targets: coin,
            alpha: 0.35,
            duration: 700
          });
        });

        this.showQuestionFromTop(question);

        this.time.delayedCall(1200, () => {
          this.showEnhancedCollisionAnswerZones(question);
        });
      }

      showQuestionFromTop(question) {
        const questionBg = this.add.rectangle(700, -70, 1100, 120, 0x000077, 0.96);
        questionBg.setStrokeStyle(5, 0x5588ff);

        const questionGlow = this.add.rectangle(700, -70, 1120, 140, 0x5588ff, 0.5);

        this.questionText = this.add.text(700, -70, question.question, {
          fontSize: '28px',
          fill: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
          wordWrap: { width: 1050 },
          stroke: '#000000',
          strokeThickness: 3,
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#000055',
            blur: 4,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);

        this.tweens.add({
          targets: [questionBg, questionGlow, this.questionText],
          y: 90,
          duration: 900,
          ease: 'Back.easeOut'
        });

        this.currentQuestionElements = [questionBg, questionGlow, this.questionText];
      }

      // 🔥 ENHANCED MOVING COLLISION ANSWER ZONES - 1.3x FASTER SPEED (MODIFIED from 1.08x)
      showEnhancedCollisionAnswerZones(question) {
        console.log('🎯 Creating ENHANCED MOVING collision answer zones with 1.3x speed...');
        
        this.clearAnswerObjects();
        
        const answerColors = [0x4285f4, 0x34a853, 0xfbbc04, 0xea4335]; // Blue, Green, Yellow, Red
        const answerLabels = ['A', 'B', 'C', 'D'];
        
        this.answerObjects = [];
        
        for (let i = 0; i < question.answers.length; i++) {
          const yPos = 220 + (i * 140); // Increased spacing for bigger screen
          const startX = 1600; // Start from further right for bigger screen
          
          // Enhanced visual elements with better size
          const answerBg = this.add.rectangle(startX, yPos, 400, 110, answerColors[i], 0.92);
          answerBg.setStrokeStyle(5, 0xffffff);
          
          const answerGlow = this.add.rectangle(startX, yPos, 420, 130, answerColors[i], 0.35);
          
          const answerLabel = this.add.text(startX - 160, yPos, answerLabels[i], {
            fontSize: '36px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
              offsetX: 3,
              offsetY: 3,
              color: '#000000',
              blur: 3,
              stroke: true,
              fill: true
            }
          }).setOrigin(0.5);
          
          const answerText = this.add.text(startX, yPos, question.answers[i], {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center',
            fontWeight: 'bold',
            wordWrap: { width: 350 },
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
              offsetX: 2,
              offsetY: 2,
              color: '#000000',
              blur: 2,
              stroke: true,
              fill: true
            }
          }).setOrigin(0.5);
          
          const answerObj = {
            bg: answerBg,
            glow: answerGlow,
            label: answerLabel,
            text: answerText,
            originalColor: answerColors[i],
            answered: false,
            answerIndex: i,
            answerText: question.answers[i],
            // Current position for movement
            currentX: startX,
            currentY: yPos,
            // 🚀 ENHANCED MOVEMENT PROPERTIES - 1.3x FASTER (MODIFIED from 1.08x)
            moveSpeed: -39, // Original was -30, now -30 * 1.3 = -39
            isMoving: false
          };
          
          this.answerObjects.push(answerObj);
          
          // Start with invisible, then fade in
          answerBg.setAlpha(0);
          answerGlow.setAlpha(0);
          answerLabel.setAlpha(0);
          answerText.setAlpha(0);
          
          // Enhanced fade in animation
          this.tweens.add({
            targets: [answerBg, answerGlow, answerLabel, answerText],
            alpha: 1,
            duration: 600,
            delay: i * 180,
            ease: 'Power2.easeOut',
            onComplete: () => {
              // Start moving after fade in
              answerObj.isMoving = true;
              console.log(`📍 Answer zone ${i} now moving left at ${answerObj.moveSpeed} pixels/second (1.3x faster)`);
            }
          });
          
          console.log(`🎯 Created enhanced moving answer zone ${i} starting at x=${startX} for: "${question.answers[i]}"`);
        }
        
        // Show instruction
        this.time.delayedCall(900, () => {
          this.showQuestionInstruction();
        });
        
        console.log('✅ All enhanced answer zones ready for FASTER collision!');
      }

      // 🔄 UPDATE MOVING ANSWER POSITIONS - Called every frame with 1.3x speed (MODIFIED from 1.08x)
      updateMovingAnswers() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.answerObjects) return;
        
        const deltaTime = this.game.loop.delta / 1000; // Convert to seconds
        
        for (let i = 0; i < this.answerObjects.length; i++) {
          const answerObj = this.answerObjects[i];
          
          if (!answerObj.isMoving || answerObj.answered) continue;
          
          // Update position with 1.3x speed (MODIFIED from 1.08x)
          answerObj.currentX += answerObj.moveSpeed * deltaTime;
          
          // Update all visual elements
          answerObj.bg.x = answerObj.currentX;
          answerObj.glow.x = answerObj.currentX;
          answerObj.label.x = answerObj.currentX - 160;
          answerObj.text.x = answerObj.currentX;
          
          // Remove if moved too far left (optional cleanup)
          if (answerObj.currentX < -250) {
            answerObj.isMoving = false;
            console.log(`🗑️ Answer zone ${i} moved off screen`);
          }
        }
      }

      // 🎯 ENHANCED COLLISION DETECTION for faster moving answers
      checkAnswerCollisions() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.player || !this.answerObjects) return;
        
        const playerBounds = this.player.getBounds();
        
        for (let i = 0; i < this.answerObjects.length; i++) {
          const answerObj = this.answerObjects[i];
          
          if (answerObj.answered || !answerObj.isMoving) continue;
          
          // Calculate current bounds based on current position
          const bounds = {
            x: answerObj.currentX - 200, // left edge (adjusted for larger size)
            y: answerObj.currentY - 55,  // top edge  
            width: 400,                  // width (increased)
            height: 110                  // height (increased)
          };
          
          // Manual collision detection using bounding boxes
          if (playerBounds.x < bounds.x + bounds.width &&
              playerBounds.x + playerBounds.width > bounds.x &&
              playerBounds.y < bounds.y + bounds.height &&
              playerBounds.y + playerBounds.height > bounds.y) {
            
            console.log(`🎯 COLLISION! Player hit enhanced moving answer ${i}: "${answerObj.answerText}"`);
            console.log(`Player bounds: x=${Math.round(playerBounds.x)}, y=${Math.round(playerBounds.y)}, w=${Math.round(playerBounds.width)}, h=${Math.round(playerBounds.height)}`);
            console.log(`Answer bounds: x=${Math.round(bounds.x)}, y=${Math.round(bounds.y)}, w=${bounds.width}, h=${bounds.height}`);
            
            this.selectAnswer(i);
            return; // Exit after first collision
          }
        }
      }

      showQuestionInstruction() {
        const instruction = this.add.text(700, 580, '🚀 Fly your jetpack into the correct answer zone!', {
          fontSize: '22px',
          fill: '#ffff55',
          align: 'center',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#000000',
            blur: 4,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);

        this.tweens.add({
          targets: instruction,
          alpha: 0.8,
          scale: 0.96,
          duration: 1300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.currentInstructionText = instruction;
      }

      createSuccessExplosion(x, y) {
        const colors = [0x00ff55, 0x55ff55, 0x99ff99, 0xbbffbb, 0xffffff];
        for (let i = 0; i < 18; i++) {
          const particle = this.add.circle(x, y, window.Phaser.Math.Between(5, 10), colors[i % colors.length]);
          const angle = (i / 18) * Math.PI * 2;
          const distance = 90 + Math.random() * 60;
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.2,
            duration: 1300,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      createSuccessFlash() {
        const flash = this.add.rectangle(700, 350, 1400, 700, 0x00ff55, 0.35);
        flash.setDepth(1000);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 450,
          onComplete: () => flash.destroy()
        });
      }

      createDamageFlash() {
        const flash = this.add.rectangle(700, 350, 1400, 700, 0xff0000, 0.45);
        flash.setDepth(1000);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 550,
          onComplete: () => flash.destroy()
        });
      }

      hideEnhancedQuestion() {
        console.log('🔄 Hiding enhanced question UI');

        if (this.currentQuestionElements && this.currentQuestionElements.length > 0) {
          this.currentQuestionElements.forEach(element => {
            if (element && element.active) {
              this.tweens.add({
                targets: element,
                y: -180,
                alpha: 0,
                duration: 700,
                onComplete: () => {
                  if (element && element.active) {
                    element.destroy();
                  }
                }
              });
            }
          });
          this.currentQuestionElements = [];
        }

        // 🔧 FIX: Check if instruction text exists before destroying
        if (this.currentInstructionText && this.currentInstructionText.active) {
          this.tweens.add({
            targets: this.currentInstructionText,
            alpha: 0,
            duration: 450,
            onComplete: () => {
              if (this.currentInstructionText && this.currentInstructionText.active) {
                this.currentInstructionText.destroy();
              }
              this.currentInstructionText = null;
            }
          });
        } else {
          // Reset to null if it doesn't exist
          this.currentInstructionText = null;
        }

        this.clearAnswerObjects();

        if (this.questionIndex >= this.questions.length) {
          this.time.delayedCall(900, () => this.showResults());
          return;
        }

        this.time.delayedCall(1100, () => {
          console.log('🚀 Resuming enhanced game after question');
          this.gameState = 'PLAYING';
          this.obstacleTimer.paused = false;
          this.coinTimer.paused = false;

          this.obstacles.children.entries.forEach(obstacle => {
            obstacle.setVelocityX(-this.scrollSpeed);
            this.tweens.add({
              targets: obstacle,
              alpha: 1,
              duration: 550
            });
          });

          this.coins.children.entries.forEach(coin => {
            coin.setVelocityX(-this.scrollSpeed);
            this.tweens.add({
              targets: coin,
              alpha: 1,
              duration: 550
            });
          });
        });
      }

      clearAnswerObjects() {
        console.log('🧹 Clearing enhanced answer objects');
        
        // 🔧 FIX: Safely destroy visual elements with existence checks
        if (this.answerObjects && this.answerObjects.length > 0) {
          this.answerObjects.forEach(answerObj => {
            if (answerObj.bg && answerObj.bg.active) answerObj.bg.destroy();
            if (answerObj.glow && answerObj.glow.active) answerObj.glow.destroy();
            if (answerObj.label && answerObj.label.active) answerObj.label.destroy();
            if (answerObj.text && answerObj.text.active) answerObj.text.destroy();
          });
        }
        
        this.answerObjects = [];
      }

      hitObstacle(player, obstacle) {
        if (this.isInvulnerable || this.gameState !== 'PLAYING') return;

        console.log('💥 Player hit obstacle');
        
        obstacle.destroy();
        this.cameras.main.shake(450, 0.045);
        
        this.lives--;
        this.wrongAnswers++;
        console.log(`Lives remaining after obstacle hit: ${this.lives}`);

        this.isInvulnerable = true;
        this.player.setTint(0xff0000);

        this.tweens.add({
          targets: this.player,
          alpha: 0.1,
          duration: 160,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            this.player.clearTint();
            this.player.setAlpha(1);
          }
        });

        this.createHitExplosion(player.x, player.y);

        const damageText = this.add.text(this.player.x, this.player.y - 60, '-1 LIFE', {
          fontSize: '32px',
          fill: '#ff0000',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 4,
          shadow: {
            offsetX: 4,
            offsetY: 4,
            color: '#000000',
            blur: 4,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);

        this.tweens.add({
          targets: damageText,
          y: damageText.y - 70,
          alpha: 0,
          duration: 1600,
          onComplete: () => damageText.destroy()
        });

        if (this.invulnerabilityTimer) {
          this.invulnerabilityTimer.destroy();
        }
        this.invulnerabilityTimer = this.time.delayedCall(1900, () => {
          this.isInvulnerable = false;
          this.invulnerabilityTimer = null;
        });

        if (this.lives <= 0) {
          console.log('💀 Game Over - No lives remaining after obstacle hit');
          this.gameState = 'GAME_OVER';
          this.time.delayedCall(1300, () => this.gameOver());
        }
      }

      createHitExplosion(x, y) {
        const colors = [0xff5555, 0xff9955, 0xffbb55, 0xffffff, 0xff7777];
        for (let i = 0; i < 15; i++) {
          const particle = this.add.circle(x, y, window.Phaser.Math.Between(5, 12), colors[i % colors.length]);
          const angle = (i / 15) * Math.PI * 2;
          const distance = 60 + Math.random() * 50;
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.1,
            duration: 900,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      gameOver() {
        this.gameState = 'GAME_OVER';
        console.log('💀 Enhanced Game Over screen showing');

        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();

        this.obstacles.children.entries.forEach(obstacle => {
          this.tweens.add({
            targets: obstacle,
            alpha: 0,
            scale: 0,
            duration: 900,
            onComplete: () => obstacle.destroy()
          });
        });

        this.coins.children.entries.forEach(coin => {
          this.tweens.add({
            targets: coin,
            alpha: 0,
            scale: 0,
            duration: 900,
            onComplete: () => coin.destroy()
          });
        });

        const gameOverContainer = this.add.container(700, 350);
        gameOverContainer.setDepth(3000);

        const overlay = this.add.rectangle(0, 0, 1400, 700, 0x000000, 0.96);

        const gameOverGlow = this.add.text(0, -140, 'MISSION FAILED!', {
          fontSize: '70px',
          fill: '#ff5555',
          fontWeight: 'bold',
          stroke: '#ffdddd',
          strokeThickness: 14
        }).setOrigin(0.5);

        const gameOverText = this.add.text(0, -140, 'MISSION FAILED!', {
          fontSize: '62px',
          fill: '#ffffff',
          fontWeight: 'bold',
          stroke: '#ff0000',
          strokeThickness: 6
        }).setOrigin(0.5);

        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const statsText = this.add.text(0, -50, `🎯 Final Score: ${this.score}\n🚀 Distance: ${Math.floor(this.distance)}m\n📊 Questions: ${this.questionIndex}/${this.questions.length}\n✅ Correct: ${this.correctAnswers} | ❌ Wrong: ${this.wrongAnswers}\n🎪 Accuracy: ${accuracy}%`, {
          fontSize: '24px',
          fill: '#ffffff',
          align: 'center',
          lineSpacing: 14,
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

        const restartBtn = this.add.text(0, 120, '🚀 Restart Mission', {
          fontSize: '32px',
          fill: '#55ff55',
          backgroundColor: '#003300',
          padding: { x: 40, y: 20 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();

        const homeBtn = this.add.text(0, 180, '🏠 Return to Base', {
          fontSize: '26px',
          fill: '#ffffff',
          backgroundColor: '#333377',
          padding: { x: 32, y: 16 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => {
          restartBtn.setScale(1.1);
          restartBtn.setStyle({ backgroundColor: '#005500' });
        });
        restartBtn.on('pointerout', () => {
          restartBtn.setScale(1);
          restartBtn.setStyle({ backgroundColor: '#003300' });
        });

        homeBtn.on('pointerover', () => {
          homeBtn.setScale(1.1);
          homeBtn.setStyle({ backgroundColor: '#555599' });
        });
        homeBtn.on('pointerout', () => {
          homeBtn.setScale(1);
          homeBtn.setStyle({ backgroundColor: '#333377' });
        });

        restartBtn.on('pointerdown', () => {
          this.scene.restart({ questions: this.questions });
        });

        homeBtn.on('pointerdown', () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        });

        gameOverContainer.add([overlay, gameOverGlow, gameOverText, statsText, restartBtn, homeBtn]);

        gameOverContainer.setScale(0.2);
        gameOverContainer.setAlpha(0);
        this.tweens.add({
          targets: gameOverContainer,
          scale: 1,
          alpha: 1,
          duration: 1100,
          ease: 'Back.easeOut'
        });
      }

      showResults() {
        this.gameState = 'RESULTS';
        console.log('🏆 Showing enhanced results');

        const totalQuestions = this.questionIndex;
        const percentage = totalQuestions > 0 ? Math.round((this.correctAnswers / totalQuestions) * 100) : 0;

        const results = {
          score: this.score,
          distance: Math.floor(this.distance),
          totalQuestions,
          correctAnswers: this.correctAnswers,
          wrongAnswers: this.wrongAnswers,
          livesUsed: 3 - this.lives,
          percentage,
          passed: percentage >= 70
        };

        console.log('Final enhanced results:', results);

        const transitionContainer = this.add.container(700, 350);
        transitionContainer.setDepth(4000);

        const overlay = this.add.rectangle(0, 0, 1400, 700, 0x000000, 0.92);

        const completedText = this.add.text(0, -70, '🎉 Mission Complete!', {
          fontSize: '54px',
          fill: results.passed ? '#55ff55' : '#ffbb55',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 5,
          shadow: {
            offsetX: 4,
            offsetY: 4,
            color: '#000000',
            blur: 5,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);

        const distanceText = this.add.text(0, -15, `Distance Traveled: ${results.distance}m`, {
          fontSize: '32px',
          fill: '#5599ff',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);

        const scoreText = this.add.text(0, 20, `Final Score: ${results.score} points`, {
          fontSize: '28px',
          fill: '#ffdd55',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

        const redirectText = this.add.text(0, 70, 'Preparing enhanced results summary...', {
          fontSize: '22px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

        transitionContainer.add([overlay, completedText, distanceText, scoreText, redirectText]);

        transitionContainer.setAlpha(0);
        this.tweens.add({
          targets: transitionContainer,
          alpha: 1,
          duration: 900,
          ease: 'Power2'
        });

        if (results.passed) {
          this.time.delayedCall(600, () => {
            this.createCelebrationParticles();
          });
        }

        this.time.delayedCall(3200, () => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('gameResults', JSON.stringify(results));
            window.location.href = '/QuestGame/result';
          }
        });
      }

      createCelebrationParticles() {
        const colors = [0xffff00, 0xff7700, 0xff0077, 0x7700ff, 0x0077ff, 0x00ff77];
        for (let i = 0; i < 35; i++) {
          const particle = this.add.circle(
            700 + window.Phaser.Math.Between(-250, 250),
            350 + window.Phaser.Math.Between(-180, 180),
            window.Phaser.Math.Between(5, 10),
            colors[i % colors.length]
          );

          this.tweens.add({
            targets: particle,
            y: particle.y - window.Phaser.Math.Between(120, 250),
            x: particle.x + window.Phaser.Math.Between(-60, 60),
            alpha: 0,
            duration: window.Phaser.Math.Between(1600, 2800),
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }
    }

    return JetpackGameScene;
  };

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-white text-2xl font-bold animate-pulse">
            Loading Enhanced UI Jetpack Game...
          </div>
          <div className="text-purple-300">
            🎯 Enhanced graphics and 1.3x faster answer movement!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          🎯 Enhanced Jetpack Quest
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={handleReloadClick}
            disabled={!mounted}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm md:text-base"
          >
            🔄 Reload
          </button>
          <button
            onClick={handleRestartClick}
            disabled={!mounted || !gameLoaded}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm md:text-base"
          >
            🚀 Restart
          </button>
          <button
            onClick={handleHomeClick}
            disabled={!mounted}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm md:text-base"
          >
            🏠 Home
          </button>
        </div>
      </div>

      {/* Enhanced Game Status Banner */}
      {isLoading && (
        <div className="bg-green-600/20 border border-green-600 rounded-lg p-3 mb-3">
          <div className="text-green-200 font-medium text-sm md:text-base">
            🔥 CONTINUOUS MOVEMENT + 1.3x FASTER ANSWERS - Jetpack moves during questions at 1.1x slower speed!
          </div>
          <div className="text-green-100 text-xs md:text-sm mt-1">
            ✅ Continuous horizontal movement | ✅ 1.3x faster answers | ✅ Slower movement during questions | ✅ Enhanced collision
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 mb-3">
          <div className="text-red-200 font-medium text-sm">❌ Error: {error}</div>
        </div>
      )}

      {/* Enhanced Game Container */}
      <div className="bg-black/40 backdrop-blur rounded-xl p-3 md:p-4 border border-purple-500/30">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-white text-lg md:text-xl mb-4 animate-pulse">
              Loading Enhanced Jetpack Game with Continuous Movement...
            </div>
            <div className="text-purple-300 mb-4 text-sm md:text-base">
              🎯 Initializing continuous movement and 1.3x faster answers...
            </div>
            <div className="w-48 md:w-64 mx-auto bg-purple-900/30 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Enhanced Game Canvas */}
        <div 
          ref={gameRef}
          className={`mx-auto border-2 border-purple-500/50 rounded-lg overflow-hidden ${isLoading ? 'hidden' : 'block'}`}
          style={{ maxWidth: '100%', width: '100%', height: 'auto' }}
        />

        {/* Enhanced Game Instructions */}
        {gameLoaded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs md:text-sm">
            <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3">
              <div className="text-blue-300 font-medium mb-1">🎮 Enhanced Controls</div>
              <div className="text-blue-100">**Hold SPACE** for boost</div>
              <div className="text-blue-100">Touch/Click also works</div>
            </div>
            
            <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-3">
              <div className="text-green-300 font-medium mb-1">⚡ Continuous Movement</div>
              <div className="text-green-100">🔥 Jetpack ALWAYS moves forward</div>
              <div className="text-green-100">🐌 1.1x slower during questions</div>
              <div className="text-green-100">🚀 Full speed during gameplay</div>
            </div>
            
            <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-3">
              <div className="text-yellow-300 font-medium mb-1">💰 Enhanced Rewards</div>
              <div className="text-yellow-100">Better sparkle effects (+8 pts)</div>
              <div className="text-yellow-100">Enhanced obstacle designs</div>
              <div className="text-yellow-100">Improved animations</div>
            </div>
            
            <div className="bg-purple-600/20 border border-purple-600/50 rounded-lg p-3">
              <div className="text-purple-300 font-medium mb-1">❓ FASTER Questions</div>
              <div className="text-purple-100">🔥 1.3x faster movement</div>
              <div className="text-purple-100">🟢 Green = Correct (+25 pts)</div>
              <div className="text-purple-100">🔴 Red = Wrong (-1 life)</div>
              <div className="text-purple-100">✅ Enhanced collision zones!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}