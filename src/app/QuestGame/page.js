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

        console.log('Starting Enhanced Jetpack game initialization...');

        await loadPhaserFromCDN();
        
        console.log('Phaser loaded, creating enhanced jetpack game scene...');

        const EnhancedJetpackGameScene = createEnhancedJetpackGameScene();
        
        console.log('EnhancedJetpackGameScene created, initializing Phaser game...');

        const config = {
          type: window.Phaser.AUTO,
          width: 1200,
          height: 600,
          parent: gameRef.current,
          backgroundColor: '#0a0a0f',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 800 },
              debug: false
            }
          },
          scene: EnhancedJetpackGameScene,
          scale: {
            mode: window.Phaser.Scale.FIT,
            autoCenter: window.Phaser.Scale.CENTER_BOTH,
            min: {
              width: 600,
              height: 300
            },
            max: {
              width: 1600,
              height: 800
            }
          }
        };

        const game = new window.Phaser.Game(config);
        phaserGameRef.current = game;

        console.log('Enhanced Jetpack Phaser game created successfully');

        setTimeout(() => {
          try {
            const scene = game.scene.getScene('JetpackGameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
            console.log('Enhanced jetpack game loaded successfully');
          } catch (err) {
            console.error('Error initializing scene:', err);
            setError('Failed to initialize game scene. Please try reloading.');
            setIsLoading(false);
          }
        }, 1000);

      } catch (err) {
        console.error('Failed to initialize enhanced jetpack game:', err);
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

  // Enhanced Jetpack Game Scene with improved UI
  const createEnhancedJetpackGameScene = () => {
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
        this.answerColliders = [];
        
        // Game data
        this.questions = [];
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
        this.answerColliders = [];
        this.jetpackActive = false;
        this.jetpackFuel = 100;
        this.jetpackParticles = [];
        this.answerObjects = [];
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
        // Enhanced jetpack character (more detailed and animated)
        const playerGraphics = this.add.graphics();
        
        // Character body (enhanced blue suit with details)
        playerGraphics.fillStyle(0x0066cc);
        playerGraphics.fillRoundedRect(8, 15, 24, 30, 4);
        
        // Character head (better proportions)
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(20, 12, 10);
        
        // Enhanced helmet with visor reflection
        playerGraphics.fillStyle(0x333333);
        playerGraphics.fillRoundedRect(12, 5, 16, 8, 2);
        playerGraphics.fillStyle(0x66ccff, 0.8);
        playerGraphics.fillEllipse(16, 8, 4, 3);
        playerGraphics.fillEllipse(24, 8, 4, 3);
        playerGraphics.fillStyle(0xffffff, 0.4);
        playerGraphics.fillEllipse(15, 7, 2, 1);
        playerGraphics.fillEllipse(23, 7, 2, 1);
        
        // Enhanced jetpack with more detail
        playerGraphics.fillStyle(0x666666);
        playerGraphics.fillRoundedRect(4, 18, 10, 22, 3);
        playerGraphics.fillRoundedRect(26, 18, 10, 22, 3);
        
        // Jetpack fuel tanks (metallic with highlights)
        playerGraphics.fillStyle(0x888888);
        playerGraphics.fillRoundedRect(5, 20, 8, 18, 2);
        playerGraphics.fillRoundedRect(27, 20, 8, 18, 2);
        
        // Jetpack details (enhanced yellow/orange highlights)
        playerGraphics.fillStyle(0xffaa00);
        playerGraphics.fillRect(6, 22, 6, 3);
        playerGraphics.fillRect(28, 22, 6, 3);
        playerGraphics.fillStyle(0xff6600);
        playerGraphics.fillRect(7, 26, 4, 2);
        playerGraphics.fillRect(29, 26, 4, 2);
        
        // Enhanced arms with gloves
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(4, 25, 4);
        playerGraphics.fillCircle(36, 25, 4);
        playerGraphics.fillStyle(0x444444);
        playerGraphics.fillCircle(4, 25, 2);
        playerGraphics.fillCircle(36, 25, 2);
        
        // Enhanced legs with better proportions
        playerGraphics.fillStyle(0x0066cc);
        playerGraphics.fillRoundedRect(12, 40, 7, 15, 2);
        playerGraphics.fillRoundedRect(21, 40, 7, 15, 2);
        
        // Enhanced boots with detail
        playerGraphics.fillStyle(0x222222);
        playerGraphics.fillRoundedRect(10, 52, 11, 6, 3);
        playerGraphics.fillRoundedRect(19, 52, 11, 6, 3);
        
        // Boot details
        playerGraphics.fillStyle(0x444444);
        playerGraphics.fillRect(11, 54, 9, 2);
        playerGraphics.fillRect(20, 54, 9, 2);
        
        playerGraphics.generateTexture('enhanced-jetpack-player', 40, 58);
        playerGraphics.destroy();
        
        // Create enhanced obstacle types
        this.createEnhancedObstacles();
        
        // Enhanced coin design
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xffdd00);
        coinGraphics.fillCircle(12, 12, 12);
        coinGraphics.fillStyle(0xffff44);
        coinGraphics.fillCircle(12, 12, 9);
        coinGraphics.fillStyle(0xffdd00);
        coinGraphics.fillRect(8, 10, 8, 4);
        coinGraphics.fillStyle(0xffaa00);
        coinGraphics.fillCircle(12, 12, 6);
        coinGraphics.fillStyle(0xffff88);
        coinGraphics.fillCircle(12, 10, 3);
        coinGraphics.generateTexture('enhanced-coin', 24, 24);
        coinGraphics.destroy();
        
        // Enhanced laboratory background
        this.createEnhancedBackground();
      }

      createEnhancedObstacles() {
        // Enhanced laser obstacle with animated effect
        const laserGraphics = this.add.graphics();
        laserGraphics.fillStyle(0xff0000, 0.9);
        laserGraphics.fillRect(0, 0, 18, 350);
        laserGraphics.fillStyle(0xff6666, 0.7);
        laserGraphics.fillRect(3, 0, 12, 350);
        laserGraphics.fillStyle(0xffffff, 0.9);
        laserGraphics.fillRect(7, 0, 4, 350);
        // Add energy pulse effect
        for (let i = 0; i < 350; i += 20) {
          laserGraphics.fillStyle(0xffaaaa, 0.5);
          laserGraphics.fillRect(5, i, 8, 10);
        }
        laserGraphics.generateTexture('enhanced-laser-obstacle', 18, 350);
        laserGraphics.destroy();
        
        // Enhanced missile with flame trail
        const missileGraphics = this.add.graphics();
        missileGraphics.fillStyle(0x666666);
        missileGraphics.fillEllipse(20, 10, 35, 18);
        missileGraphics.fillStyle(0xff4444);
        missileGraphics.fillTriangle(2, 10, 12, 6, 12, 14);
        missileGraphics.fillStyle(0x444444);
        missileGraphics.fillRect(25, 8, 10, 4);
        missileGraphics.fillStyle(0xffaa00);
        missileGraphics.fillTriangle(35, 10, 42, 7, 42, 13);
        // Add flame effect
        missileGraphics.fillStyle(0xff6600, 0.8);
        missileGraphics.fillTriangle(42, 10, 50, 8, 50, 12);
        missileGraphics.fillStyle(0xffaa00, 0.6);
        missileGraphics.fillTriangle(50, 10, 55, 9, 55, 11);
        missileGraphics.generateTexture('enhanced-missile-obstacle', 55, 18);
        missileGraphics.destroy();
        
        // Enhanced electric obstacle
        const electricGraphics = this.add.graphics();
        electricGraphics.lineStyle(6, 0x00ffff, 1);
        for (let i = 0; i < 12; i++) {
          const x = i * 4;
          const y1 = Math.sin(i * 0.8) * 25 + 60;
          const y2 = Math.sin((i + 1) * 0.8) * 25 + 60;
          electricGraphics.lineBetween(x, y1, x + 4, y2);
        }
        electricGraphics.lineStyle(3, 0xffffff, 1);
        for (let i = 0; i < 12; i++) {
          const x = i * 4;
          const y1 = Math.sin(i * 0.8) * 25 + 60;
          const y2 = Math.sin((i + 1) * 0.8) * 25 + 60;
          electricGraphics.lineBetween(x, y1, x + 4, y2);
        }
        // Add sparks
        for (let i = 0; i < 8; i++) {
          electricGraphics.fillStyle(0xffffff);
          electricGraphics.fillCircle(Math.random() * 48, 30 + Math.random() * 60, 2);
        }
        electricGraphics.generateTexture('enhanced-electric-obstacle', 48, 120);
        electricGraphics.destroy();
      }

      createEnhancedBackground() {
        const bgGraphics = this.add.graphics();
        
        // Enhanced gradient background
        bgGraphics.fillGradientStyle(0x0a0a1a, 0x1a1a3a, 0x0f0f2f, 0x2a2a4a, 1);
        bgGraphics.fillRect(0, 0, 1200, 600);
        
        // Add animated grid pattern
        bgGraphics.lineStyle(1, 0x333366, 0.4);
        for (let x = 0; x < 1200; x += 40) {
          bgGraphics.lineBetween(x, 0, x, 600);
        }
        for (let y = 0; y < 600; y += 40) {
          bgGraphics.lineBetween(0, y, 1200, y);
        }
        
        // Add tech panels with more detail
        bgGraphics.fillStyle(0x333366, 0.5);
        for (let i = 0; i < 6; i++) {
          const x = i * 200 + 40;
          bgGraphics.fillRoundedRect(x, 40, 90, 120, 8);
          bgGraphics.fillRoundedRect(x, 440, 90, 120, 8);
          
          // Add panel details
          bgGraphics.fillStyle(0x4444aa, 0.3);
          bgGraphics.fillRect(x + 10, 50, 70, 8);
          bgGraphics.fillRect(x + 10, 450, 70, 8);
          bgGraphics.fillStyle(0x333366, 0.5);
        }
        
        // Enhanced glowing elements
        bgGraphics.fillStyle(0x00ffcc, 0.3);
        for (let i = 0; i < 10; i++) {
          const x = i * 120;
          bgGraphics.fillCircle(x + 60, 120, 25);
          bgGraphics.fillCircle(x + 60, 480, 25);
        }
        
        // Enhanced warning stripes
        bgGraphics.fillStyle(0xffaa00, 0.7);
        for (let x = 0; x < 1200; x += 50) {
          bgGraphics.fillRect(x, 0, 25, 25);
          bgGraphics.fillRect(x + 25, 575, 25, 25);
        }
        bgGraphics.fillStyle(0x000000, 0.7);
        for (let x = 25; x < 1200; x += 50) {
          bgGraphics.fillRect(x, 0, 25, 25);
          bgGraphics.fillRect(x - 25, 575, 25, 25);
        }
        
        bgGraphics.generateTexture('enhanced-lab-background', 1200, 600);
        bgGraphics.destroy();
      }

      create() {
        console.log('Creating enhanced jetpack game scene...');
        
        this.physics.world.setBounds(0, 0, 1200, 600);
        
        // Create scrolling background
        this.createScrollingBackground();
        
        // Create enhanced player
        this.createEnhancedJetpackPlayer();
        
        // Create obstacle groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();
        this.answerZones = this.physics.add.group();
        
        // Create UI
        this.createEnhancedJetpackUI();
        
        // Setup input
        this.setupJetpackInput();
        
        // Setup collisions
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.answerZones, this.selectAnswerByCollision, null, this);
        
        // Start spawning
        this.startJetpackSpawning();
        
        console.log('Enhanced jetpack game scene created successfully');
      }

      createScrollingBackground() {
        try {
          if (this.cache.video.exists('bgvideo')) {
            this.backgroundVideo = this.add.video(0, 0, 'bgvideo');
            this.backgroundVideo.setOrigin(0, 0);
            this.backgroundVideo.setDisplaySize(1200, 600);
            this.backgroundVideo.play(true);
            console.log('Using custom bg.mp4 background');
            
            this.backgroundOverlay = this.add.tileSprite(0, 0, 1200, 600, 'enhanced-lab-background');
            this.backgroundOverlay.setOrigin(0, 0);
            this.backgroundOverlay.setAlpha(0.4);
          } else {
            this.background = this.add.tileSprite(0, 0, 1200, 600, 'enhanced-lab-background');
            this.background.setOrigin(0, 0);
            console.log('Using fallback enhanced lab background');
          }
        } catch (error) {
          console.warn('Background creation error, using fallback');
          this.background = this.add.tileSprite(0, 0, 1200, 600, 'enhanced-lab-background');
          this.background.setOrigin(0, 0);
        }
      }

      createEnhancedJetpackPlayer() {
        this.player = this.physics.add.sprite(120, 300, 'enhanced-jetpack-player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setScale(1.0);
        this.player.setSize(30, 45);
        this.player.setGravityY(0);
        
        // Add glow effect to player
        this.player.setTint(0xffffff);
      }

      createEnhancedJetpackUI() {
        // Enhanced Lives display
        this.livesText = this.add.text(20, 20, `❤️ Lives: ${this.lives}`, {
          fontSize: '22px',
          fill: '#ff4444',
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
        
        // Enhanced Score display
        this.scoreText = this.add.text(20, 50, `💰 Score: ${this.score}`, {
          fontSize: '22px',
          fill: '#44ff44',
          stroke: '#000000',
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

        // Enhanced Distance display
        this.distanceText = this.add.text(20, 80, `🚀 Distance: ${this.distance}m`, {
          fontSize: '20px',
          fill: '#44aaff',
          stroke: '#ffffff',
          strokeThickness: 1,
          fontWeight: 'bold',
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: '#000000',
            blur: 1,
            stroke: true,
            fill: true
          }
        });

        // Enhanced Progress indicator
        const totalQuestions = this.questions.length;
        this.progressText = this.add.text(20, 110, `📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`, {
          fontSize: '18px',
          fill: '#ffaa44',
          stroke: '#ffffff',
          strokeThickness: 1,
          fontWeight: 'bold',
          shadow: {
            offsetX: 1,
            offsetY: 1,
            color: '#000000',
            blur: 1,
            stroke: true,
            fill: true
          }
        });

        // Enhanced jetpack fuel bar
        this.createEnhancedJetpackFuelBar();

        // Enhanced instructions
        this.add.text(1180, 20, '🚀 HOLD SPACE for JETPACK BOOST!', {
          fontSize: '18px',
          fill: '#ffff44',
          stroke: '#000000',
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
        }).setOrigin(1, 0);
      }

      createEnhancedJetpackFuelBar() {
        // Enhanced fuel bar background with glow
        this.fuelBarBg = this.add.rectangle(1050, 80, 140, 25, 0x333333);
        this.fuelBarBg.setStrokeStyle(3, 0xffffff);
        
        // Add glow effect
        this.fuelBarGlow = this.add.rectangle(1050, 80, 145, 30, 0x44ff44, 0.2);
        
        // Enhanced fuel bar fill with gradient effect
        this.fuelBar = this.add.rectangle(1050, 80, 135, 20, 0x00ff44);
        
        // Fuel bar text
        this.fuelText = this.add.text(1050, 110, 'JETPACK FUEL', {
          fontSize: '14px',
          fill: '#ffffff',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 1
        }).setOrigin(0.5, 0);
      }

      setupJetpackInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(window.Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Enhanced touch/click input
        this.input.on('pointerdown', (pointer) => {
          this.jetpackActive = true;
          this.createTouchFeedback(pointer.x, pointer.y);
        });
        
        this.input.on('pointerup', (pointer) => {
          this.jetpackActive = false;
        });
      }

      createTouchFeedback(x, y) {
        const ripple = this.add.circle(x, y, 8, 0x44ff44, 0.8);
        this.tweens.add({
          targets: ripple,
          radius: 40,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => ripple.destroy()
        });
      }

      startJetpackSpawning() {
        // Spawn obstacles
        this.obstacleTimer = this.time.addEvent({
          delay: 2200,
          callback: this.spawnEnhancedObstacle,
          callbackScope: this,
          loop: true
        });

        // Spawn coins
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
        let yPos = window.Phaser.Math.Between(120, 480);
        
        if (randomType === 'enhanced-laser-obstacle') {
          yPos = window.Phaser.Math.Between(80, 250);
          obstacle = this.obstacles.create(1250, yPos, randomType);
          obstacle.setSize(15, 320);
        } else if (randomType === 'enhanced-missile-obstacle') {
          obstacle = this.obstacles.create(1250, yPos, randomType);
          obstacle.setSize(45, 15);
          obstacle.setAngularVelocity(150);
        } else {
          obstacle = this.obstacles.create(1250, yPos, randomType);
          obstacle.setSize(35, 100);
        }
        
        obstacle.setVelocityX(-this.scrollSpeed);
        obstacle.setTint(0xff8888);
        
        // Enhanced movement for missiles
        if (randomType === 'enhanced-missile-obstacle') {
          obstacle.setVelocityY(window.Phaser.Math.Between(-80, 80));
        }
      }

      spawnEnhancedCoin() {
        if (this.gameState !== 'PLAYING') return;
        
        const x = window.Phaser.Math.Between(1250, 1400);
        const y = window.Phaser.Math.Between(120, 480);
        const coin = this.coins.create(x, y, 'enhanced-coin');
        
        coin.setVelocityX(-this.scrollSpeed);
        coin.setScale(1.0);
        coin.setCircle(10);
        
        // Enhanced sparkle effect
        this.tweens.add({
          targets: coin,
          scaleX: 1.3,
          scaleY: 1.3,
          rotation: Math.PI * 2,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Add glow effect
        coin.setTint(0xffffaa);
      }

      update() {
        // Enhanced jetpack input handling
        if (this.spaceKey.isDown || this.jetpackActive) {
          if (this.jetpackFuel > 0 && this.gameState === 'PLAYING') {
            // Apply stronger upward thrust
            this.player.setVelocityY(-350);
            this.jetpackFuel = Math.max(0, this.jetpackFuel - 1.2);
            this.createEnhancedJetpackParticles();
            
            // Enhanced player animation
            this.player.rotation = -0.25;
            this.player.setTint(0xaaddff);
          }
        } else {
          // Enhanced gravity and fuel recharge
          this.player.setVelocityY(this.player.body.velocity.y + 18);
          this.jetpackFuel = Math.min(100, this.jetpackFuel + 0.8);
          
          // Enhanced player animation when falling
          this.player.rotation = Math.min(0.4, this.player.body.velocity.y * 0.002);
          this.player.setTint(0xffffff);
        }
        
        // Update enhanced fuel bar
        this.updateEnhancedFuelBar();
        
        // Scroll background
        this.scrollBackground();
        
        // Update distance
        this.distance += 0.15;
        
        // Clean up objects
        this.cleanupObjects();
        
        // Check for questions
        this.checkQuestionTrigger();
        
        // Update UI
        this.updateEnhancedJetpackUI();
        
        // Clean up particles
        this.updateParticles();
        
        // Update answer zones position if question is active
        if (this.gameState === 'QUESTION_ACTIVE') {
          this.updateAnswerZonesPosition();
        }
      }

      createEnhancedJetpackParticles() {
        // Create more realistic jetpack exhaust
        for (let i = 0; i < 5; i++) {
          const particle = this.add.circle(
            this.player.x - 20 + window.Phaser.Math.Between(-8, 8), 
            this.player.y + 25, 
            window.Phaser.Math.Between(3, 6), 
            window.Phaser.Math.RND.pick([0xff6600, 0xff4400, 0xffaa00, 0xff8800]),
            0.9
          );
          
          this.jetpackParticles.push(particle);
          
          this.tweens.add({
            targets: particle,
            x: particle.x - window.Phaser.Math.Between(30, 60),
            y: particle.y + window.Phaser.Math.Between(15, 40),
            alpha: 0,
            scale: 0.1,
            duration: 500,
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
        
        // Enhanced color coding with smooth transitions
        if (fuelPercent > 0.6) {
          this.fuelBar.setFillStyle(0x00ff44);
          this.fuelBarGlow.setFillStyle(0x44ff44);
        } else if (fuelPercent > 0.3) {
          this.fuelBar.setFillStyle(0xffaa00);
          this.fuelBarGlow.setFillStyle(0xffcc44);
        } else {
          this.fuelBar.setFillStyle(0xff4444);
          this.fuelBarGlow.setFillStyle(0xff6666);
          
          // Warning pulse when fuel is low
          if (fuelPercent < 0.2) {
            this.fuelBarGlow.setAlpha(0.5 + Math.sin(this.time.now * 0.01) * 0.3);
          }
        }
      }

      scrollBackground() {
        if (this.background) {
          this.background.tilePositionX += this.scrollSpeed * 0.015;
        }
        if (this.backgroundOverlay) {
          this.backgroundOverlay.tilePositionX += this.scrollSpeed * 0.008;
        }
      }

      cleanupObjects() {
        // Clean up obstacles
        this.obstacles.children.entries.forEach(obstacle => {
          if (obstacle.x < -150) {
            if (this.gameState === 'PLAYING') {
              this.obstaclesPassed++;
            }
            obstacle.destroy();
          }
        });

        // Clean up coins
        this.coins.children.entries.forEach(coin => {
          if (coin.x < -80) {
            coin.destroy();
          }
        });

        // Clean up answer zones
        this.answerZones.children.entries.forEach(zone => {
          if (zone.x < -200) {
            zone.destroy();
          }
        });
      }

      checkQuestionTrigger() {
        if (this.obstaclesPassed >= 4) { // Show question every 4 obstacles
          this.obstaclesPassed = 0;
          this.showEnhancedQuestion();
        }
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 8; // Increased coin value
        
        // Enhanced coin collect effect
        const coinText = this.add.text(coin.x, coin.y, '+8', {
          fontSize: '20px',
          fill: '#ffdd00',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        });
        
        this.tweens.add({
          targets: coinText,
          y: coinText.y - 40,
          alpha: 0,
          scale: 1.5,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => coinText.destroy()
        });
        
        // Create sparkle effect
        this.createCoinSparkles(coin.x, coin.y);
      }

      createCoinSparkles(x, y) {
        const colors = [0xffff00, 0xffdd00, 0xffaa00];
        for (let i = 0; i < 6; i++) {
          const spark = this.add.circle(x, y, 3, colors[i % colors.length]);
          const angle = (i / 6) * Math.PI * 2;
          
          this.tweens.add({
            targets: spark,
            x: x + Math.cos(angle) * 30,
            y: y + Math.sin(angle) * 30,
            alpha: 0,
            duration: 600,
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

      // ENHANCED QUESTION SYSTEM - Questions appear from top with answer zones coming from right
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
        
        this.gameState = 'QUESTION_ACTIVE';
        
        // Pause spawning
        this.obstacleTimer.paused = true;
        this.coinTimer.paused = true;
        
        // Fade existing obstacles and coins
        this.obstacles.children.entries.forEach(obstacle => {
          obstacle.setVelocity(0, 0);
          this.tweens.add({
            targets: obstacle,
            alpha: 0.2,
            duration: 600
          });
        });

        this.coins.children.entries.forEach(coin => {
          coin.setVelocity(0, 0);
          this.tweens.add({
            targets: coin,
            alpha: 0.3,
            duration: 600
          });
        });
        
        // Show question from top with enhanced animation
        this.showQuestionFromTop(question);
        
        // Show answer zones coming from right side
        this.time.delayedCall(800, () => {
          this.showAnswerZonesFromRight(question);
        });
      }

      showQuestionFromTop(question) {
        // Create question background
        const questionBg = this.add.rectangle(600, -60, 1000, 100, 0x000066, 0.95);
        questionBg.setStrokeStyle(4, 0x4488ff);
        
        // Add glow effect
        const questionGlow = this.add.rectangle(600, -60, 1010, 110, 0x4488ff, 0.4);
        
        // Create question text
        this.questionText = this.add.text(600, -60, question.question, {
          fontSize: '26px',
          fill: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
          wordWrap: { width: 950 },
          stroke: '#000000',
          strokeThickness: 2,
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000044',
            blur: 3,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);
        
        // Animate question sliding down from top
        this.tweens.add({
          targets: [questionBg, questionGlow, this.questionText],
          y: 80,
          duration: 800,
          ease: 'Back.easeOut'
        });
        
        // Store references for cleanup
        this.currentQuestionElements = [questionBg, questionGlow, this.questionText];
      }

      showAnswerZonesFromRight(question) {
        // Clear existing answer objects
        this.clearAnswerObjects();
        
        const answerColors = [0x4285f4, 0x34a853, 0xfbbc04, 0xea4335]; // Blue, Green, Yellow, Red
        const answerLabels = ['A', 'B', 'C', 'D'];
        
        this.answerObjects = [];
        
        for (let i = 0; i < question.answers.length; i++) {
          const yPos = 200 + (i * 120); // Vertical spacing for answers
          const startX = 1400; // Start from right side of screen
          const targetX = 900; // Target position on screen
          
          // Create answer zone background with enhanced design
          const answerBg = this.add.rectangle(startX, yPos, 350, 90, answerColors[i], 0.9);
          answerBg.setStrokeStyle(4, 0xffffff);
          
          // Add glow effect
          const answerGlow = this.add.rectangle(startX, yPos, 360, 100, answerColors[i], 0.3);
          
          // Create answer label
          const answerLabel = this.add.text(startX - 140, yPos, answerLabels[i], {
            fontSize: '32px',
            fill: '#ffffff',
            fontWeight: 'bold',
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
          
          // Create answer text
          const answerText = this.add.text(startX, yPos, question.answers[i], {
            fontSize: '22px',
            fill: '#ffffff',
            align: 'center',
            fontWeight: 'bold',
            wordWrap: { width: 300 },
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
          }).setOrigin(0.5);
          
          // Create physics zone for collision
          const collisionZone = this.physics.add.staticSprite(startX, yPos, null);
          collisionZone.setSize(350, 90);
          collisionZone.setVisible(false);
          collisionZone.answerIndex = i; // Store answer index
          
          // Add to answer zones group
          this.answerZones.add(collisionZone);
          
          // Store answer object data
          const answerObj = {
            bg: answerBg,
            glow: answerGlow,
            label: answerLabel,
            text: answerText,
            zone: collisionZone,
            targetX: targetX,
            originalColor: answerColors[i],
            answered: false
          };
          
          this.answerObjects.push(answerObj);
          
          // Animate answer sliding in from right with stagger
          this.time.delayedCall(i * 150, () => {
            this.tweens.add({
              targets: [answerBg, answerGlow, answerLabel, answerText, collisionZone],
              x: targetX,
              duration: 600,
              ease: 'Back.easeOut'
            });
          });
        }
        
        // Show instruction
        this.time.delayedCall(800, () => {
          this.showQuestionInstruction();
        });
      }

      showQuestionInstruction() {
        const instruction = this.add.text(600, 520, '🚀 Fly your jetpack into the correct answer zone!', {
          fontSize: '24px',
          fill: '#ffff44',
          align: 'center',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 3,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);
        
        // Pulsing animation
        this.tweens.add({
          targets: instruction,
          alpha: 0.7,
          scale: 0.95,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        this.currentInstructionText = instruction;
      }

      updateAnswerZonesPosition() {
        // Keep answer zones moving slowly to the left for challenge
        this.answerObjects.forEach((answerObj, index) => {
          if (!answerObj.answered && answerObj.bg.x > -200) {
            const moveSpeed = -30; // Slow movement to left
            answerObj.bg.x += moveSpeed * (1/60); // Assuming 60 FPS
            answerObj.glow.x += moveSpeed * (1/60);
            answerObj.label.x += moveSpeed * (1/60);
            answerObj.text.x += moveSpeed * (1/60);
            answerObj.zone.x += moveSpeed * (1/60);
          }
        });
      }

      selectAnswerByCollision(player, answerZone) {
        const answerIndex = answerZone.answerIndex;
        this.selectAnswer(answerIndex);
      }

      selectAnswer(answerIndex) {
        const answerObj = this.answerObjects[answerIndex];
        if (!answerObj || answerObj.answered) return;
        
        const question = this.questions[this.questionIndex];
        const selectedAnswer = question.answers[answerIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;
        
        // Mark as answered to prevent multiple selections
        answerObj.answered = true;
        
        // Enhanced visual feedback
        if (isCorrect) {
          // Correct answer - enhanced green effect
          answerObj.bg.setFillStyle(0x00ff44);
          answerObj.glow.setFillStyle(0x44ff44);
          
          // Success explosion
          this.createSuccessExplosion(answerObj.bg.x, answerObj.bg.y);
          
          // Screen flash
          this.createSuccessFlash();
          
          // Update score and progress
          this.score += 25; // Higher score for correct answers
          this.correctAnswers++;
          this.questionIndex++;
          
          // Show score popup
          const scorePopup = this.add.text(answerObj.bg.x, answerObj.bg.y - 60, '+25', {
            fontSize: '40px',
            fill: '#00ff44',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => scorePopup.destroy()
          });
          
          this.time.delayedCall(1800, () => this.hideEnhancedQuestion());
          
        } else {
          // Wrong answer - enhanced red effect
          answerObj.bg.setFillStyle(0xff2222);
          answerObj.glow.setFillStyle(0xff6666);
          
          // Show correct answer briefly
          this.showCorrectAnswer(question.correctAnswer);
          
          // Shake effect
          this.cameras.main.shake(400, 0.02);
          
          // Enhanced wrong answer effect
          this.tweens.add({
            targets: [answerObj.bg, answerObj.glow, answerObj.label, answerObj.text],
            x: '+=20',
            duration: 80,
            yoyo: true,
            repeat: 8,
            ease: 'Power2'
          });
          
          // Decrease life
          this.lives--;
          this.wrongAnswers++;
          
          // Damage flash
          this.createDamageFlash();
          
          // Life lost text
          const damageText = this.add.text(this.player.x, this.player.y - 50, '-1 LIFE', {
            fontSize: '28px',
            fill: '#ff0000',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: damageText,
            y: damageText.y - 60,
            alpha: 0,
            duration: 1500,
            onComplete: () => damageText.destroy()
          });
          
          // Check if game over
          if (this.lives <= 0) {
            this.gameState = 'GAME_OVER';
            this.time.delayedCall(2000, () => this.gameOver());
          } else {
            this.time.delayedCall(2000, () => this.hideEnhancedQuestion());
          }
        }
      }

      showCorrectAnswer(correctAnswer) {
        // Find and highlight correct answer briefly
        this.answerObjects.forEach((answerObj, index) => {
          const question = this.questions[this.questionIndex];
          if (question.answers[index] === correctAnswer) {
            // Flash correct answer in green
            this.tweens.add({
              targets: [answerObj.bg, answerObj.glow],
              alpha: 0.3,
              duration: 200,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                answerObj.bg.setFillStyle(0x00aa00);
                answerObj.glow.setFillStyle(0x44aa44);
              }
            });
          }
        });
      }

      createSuccessExplosion(x, y) {
        const colors = [0x00ff44, 0x44ff44, 0x88ff88, 0xaaffaa, 0xffffff];
        
        for (let i = 0; i < 15; i++) {
          const particle = this.add.circle(x, y, window.Phaser.Math.Between(4, 8), colors[i % colors.length]);
          const angle = (i / 15) * Math.PI * 2;
          const distance = 80 + Math.random() * 50;
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.2,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      createSuccessFlash() {
        const flash = this.add.rectangle(600, 300, 1200, 600, 0x00ff44, 0.3);
        flash.setDepth(1000);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 400,
          onComplete: () => flash.destroy()
        });
      }

      createDamageFlash() {
        const flash = this.add.rectangle(600, 300, 1200, 600, 0xff0000, 0.4);
        flash.setDepth(1000);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 500,
          onComplete: () => flash.destroy()
        });
      }

      hideEnhancedQuestion() {
        // Clear question elements
        if (this.currentQuestionElements) {
          this.currentQuestionElements.forEach(element => {
            this.tweens.add({
              targets: element,
              y: -150,
              alpha: 0,
              duration: 600,
              onComplete: () => element.destroy()
            });
          });
          this.currentQuestionElements = null;
        }
        
        // Clear instruction text
        if (this.currentInstructionText) {
          this.tweens.add({
            targets: this.currentInstructionText,
            alpha: 0,
            duration: 400,
            onComplete: () => this.currentInstructionText.destroy()
          });
          this.currentInstructionText = null;
        }
        
        // Clear answer objects
        this.clearAnswerObjects();
        
        // Check if all questions done
        if (this.questionIndex >= this.questions.length) {
          this.time.delayedCall(800, () => this.showResults());
          return;
        }
        
        // Resume game
        this.time.delayedCall(1000, () => {
          this.gameState = 'PLAYING';
          this.obstacleTimer.paused = false;
          this.coinTimer.paused = false;
          
          // Resume obstacles and coins
          this.obstacles.children.entries.forEach(obstacle => {
            obstacle.setVelocityX(-this.scrollSpeed);
            this.tweens.add({
              targets: obstacle,
              alpha: 1,
              duration: 500
            });
          });

          this.coins.children.entries.forEach(coin => {
            coin.setVelocityX(-this.scrollSpeed);
            this.tweens.add({
              targets: coin,
              alpha: 1,
              duration: 500
            });
          });
        });
      }

      clearAnswerObjects() {
        // Clear answer zones from physics group
        this.answerZones.clear(true, true);
        
        // Clear answer objects
        this.answerObjects.forEach(answerObj => {
          if (answerObj.bg) answerObj.bg.destroy();
          if (answerObj.glow) answerObj.glow.destroy();
          if (answerObj.label) answerObj.label.destroy();
          if (answerObj.text) answerObj.text.destroy();
          if (answerObj.zone) answerObj.zone.destroy();
        });
        this.answerObjects = [];
      }

      hitObstacle(player, obstacle) {
        if (this.isInvulnerable || this.gameState !== 'PLAYING') return;
        
        // Enhanced hit effects
        obstacle.destroy();
        
        // Stronger screen shake
        this.cameras.main.shake(400, 0.04);
        
        // Decrease life
        this.lives--;
        this.wrongAnswers++;
        
        // Set invulnerability
        this.isInvulnerable = true;
        
        // Enhanced player damage effect
        this.player.setTint(0xff0000);
        
        // Enhanced flash effect
        this.tweens.add({
          targets: this.player,
          alpha: 0.1,
          duration: 150,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            this.player.clearTint();
            this.player.setAlpha(1);
          }
        });
        
        // Enhanced explosion at hit point
        this.createHitExplosion(player.x, player.y);
        
        // Enhanced damage text
        const damageText = this.add.text(this.player.x, this.player.y - 50, '-1 LIFE', {
          fontSize: '28px',
          fill: '#ff0000',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 3,
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#000000',
            blur: 3,
            stroke: true,
            fill: true
          }
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: damageText,
          y: damageText.y - 60,
          alpha: 0,
          duration: 1500,
          onComplete: () => damageText.destroy()
        });
        
        // Remove invulnerability
        if (this.invulnerabilityTimer) {
          this.invulnerabilityTimer.destroy();
        }
        this.invulnerabilityTimer = this.time.delayedCall(1800, () => {
          this.isInvulnerable = false;
          this.invulnerabilityTimer = null;
        });
        
        // Check if game over
        if (this.lives <= 0) {
          this.gameState = 'GAME_OVER';
          this.time.delayedCall(1200, () => this.gameOver());
        }
      }

      createHitExplosion(x, y) {
        const colors = [0xff4444, 0xff8844, 0xffaa44, 0xffffff, 0xff6666];
        
        for (let i = 0; i < 12; i++) {
          const particle = this.add.circle(x, y, window.Phaser.Math.Between(4, 10), colors[i % colors.length]);
          const angle = (i / 12) * Math.PI * 2;
          const distance = 50 + Math.random() * 40;
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      gameOver() {
        this.gameState = 'GAME_OVER';
        
        // Stop all timers
        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();
        
        // Clear all objects
        this.obstacles.children.entries.forEach(obstacle => {
          this.tweens.add({
            targets: obstacle,
            alpha: 0,
            scale: 0,
            duration: 800,
            onComplete: () => obstacle.destroy()
          });
        });

        this.coins.children.entries.forEach(coin => {
          this.tweens.add({
            targets: coin,
            alpha: 0,
            scale: 0,
            duration: 800,
            onComplete: () => coin.destroy()
          });
        });
        
        // Enhanced game over screen
        const gameOverContainer = this.add.container(600, 300);
        gameOverContainer.setDepth(3000);
        
        const overlay = this.add.rectangle(0, 0, 1200, 600, 0x000000, 0.95);
        
        // Enhanced game over text
        const gameOverGlow = this.add.text(0, -120, 'MISSION FAILED!', {
          fontSize: '64px',
          fill: '#ff4444',
          fontWeight: 'bold',
          stroke: '#ffcccc',
          strokeThickness: 12
        }).setOrigin(0.5);
        
        const gameOverText = this.add.text(0, -120, 'MISSION FAILED!', {
          fontSize: '56px',
          fill: '#ffffff',
          fontWeight: 'bold',
          stroke: '#ff0000',
          strokeThickness: 5
        }).setOrigin(0.5);
        
        // Enhanced stats
        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const statsText = this.add.text(0, -40, 
          `🎯 Final Score: ${this.score}\n🚀 Distance: ${Math.floor(this.distance)}m\n📊 Questions: ${this.questionIndex}/${this.questions.length}\n✅ Correct: ${this.correctAnswers} | ❌ Wrong: ${this.wrongAnswers}\n🎪 Accuracy: ${accuracy}%`, {
          fontSize: '22px',
          fill: '#ffffff',
          align: 'center',
          lineSpacing: 12,
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        
        // Enhanced buttons
        const restartBtn = this.add.text(0, 100, '🚀 Restart Mission', {
          fontSize: '28px',
          fill: '#44ff44',
          backgroundColor: '#003300',
          padding: { x: 35, y: 18 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        const homeBtn = this.add.text(0, 160, '🏠 Return to Base', {
          fontSize: '22px',
          fill: '#ffffff',
          backgroundColor: '#333366',
          padding: { x: 28, y: 15 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        // Button effects
        restartBtn.on('pointerover', () => {
          restartBtn.setScale(1.1);
          restartBtn.setStyle({ backgroundColor: '#004400' });
        });
        restartBtn.on('pointerout', () => {
          restartBtn.setScale(1);
          restartBtn.setStyle({ backgroundColor: '#003300' });
        });
        
        homeBtn.on('pointerover', () => {
          homeBtn.setScale(1.1);
          homeBtn.setStyle({ backgroundColor: '#444477' });
        });
        homeBtn.on('pointerout', () => {
          homeBtn.setScale(1);
          homeBtn.setStyle({ backgroundColor: '#333366' });
        });
        
        // Button actions
        restartBtn.on('pointerdown', () => {
          this.scene.restart({ questions: this.questions });
        });
        
        homeBtn.on('pointerdown', () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        });
        
        gameOverContainer.add([overlay, gameOverGlow, gameOverText, statsText, restartBtn, homeBtn]);
        
        // Enhanced animation
        gameOverContainer.setScale(0.2);
        gameOverContainer.setAlpha(0);
        this.tweens.add({
          targets: gameOverContainer,
          scale: 1,
          alpha: 1,
          duration: 1000,
          ease: 'Back.easeOut'
        });
      }

      showResults() {
        this.gameState = 'RESULTS';
        
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
        
        // Enhanced transition screen
        const transitionContainer = this.add.container(600, 300);
        transitionContainer.setDepth(4000);
        
        const overlay = this.add.rectangle(0, 0, 1200, 600, 0x000000, 0.9);
        
        const completedText = this.add.text(0, -60, '🎉 Mission Complete!', {
          fontSize: '48px',
          fill: results.passed ? '#44ff44' : '#ffaa44',
          fontWeight: 'bold',
          stroke: '#ffffff',
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
        
        const distanceText = this.add.text(0, -10, `Distance Traveled: ${results.distance}m`, {
          fontSize: '28px',
          fill: '#4488ff',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(0, 20, `Final Score: ${results.score} points`, {
          fontSize: '24px',
          fill: '#ffdd44',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        
        const redirectText = this.add.text(0, 60, 'Preparing results summary...', {
          fontSize: '20px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 1
        }).setOrigin(0.5);
        
        transitionContainer.add([overlay, completedText, distanceText, scoreText, redirectText]);
        
        // Enhanced transition animation
        transitionContainer.setAlpha(0);
        this.tweens.add({
          targets: transitionContainer,
          alpha: 1,
          duration: 800,
          ease: 'Power2'
        });
        
        // Create celebration particles if passed
        if (results.passed) {
          this.time.delayedCall(500, () => {
            this.createCelebrationParticles();
          });
        }
        
        // Save results and redirect
        this.time.delayedCall(3000, () => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('gameResults', JSON.stringify(results));
            window.location.href = '/QuestGame/result';
          }
        });
      }

      createCelebrationParticles() {
        const colors = [0xffff00, 0xff6600, 0xff0066, 0x6600ff, 0x0066ff, 0x00ff66];
        
        for (let i = 0; i < 30; i++) {
          const particle = this.add.circle(
            600 + window.Phaser.Math.Between(-200, 200), 
            300 + window.Phaser.Math.Between(-150, 150), 
            window.Phaser.Math.Between(4, 8), 
            colors[i % colors.length]
          );
          
          this.tweens.add({
            targets: particle,
            y: particle.y - window.Phaser.Math.Between(100, 200),
            x: particle.x + window.Phaser.Math.Between(-50, 50),
            alpha: 0,
            duration: window.Phaser.Math.Between(1500, 2500),
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading Enhanced Jetpack Game...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Enhanced Game Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          🚀 Enhanced Jetpack Quest
        </h1>
        <p className="text-gray-300 text-lg">Fly through the enhanced laboratory, collect coins, and answer questions!</p>
        <p className="text-cyan-400 text-sm mt-2">✨ New: Questions slide from top, answers come from the right!</p>
      </div>

      {/* Game Container */}
      <div className="relative">
        <div 
          ref={gameRef} 
          className="border-4 border-cyan-500 rounded-lg overflow-hidden shadow-2xl bg-black"
          style={{ 
            width: '1200px', 
            height: '600px',
            maxWidth: '100vw',
            maxHeight: '70vh'
          }}
        />
        
        {(isLoading || !gameLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-white font-semibold">Loading Enhanced Jetpack Game...</p>
              <p className="text-gray-400 text-sm mt-2">Initializing enhanced laboratory...</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Game Instructions */}
      <div className="mt-8 max-w-6xl text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">🎮 Enhanced Jetpack Controls</h2>
        <div className="grid md:grid-cols-5 gap-4 text-sm">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="font-semibold text-cyan-400 mb-2">Enhanced Jetpack</h3>
            <p className="text-gray-300"><strong>Hold SPACE</strong> for boost</p>
            <p className="text-gray-300">Better particles & effects</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-yellow-400 mb-2">Smart Fuel</h3>
            <p className="text-gray-300">Visual fuel warnings</p>
            <p className="text-gray-300">Recharges when idle</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-green-400 mb-2">Enhanced Coins</h3>
            <p className="text-gray-300">Sparkle effects (+8 pts)</p>
            <p className="text-gray-300">Avoid enhanced obstacles</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold text-purple-400 mb-2">Smart Questions</h3>
            <p className="text-gray-300">Questions slide from top</p>
            <p className="text-gray-300">Answers come from right</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-pink-400 mb-2">Collision System</h3>
            <p className="text-gray-300">Fly into correct answer</p>
            <p className="text-gray-300">Enhanced feedback (+25 pts)</p>
          </div>
        </div>
      </div>

      {/* Enhanced Features List */}
      <div className="mt-6 bg-slate-800/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700 max-w-4xl">
        <h3 className="text-xl font-semibold text-cyan-400 mb-3">✨ Enhanced Features</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Visual Improvements:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Enhanced jetpack character design</li>
              <li>Better particle effects & explosions</li>
              <li>Improved obstacle graphics</li>
              <li>Enhanced UI with shadows & glows</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Gameplay Improvements:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Questions slide down from top</li>
              <li>Answer zones come from right side</li>
              <li>Collision-based answer selection</li>
              <li>Enhanced scoring system</li>
            </ul>
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
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              🔄 Restart Enhanced Flight
            </button>
          )}
        </div>
      )}
    </div>
  );
}