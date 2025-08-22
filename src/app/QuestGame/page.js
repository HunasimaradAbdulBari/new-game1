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
        const scene = phaserGameRef.current.scene.getScene('GameScene');
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

        console.log('Starting Jetpack game initialization...');

        // Load Phaser from CDN first
        await loadPhaserFromCDN();
        
        console.log('Phaser loaded, creating jetpack game scene...');

        // Create the complete JetpackGameScene class
        const JetpackGameScene = createJetpackGameScene();
        
        console.log('JetpackGameScene created, initializing Phaser game...');

        // Phaser game configuration - Jetpack Joyride style
        const config = {
          type: window.Phaser.AUTO,
          width: 1200,
          height: 600,
          parent: gameRef.current,
          backgroundColor: '#0a0a0f',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 800 }, // Stronger gravity like Jetpack Joyride
              debug: false
            }
          },
          scene: JetpackGameScene,
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

        // Create Phaser game instance
        const game = new window.Phaser.Game(config);
        phaserGameRef.current = game;

        console.log('Jetpack Phaser game created successfully');

        // Wait for scene to be ready
        setTimeout(() => {
          try {
            const scene = game.scene.getScene('JetpackGameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
            console.log('Jetpack game loaded successfully');
          } catch (err) {
            console.error('Error initializing scene:', err);
            setError('Failed to initialize game scene. Please try reloading.');
            setIsLoading(false);
          }
        }, 1000);

      } catch (err) {
        console.error('Failed to initialize jetpack game:', err);
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
      // Check if Phaser is already loaded
      if (window.Phaser) {
        resolve();
        return;
      }

      // Create script element
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

  // Complete Jetpack Joyride style GameScene
  const createJetpackGameScene = () => {
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
        this.scrollSpeed = 200; // Constant scroll speed like Jetpack Joyride
        
        // Game objects
        this.player = null;
        this.obstacles = null;
        this.background = null;
        this.backgroundVideo = null;
        this.jetpackParticles = [];
        this.coins = null;
        
        // UI elements
        this.livesText = null;
        this.scoreText = null;
        this.distanceText = null;
        this.progressText = null;
        this.questionText = null;
        this.answerBoxes = [];
        this.questionContainer = null;
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
      }

      preload() {
        this.createJetpackAssets();
        
        // Try to load your custom bg.mp4
        try {
          this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
          console.log('Loading custom bg.mp4...');
        } catch (error) {
          console.log('Custom bg.mp4 not found, will use fallback');
        }
      }

      createJetpackAssets() {
        // Create jetpack character (more detailed)
        const playerGraphics = this.add.graphics();
        
        // Character body (blue suit)
        playerGraphics.fillStyle(0x0066cc);
        playerGraphics.fillRoundedRect(5, 8, 20, 25, 3);
        
        // Character head (skin tone)
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(15, 8, 8);
        
        // Helmet/goggles (dark)
        playerGraphics.fillStyle(0x333333);
        playerGraphics.fillRect(8, 3, 14, 6);
        playerGraphics.fillStyle(0x66ccff);
        playerGraphics.fillCircle(12, 6, 2);
        playerGraphics.fillCircle(18, 6, 2);
        
        // Jetpack (metallic)
        playerGraphics.fillStyle(0x666666);
        playerGraphics.fillRoundedRect(2, 12, 8, 18, 2);
        playerGraphics.fillRoundedRect(20, 12, 8, 18, 2);
        
        // Jetpack details (yellow highlights)
        playerGraphics.fillStyle(0xffff00);
        playerGraphics.fillRect(4, 15, 4, 2);
        playerGraphics.fillRect(22, 15, 4, 2);
        
        // Arms
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(2, 18, 3);
        playerGraphics.fillCircle(28, 18, 3);
        
        // Legs
        playerGraphics.fillStyle(0x0066cc);
        playerGraphics.fillRect(8, 28, 6, 12);
        playerGraphics.fillRect(16, 28, 6, 12);
        
        // Boots
        playerGraphics.fillStyle(0x444444);
        playerGraphics.fillRect(6, 38, 10, 4);
        playerGraphics.fillRect(14, 38, 10, 4);
        
        playerGraphics.generateTexture('jetpack-player', 30, 42);
        playerGraphics.destroy();
        
        // Create various obstacle types (Jetpack Joyride style)
        
        // Laser obstacle (red beam)
        const laserGraphics = this.add.graphics();
        laserGraphics.fillStyle(0xff0000, 0.8);
        laserGraphics.fillRect(0, 0, 15, 300);
        laserGraphics.fillStyle(0xff6666, 0.6);
        laserGraphics.fillRect(3, 0, 9, 300);
        laserGraphics.fillStyle(0xffffff, 0.9);
        laserGraphics.fillRect(6, 0, 3, 300);
        laserGraphics.generateTexture('laser-obstacle', 15, 300);
        laserGraphics.destroy();
        
        // Missile obstacle
        const missileGraphics = this.add.graphics();
        missileGraphics.fillStyle(0x666666);
        missileGraphics.fillEllipse(15, 8, 30, 16);
        missileGraphics.fillStyle(0xff4444);
        missileGraphics.fillTriangle(0, 8, 8, 4, 8, 12);
        missileGraphics.fillStyle(0x444444);
        missileGraphics.fillRect(20, 6, 8, 4);
        missileGraphics.fillStyle(0xffaa00);
        missileGraphics.fillTriangle(30, 8, 35, 5, 35, 11);
        missileGraphics.generateTexture('missile-obstacle', 35, 16);
        missileGraphics.destroy();
        
        // Electricity obstacle (sparking)
        const electricGraphics = this.add.graphics();
        electricGraphics.lineStyle(4, 0x00ffff, 1);
        for (let i = 0; i < 10; i++) {
          const x = i * 3;
          const y1 = Math.sin(i * 0.5) * 20 + 50;
          const y2 = Math.sin((i + 1) * 0.5) * 20 + 50;
          electricGraphics.lineBetween(x, y1, x + 3, y2);
        }
        electricGraphics.lineStyle(2, 0xffffff, 1);
        for (let i = 0; i < 10; i++) {
          const x = i * 3;
          const y1 = Math.sin(i * 0.5) * 20 + 50;
          const y2 = Math.sin((i + 1) * 0.5) * 20 + 50;
          electricGraphics.lineBetween(x, y1, x + 3, y2);
        }
        electricGraphics.generateTexture('electric-obstacle', 30, 100);
        electricGraphics.destroy();
        
        // Coin pickup
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xffdd00);
        coinGraphics.fillCircle(10, 10, 10);
        coinGraphics.fillStyle(0xffff44);
        coinGraphics.fillCircle(10, 10, 7);
        coinGraphics.fillStyle(0xffdd00);
        coinGraphics.fillRect(7, 8, 6, 4);
        coinGraphics.generateTexture('coin', 20, 20);
        coinGraphics.destroy();
        
        // Enhanced laboratory/futuristic background
        const bgGraphics = this.add.graphics();
        
        // Main background gradient (dark lab feel)
        bgGraphics.fillGradientStyle(0x0a0a1a, 0x1a1a3a, 0x0f0f2f, 0x2a2a4a, 1);
        bgGraphics.fillRect(0, 0, 1200, 600);
        
        // Add laboratory grid pattern
        bgGraphics.lineStyle(1, 0x333366, 0.3);
        for (let x = 0; x < 1200; x += 50) {
          bgGraphics.lineBetween(x, 0, x, 600);
        }
        for (let y = 0; y < 600; y += 50) {
          bgGraphics.lineBetween(0, y, 1200, y);
        }
        
        // Add some tech panels on walls
        bgGraphics.fillStyle(0x333366, 0.4);
        for (let i = 0; i < 5; i++) {
          const x = i * 240 + 50;
          bgGraphics.fillRoundedRect(x, 50, 80, 100, 5);
          bgGraphics.fillRoundedRect(x, 450, 80, 100, 5);
        }
        
        // Add some glowing elements
        bgGraphics.fillStyle(0x00ffcc, 0.2);
        for (let i = 0; i < 8; i++) {
          const x = i * 150;
          bgGraphics.fillCircle(x + 75, 100, 20);
          bgGraphics.fillCircle(x + 75, 500, 20);
        }
        
        // Add warning stripes (top and bottom)
        bgGraphics.fillStyle(0xffaa00, 0.6);
        for (let x = 0; x < 1200; x += 40) {
          bgGraphics.fillRect(x, 0, 20, 20);
          bgGraphics.fillRect(x + 20, 580, 20, 20);
        }
        bgGraphics.fillStyle(0x000000, 0.6);
        for (let x = 20; x < 1200; x += 40) {
          bgGraphics.fillRect(x, 0, 20, 20);
          bgGraphics.fillRect(x - 20, 580, 20, 20);
        }
        
        bgGraphics.generateTexture('lab-background', 1200, 600);
        bgGraphics.destroy();
      }

      create() {
        console.log('Creating jetpack game scene...');
        
        this.physics.world.setBounds(0, 0, 1200, 600);
        
        // Create scrolling background
        this.createScrollingBackground();
        
        // Create player with jetpack physics
        this.createJetpackPlayer();
        
        // Create obstacle groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();
        
        // Create UI
        this.createJetpackUI();
        
        // Setup input
        this.setupJetpackInput();
        
        // Setup collisions
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        
        // Start spawning obstacles and coins
        this.startJetpackSpawning();
        
        // Create question UI
        this.createQuestionUI();
        
        console.log('Jetpack game scene created successfully');
      }

      createScrollingBackground() {
        try {
          // Try to use your custom bg.mp4 first
          if (this.cache.video.exists('bgvideo')) {
            this.backgroundVideo = this.add.video(0, 0, 'bgvideo');
            this.backgroundVideo.setOrigin(0, 0);
            this.backgroundVideo.setDisplaySize(1200, 600);
            this.backgroundVideo.play(true);
            console.log('Using custom bg.mp4 background');
            
            // Create a tiling sprite overlay for parallax effect
            this.backgroundOverlay = this.add.tileSprite(0, 0, 1200, 600, 'lab-background');
            this.backgroundOverlay.setOrigin(0, 0);
            this.backgroundOverlay.setAlpha(0.3); // Semi-transparent overlay
          } else {
            // Fallback to generated background
            this.background = this.add.tileSprite(0, 0, 1200, 600, 'lab-background');
            this.background.setOrigin(0, 0);
            console.log('Using fallback lab background');
          }
        } catch (error) {
          console.warn('Background creation error, using fallback');
          this.background = this.add.tileSprite(0, 0, 1200, 600, 'lab-background');
          this.background.setOrigin(0, 0);
        }
      }

      createJetpackPlayer() {
        this.player = this.physics.add.sprite(100, 300, 'jetpack-player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setScale(1.2);
        this.player.setSize(25, 35);
        this.player.setGravityY(0); // We'll handle gravity manually for jetpack feel
      }

      createJetpackUI() {
        // Lives display
        this.livesText = this.add.text(16, 16, `❤️ Lives: ${this.lives}`, {
          fontSize: '20px',
          fill: '#ff4444',
          stroke: '#ffffff',
          strokeThickness: 2,
          fontWeight: 'bold'
        });
        
        // Score display
        this.scoreText = this.add.text(16, 45, `💰 Score: ${this.score}`, {
          fontSize: '20px',
          fill: '#44ff44',
          stroke: '#000000',
          strokeThickness: 2,
          fontWeight: 'bold'
        });

        // Distance traveled
        this.distanceText = this.add.text(16, 74, `🚀 Distance: ${this.distance}m`, {
          fontSize: '18px',
          fill: '#44aaff',
          stroke: '#ffffff',
          strokeThickness: 1,
          fontWeight: 'bold'
        });

        // Progress indicator
        const totalQuestions = this.questions.length;
        this.progressText = this.add.text(16, 103, `📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`, {
          fontSize: '18px',
          fill: '#ffaa44',
          stroke: '#ffffff',
          strokeThickness: 1,
          fontWeight: 'bold'
        });

        // Jetpack fuel bar
        this.createJetpackFuelBar();

        // Game instructions
        this.add.text(1184, 16, '🚀 HOLD SPACE for JETPACK!', {
          fontSize: '16px',
          fill: '#ffff44',
          stroke: '#000000',
          strokeThickness: 1,
          fontWeight: 'bold'
        }).setOrigin(1, 0);
      }

      createJetpackFuelBar() {
        // Fuel bar background
        this.fuelBarBg = this.add.rectangle(1100, 80, 120, 20, 0x333333);
        this.fuelBarBg.setStrokeStyle(2, 0xffffff);
        
        // Fuel bar fill
        this.fuelBar = this.add.rectangle(1100, 80, 116, 16, 0x00ff44);
        
        // Fuel bar text
        this.fuelText = this.add.text(1100, 105, 'JETPACK FUEL', {
          fontSize: '12px',
          fill: '#ffffff',
          fontWeight: 'bold'
        }).setOrigin(0.5, 0);
      }

      setupJetpackInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(window.Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Enhanced touch/click input for jetpack
        this.input.on('pointerdown', (pointer) => {
          this.jetpackActive = true;
        });
        
        this.input.on('pointerup', (pointer) => {
          this.jetpackActive = false;
        });
      }

      startJetpackSpawning() {
        // Spawn obstacles more frequently
        this.obstacleTimer = this.time.addEvent({
          delay: 2000,
          callback: this.spawnJetpackObstacle,
          callbackScope: this,
          loop: true
        });

        // Spawn coins
        this.coinTimer = this.time.addEvent({
          delay: 1500,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true
        });
      }

      spawnJetpackObstacle() {
        if (this.gameState !== 'PLAYING') return;
        
        const obstacleTypes = ['laser-obstacle', 'missile-obstacle', 'electric-obstacle'];
        const randomType = window.Phaser.Math.RND.pick(obstacleTypes);
        
        let obstacle;
        let yPos = window.Phaser.Math.Between(100, 500);
        
        if (randomType === 'laser-obstacle') {
          // Vertical laser beam
          yPos = window.Phaser.Math.Between(50, 200);
          obstacle = this.obstacles.create(1250, yPos, randomType);
          obstacle.setSize(10, 280);
        } else if (randomType === 'missile-obstacle') {
          // Horizontal missile
          obstacle = this.obstacles.create(1250, yPos, randomType);
          obstacle.setSize(30, 12);
          obstacle.setAngularVelocity(100);
        } else {
          // Electric obstacle
          obstacle = this.obstacles.create(1250, yPos, randomType);
          obstacle.setSize(25, 80);
        }
        
        obstacle.setVelocityX(-this.scrollSpeed);
        obstacle.setTint(0xff6666);
        
        // Add some random movement for missiles
        if (randomType === 'missile-obstacle') {
          obstacle.setVelocityY(window.Phaser.Math.Between(-50, 50));
        }
      }

      spawnCoin() {
        if (this.gameState !== 'PLAYING') return;
        
        const x = window.Phaser.Math.Between(1250, 1350);
        const y = window.Phaser.Math.Between(100, 500);
        const coin = this.coins.create(x, y, 'coin');
        
        coin.setVelocityX(-this.scrollSpeed);
        coin.setScale(0.8);
        coin.setCircle(8);
        
        // Make coins sparkle
        this.tweens.add({
          targets: coin,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      update() {
        // Handle jetpack input (Jetpack Joyride style)
        if (this.spaceKey.isDown || this.jetpackActive) {
          if (this.jetpackFuel > 0 && this.gameState === 'PLAYING') {
            // Apply upward thrust
            this.player.setVelocityY(-300);
            this.jetpackFuel = Math.max(0, this.jetpackFuel - 1);
            this.createJetpackParticles();
            
            // Angle player slightly upward
            this.player.rotation = -0.2;
          }
        } else {
          // Apply gravity when not using jetpack
          this.player.setVelocityY(this.player.body.velocity.y + 15);
          
          // Recharge fuel slowly when not in use
          this.jetpackFuel = Math.min(100, this.jetpackFuel + 0.5);
          
          // Angle player downward when falling
          this.player.rotation = Math.min(0.3, this.player.body.velocity.y * 0.001);
        }
        
        // Update fuel bar
        this.updateFuelBar();
        
        // Scroll background continuously
        this.scrollBackground();
        
        // Update distance traveled
        this.distance += 0.1;
        
        // Clean up obstacles and coins
        this.cleanupObjects();
        
        // Check for questions
        this.checkQuestionTrigger();
        
        // Update UI
        this.updateJetpackUI();
        
        // Clean up particles
        this.updateParticles();
      }

      createJetpackParticles() {
        // Create jetpack exhaust particles
        for (let i = 0; i < 3; i++) {
          const particle = this.add.circle(
            this.player.x - 15 + window.Phaser.Math.Between(-5, 5), 
            this.player.y + 20, 
            window.Phaser.Math.Between(2, 4), 
            0xff6600,
            0.8
          );
          
          this.jetpackParticles.push(particle);
          
          this.tweens.add({
            targets: particle,
            x: particle.x - window.Phaser.Math.Between(20, 40),
            y: particle.y + window.Phaser.Math.Between(10, 30),
            alpha: 0,
            scale: 0.1,
            duration: 400,
            onComplete: () => {
              particle.destroy();
              this.jetpackParticles = this.jetpackParticles.filter(p => p !== particle);
            }
          });
        }
      }

      updateFuelBar() {
        const fuelPercent = this.jetpackFuel / 100;
        this.fuelBar.scaleX = fuelPercent;
        
        // Change color based on fuel level
        if (fuelPercent > 0.5) {
          this.fuelBar.setFillStyle(0x00ff44);
        } else if (fuelPercent > 0.2) {
          this.fuelBar.setFillStyle(0xffaa00);
        } else {
          this.fuelBar.setFillStyle(0xff4444);
        }
      }

      scrollBackground() {
        if (this.background) {
          this.background.tilePositionX += this.scrollSpeed * 0.01;
        }
        if (this.backgroundOverlay) {
          this.backgroundOverlay.tilePositionX += this.scrollSpeed * 0.005;
        }
      }

      cleanupObjects() {
        // Clean up obstacles
        this.obstacles.children.entries.forEach(obstacle => {
          if (obstacle.x < -100) {
            if (this.gameState === 'PLAYING') {
              this.obstaclesPassed++;
            }
            obstacle.destroy();
          }
        });

        // Clean up coins
        this.coins.children.entries.forEach(coin => {
          if (coin.x < -50) {
            coin.destroy();
          }
        });
      }

      checkQuestionTrigger() {
        if (this.obstaclesPassed >= 3) { // Show question every 3 obstacles
          this.obstaclesPassed = 0;
          this.showQuestion();
        }
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 5;
        
        // Coin collect effect
        const coinText = this.add.text(coin.x, coin.y, '+5', {
          fontSize: '16px',
          fill: '#ffdd00',
          fontWeight: 'bold'
        });
        
        this.tweens.add({
          targets: coinText,
          y: coinText.y - 30,
          alpha: 0,
          duration: 800,
          onComplete: () => coinText.destroy()
        });
      }

      updateParticles() {
        // Clean up destroyed particles
        this.jetpackParticles = this.jetpackParticles.filter(particle => particle.active);
      }

      updateJetpackUI() {
        this.livesText.setText(`❤️ Lives: ${this.lives}`);
        this.scoreText.setText(`💰 Score: ${this.score}`);
        this.distanceText.setText(`🚀 Distance: ${Math.floor(this.distance)}m`);
        if (this.progressText) {
          const totalQuestions = this.questions.length;
          this.progressText.setText(`📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`);
        }
      }

      // Keep the same question system from the original game
      createQuestionUI() {
        this.questionContainer = this.add.container(0, 0);
        this.questionContainer.setVisible(false);
        this.questionContainer.setDepth(2000);
        
        // Enhanced overlay with pulse effect
        const overlay = this.add.rectangle(600, 300, 1200, 600, 0x000000, 0.85);
        this.questionContainer.add(overlay);
        
        // Enhanced question background with glow
        const questionBg = this.add.rectangle(600, 120, 1000, 120, 0xffffff);
        questionBg.setStrokeStyle(4, 0x4488ff);
        const questionGlow = this.add.rectangle(600, 120, 1010, 130, 0x4488ff, 0.3);
        this.questionContainer.add([questionGlow, questionBg]);
        
        // Question text with enhanced styling
        this.questionText = this.add.text(600, 120, '', {
          fontSize: '24px',
          fill: '#000000',
          align: 'center',
          fontWeight: 'bold',
          wordWrap: { width: 950 }
        }).setOrigin(0.5);
        this.questionContainer.add(this.questionText);
        
        // Enhanced answer boxes with labels
        const answerYPositions = [240, 340, 440];
        const answerColors = [0x4285f4, 0x34a853, 0xfbbc04];
        const answerLabels = ['A', 'B', 'C'];
        
        this.answerBoxes = [];
        for (let i = 0; i < 3; i++) {
          // Glow effect behind answer box
          const answerGlow = this.add.rectangle(600, answerYPositions[i], 930, 85, answerColors[i], 0.3);
          
          // Main answer box
          const answerBox = this.add.rectangle(600, answerYPositions[i], 920, 80, answerColors[i]);
          answerBox.setStrokeStyle(4, 0xffffff);
          
          // Answer label (A, B, C)
          const labelText = this.add.text(200, answerYPositions[i], answerLabels[i], {
            fontSize: '32px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
          }).setOrigin(0.5);
          
          // Answer text
          const answerText = this.add.text(600, answerYPositions[i], '', {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            fontWeight: 'bold',
            wordWrap: { width: 700 }
          }).setOrigin(0.5);
          
          // Enhanced interactivity
          answerBox.setInteractive();
          answerBox.on('pointerdown', () => this.selectAnswer(i));
          answerBox.on('pointerover', () => {
            if (!this.answerBoxes[i].disabled) {
              answerBox.setScale(1.05);
              answerGlow.setScale(1.05);
            }
          });
          answerBox.on('pointerout', () => {
            answerBox.setScale(1);
            answerGlow.setScale(1);
          });
          
          // Create physics zone for player collision
          const zone = this.physics.add.staticGroup().create(600, answerYPositions[i]);
          zone.setSize(920, 80);
          zone.setVisible(false);
          
          this.answerBoxes.push({
            box: answerBox,
            glow: answerGlow,
            text: answerText,
            label: labelText,
            zone: zone,
            disabled: false,
            originalColor: answerColors[i]
          });
          
          this.questionContainer.add([answerGlow, answerBox, answerText, labelText]);
        }

        // Enhanced instruction text with animation
        const instructionText = this.add.text(600, 520, '🚀 Fly into the correct answer or click it!', {
          fontSize: '20px',
          fill: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        
        // Make instruction text pulse
        this.tweens.add({
          targets: instructionText,
          alpha: 0.6,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        this.questionContainer.add(instructionText);
      }

      showQuestion() {
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
        
        // Pause obstacle spawning
        this.obstacleTimer.paused = true;
        this.coinTimer.paused = true;
        
        // Stop all existing obstacles with fade effect
        this.obstacles.children.entries.forEach(obstacle => {
          obstacle.setVelocity(0, 0);
          this.tweens.add({
            targets: obstacle,
            alpha: 0.3,
            duration: 500
          });
        });

        // Stop all coins
        this.coins.children.entries.forEach(coin => {
          coin.setVelocity(0, 0);
          this.tweens.add({
            targets: coin,
            alpha: 0.5,
            duration: 500
          });
        });
        
        // Set question text
        this.questionText.setText(question.question);
        
        // Set answer texts and reset colors with stagger effect
        for (let i = 0; i < 3; i++) {
          const answer = this.answerBoxes[i];
          answer.text.setText(question.answers[i]);
          answer.box.setFillStyle(answer.originalColor);
          answer.box.setScale(0.8);
          answer.box.setAlpha(0);
          answer.glow.setScale(0.8);
          answer.glow.setAlpha(0);
          answer.label.setAlpha(0);
          answer.disabled = false;
          
          // Animate answer boxes in with stagger
          this.time.delayedCall(500 + (i * 200), () => {
            this.tweens.add({
              targets: [answer.box, answer.glow, answer.text, answer.label],
              scale: 1,
              alpha: 1,
              duration: 300,
              ease: 'Back.easeOut'
            });
          });
        }
        
        // Show question UI with fade in
        this.questionContainer.setAlpha(0);
        this.questionContainer.setVisible(true);
        this.tweens.add({
          targets: this.questionContainer,
          alpha: 1,
          duration: 400
        });
        
        // Setup collision detection with answer zones
        this.clearAnswerColliders();
        this.time.delayedCall(1000, () => {
          for (let i = 0; i < 3; i++) {
            const collider = this.physics.add.overlap(
              this.player, 
              this.answerBoxes[i].zone, 
              () => this.selectAnswer(i), 
              null, 
              this
            );
            this.answerColliders.push(collider);
          }
        });
      }

      selectAnswer(answerIndex) {
        const answerBox = this.answerBoxes[answerIndex];
        if (answerBox.disabled) return;
        
        const question = this.questions[this.questionIndex];
        const selectedAnswer = question.answers[answerIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;
        
        // Disable all answers
        this.answerBoxes.forEach(answer => answer.disabled = true);
        
        // Enhanced visual feedback
        if (isCorrect) {
          // Correct answer - green with celebration
          answerBox.box.setFillStyle(0x00ff44);
          answerBox.glow.setFillStyle(0x00ff44);
          
          // Success particles
          this.createSuccessParticles(answerBox.box.x, answerBox.box.y);
          
          // Update score and progress
          this.score += 20; // Higher score for jetpack game
          this.correctAnswers++;
          this.questionIndex++;
          
          // Show +20 score popup
          const scorePopup = this.add.text(answerBox.box.x, answerBox.box.y - 50, '+20', {
            fontSize: '36px',
            fill: '#00ff44',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 40,
            alpha: 0,
            duration: 1200,
            onComplete: () => scorePopup.destroy()
          });
          
          this.time.delayedCall(1500, () => this.hideQuestion());
          
        } else {
          // Wrong answer - red with shake
          answerBox.box.setFillStyle(0xff2222);
          answerBox.glow.setFillStyle(0xff2222);
          
          // Shake effect
          this.tweens.add({
            targets: [answerBox.box, answerBox.glow, answerBox.text, answerBox.label],
            x: '+=15',
            duration: 60,
            yoyo: true,
            repeat: 6
          });
          
          // Decrease life
          this.lives--;
          this.wrongAnswers++;
          
          // Screen flash for damage
          const damageFlash = this.add.rectangle(600, 300, 1200, 600, 0xff0000, 0.4);
          damageFlash.setDepth(1500);
          this.tweens.add({
            targets: damageFlash,
            alpha: 0,
            duration: 300,
            onComplete: () => damageFlash.destroy()
          });
          
          // Check if game over
          if (this.lives <= 0) {
            this.gameState = 'GAME_OVER';
            this.time.delayedCall(1800, () => this.gameOver());
          } else {
            this.time.delayedCall(1500, () => this.hideQuestion());
          }
        }
      }

      createSuccessParticles(x, y) {
        const colors = [0xffff00, 0x00ff00, 0x00ffff, 0xff88ff, 0xffaa00];
        
        for (let i = 0; i < 12; i++) {
          const particle = this.add.circle(x, y, 5, colors[i % colors.length]);
          const angle = (i / 12) * Math.PI * 2;
          const distance = 60 + Math.random() * 40;
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.3,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      hideQuestion() {
        // Fade out question UI
        this.tweens.add({
          targets: this.questionContainer,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.questionContainer.setVisible(false);
            this.questionContainer.setAlpha(1);
          }
        });
        
        this.clearAnswerColliders();
        
        // Check if all questions are done
        if (this.questionIndex >= this.questions.length) {
          this.time.delayedCall(600, () => this.showResults());
          return;
        }
        
        // Resume game after delay
        this.time.delayedCall(800, () => {
          this.gameState = 'PLAYING';
          this.obstacleTimer.paused = false;
          this.coinTimer.paused = false;
          
          // Resume obstacle movement and restore alpha
          this.obstacles.children.entries.forEach(obstacle => {
            obstacle.setVelocityX(-this.scrollSpeed);
            this.tweens.add({
              targets: obstacle,
              alpha: 1,
              duration: 400
            });
          });

          // Resume coin movement
          this.coins.children.entries.forEach(coin => {
            coin.setVelocityX(-this.scrollSpeed);
            this.tweens.add({
              targets: coin,
              alpha: 1,
              duration: 400
            });
          });
        });
      }

      clearAnswerColliders() {
        this.answerColliders.forEach(collider => {
          if (collider && collider.destroy) {
            collider.destroy();
          }
        });
        this.answerColliders = [];
      }

      hitObstacle(player, obstacle) {
        if (this.isInvulnerable || this.gameState !== 'PLAYING') return;
        
        // Enhanced hit effects
        obstacle.destroy();
        
        // Screen shake (stronger for jetpack feel)
        this.cameras.main.shake(300, 0.03);
        
        // Decrease life
        this.lives--;
        this.wrongAnswers++;
        
        // Set invulnerability
        this.isInvulnerable = true;
        
        // Enhanced visual feedback
        this.player.setTint(0xff0000);
        
        // Player flash effect (longer for jetpack style)
        this.tweens.add({
          targets: this.player,
          alpha: 0.2,
          duration: 120,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            this.player.clearTint();
            this.player.setAlpha(1);
          }
        });
        
        // Explosion effect at hit point
        this.createExplosionEffect(player.x, player.y);
        
        // Damage text popup
        const damageText = this.add.text(this.player.x, this.player.y - 40, '-1 LIFE', {
          fontSize: '24px',
          fill: '#ff0000',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: damageText,
          y: damageText.y - 50,
          alpha: 0,
          duration: 1200,
          onComplete: () => damageText.destroy()
        });
        
        // Remove invulnerability after 1.5 seconds (longer for jetpack style)
        if (this.invulnerabilityTimer) {
          this.invulnerabilityTimer.destroy();
        }
        this.invulnerabilityTimer = this.time.delayedCall(1500, () => {
          this.isInvulnerable = false;
          this.invulnerabilityTimer = null;
        });
        
        // Check if game over
        if (this.lives <= 0) {
          this.gameState = 'GAME_OVER';
          this.time.delayedCall(1000, () => this.gameOver());
        }
      }

      createExplosionEffect(x, y) {
        const colors = [0xff4444, 0xff8844, 0xffaa44, 0xffffff];
        
        for (let i = 0; i < 8; i++) {
          const particle = this.add.circle(x, y, window.Phaser.Math.Between(3, 8), colors[i % colors.length]);
          const angle = (i / 8) * Math.PI * 2;
          const distance = 40 + Math.random() * 30;
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.1,
            duration: 600,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      gameOver() {
        this.gameState = 'GAME_OVER';
        
        // Stop all timers
        if (this.obstacleTimer) {
          this.obstacleTimer.destroy();
        }
        if (this.coinTimer) {
          this.coinTimer.destroy();
        }
        
        // Clear all obstacles and coins with fade effect
        this.obstacles.children.entries.forEach(obstacle => {
          this.tweens.add({
            targets: obstacle,
            alpha: 0,
            scale: 0,
            duration: 600,
            onComplete: () => obstacle.destroy()
          });
        });

        this.coins.children.entries.forEach(coin => {
          this.tweens.add({
            targets: coin,
            alpha: 0,
            scale: 0,
            duration: 600,
            onComplete: () => coin.destroy()
          });
        });
        
        // Create enhanced game over screen (larger for jetpack style)
        const gameOverContainer = this.add.container(600, 300);
        gameOverContainer.setDepth(3000);
        
        const overlay = this.add.rectangle(0, 0, 1200, 600, 0x000000, 0.95);
        
        // Main game over text with enhanced glow
        const gameOverGlow = this.add.text(0, -100, 'MISSION FAILED!', {
          fontSize: '60px',
          fill: '#ff4444',
          fontWeight: 'bold',
          stroke: '#ffcccc',
          strokeThickness: 10
        }).setOrigin(0.5);
        
        const gameOverText = this.add.text(0, -100, 'MISSION FAILED!', {
          fontSize: '54px',
          fill: '#ffffff',
          fontWeight: 'bold',
          stroke: '#ff0000',
          strokeThickness: 4
        }).setOrigin(0.5);
        
        // Enhanced stats display
        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const statsText = this.add.text(0, -30, 
          `🎯 Final Score: ${this.score}\n🚀 Distance: ${Math.floor(this.distance)}m\n📊 Questions: ${this.questionIndex}/${this.questions.length}\n✅ Correct: ${this.correctAnswers} | ❌ Wrong: ${this.wrongAnswers}\n🎪 Accuracy: ${accuracy}%`, {
          fontSize: '20px',
          fill: '#ffffff',
          align: 'center',
          lineSpacing: 10,
          fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Enhanced restart button
        const restartBtn = this.add.text(0, 90, '🚀 Restart Flight', {
          fontSize: '26px',
          fill: '#44ff44',
          backgroundColor: '#003300',
          padding: { x: 30, y: 15 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        // Enhanced home button
        const homeBtn = this.add.text(0, 150, '🏠 Return to Base', {
          fontSize: '20px',
          fill: '#ffffff',
          backgroundColor: '#333366',
          padding: { x: 25, y: 12 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        // Button hover effects
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
        
        // Button interactions
        restartBtn.on('pointerdown', () => {
          this.scene.restart({ questions: this.questions });
        });
        
        homeBtn.on('pointerdown', () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        });
        
        gameOverContainer.add([overlay, gameOverGlow, gameOverText, statsText, restartBtn, homeBtn]);
        
        // Animate game over screen in with bounce
        gameOverContainer.setScale(0.3);
        gameOverContainer.setAlpha(0);
        this.tweens.add({
          targets: gameOverContainer,
          scale: 1,
          alpha: 1,
          duration: 800,
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
        
        // Show transition screen before redirect
        const transitionContainer = this.add.container(600, 300);
        transitionContainer.setDepth(4000);
        
        const overlay = this.add.rectangle(0, 0, 1200, 600, 0x000000, 0.9);
        const completedText = this.add.text(0, -50, '🎉 Flight Complete!', {
          fontSize: '42px',
          fill: results.passed ? '#44ff44' : '#ffaa44',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        const distanceText = this.add.text(0, 0, `Distance Traveled: ${results.distance}m`, {
          fontSize: '24px',
          fill: '#4488ff',
          fontWeight: 'bold'
        }).setOrigin(0.5);
        
        const redirectText = this.add.text(0, 40, 'Redirecting to results...', {
          fontSize: '18px',
          fill: '#ffffff'
        }).setOrigin(0.5);
        
        transitionContainer.add([overlay, completedText, distanceText, redirectText]);
        
        // Animate transition in
        transitionContainer.setAlpha(0);
        this.tweens.add({
          targets: transitionContainer,
          alpha: 1,
          duration: 600
        });
        
        // Save results and redirect after animation
        this.time.delayedCall(2500, () => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('gameResults', JSON.stringify(results));
            window.location.href = '/QuestGame/result';
          }
        });
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
          <p className="text-white">Loading Jetpack Game...</p>
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
      {/* Game Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
          🚀 Jetpack Quest
        </h1>
        <p className="text-gray-300 text-lg">Fly through the laboratory, collect coins, and answer questions!</p>
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
              <p className="text-white font-semibold">Loading Jetpack Game...</p>
              <p className="text-gray-400 text-sm mt-2">Initializing laboratory...</p>
            </div>
          </div>
        )}
      </div>

      {/* Game Instructions */}
      <div className="mt-8 max-w-5xl text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">🎮 Jetpack Controls</h2>
        <div className="grid md:grid-cols-4 gap-6 text-sm">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="font-semibold text-cyan-400 mb-3">Jetpack</h3>
            <p className="text-gray-300"><strong>Hold SPACE</strong> to activate jetpack</p>
            <p className="text-gray-300"><strong>Release</strong> to fall with gravity</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-yellow-400 mb-3">Fuel System</h3>
            <p className="text-gray-300">• Monitor fuel bar</p>
            <p className="text-gray-300">• Recharges when not flying</p>
            <p className="text-gray-300">• Plan your flights wisely</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-green-400 mb-3">Collect Coins</h3>
            <p className="text-gray-300">• Fly through coins (+5 pts)</p>
            <p className="text-gray-300">• Avoid laser beams</p>
            <p className="text-gray-300">• Dodge missiles</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold text-purple-400 mb-3">Questions</h3>
            <p className="text-gray-300">• Answer correctly (+20 pts)</p>
            <p className="text-gray-300">• Fly into answer zones</p>
            <p className="text-gray-300">• 70%+ to pass mission</p>
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
              🔄 Restart Flight
            </button>
          )}
        </div>
      )}
    </div>
  );
}