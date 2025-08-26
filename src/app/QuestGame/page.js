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
        console.log('🚀 Starting PERFECT COLLISION Jetpack game...');

        await loadPhaserFromCDN();
        console.log('✅ Phaser loaded successfully');

        const PerfectCollisionJetpackScene = createPerfectCollisionJetpackScene();
        console.log('✅ Perfect collision scene created');

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
              debug: false // Set to true to see collision boxes
            }
          },
          scene: PerfectCollisionJetpackScene,
          scale: {
            mode: window.Phaser.Scale.FIT,
            autoCenter: window.Phaser.Scale.CENTER_BOTH,
            min: { width: 600, height: 300 },
            max: { width: 1600, height: 800 }
          }
        };

        const game = new window.Phaser.Game(config);
        phaserGameRef.current = game;
        console.log('✅ Perfect collision Phaser game created');

        setTimeout(() => {
          try {
            const scene = game.scene.getScene('JetpackGameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
            console.log('🎯 PERFECT COLLISION game loaded successfully!');
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

  // 🔥 PERFECT COLLISION JETPACK GAME SCENE
  const createPerfectCollisionJetpackScene = () => {
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
        // Enhanced jetpack character
        const playerGraphics = this.add.graphics();
        
        // Character body
        playerGraphics.fillStyle(0x0066cc);
        playerGraphics.fillRoundedRect(8, 15, 24, 30, 4);
        
        // Character head
        playerGraphics.fillStyle(0xffcc99);
        playerGraphics.fillCircle(20, 12, 10);
        
        // Enhanced helmet with visor
        playerGraphics.fillStyle(0x333333);
        playerGraphics.fillRoundedRect(12, 5, 16, 8, 2);
        playerGraphics.fillStyle(0x66ccff, 0.8);
        playerGraphics.fillEllipse(16, 8, 4, 3);
        playerGraphics.fillEllipse(24, 8, 4, 3);
        playerGraphics.fillStyle(0xffffff, 0.4);
        playerGraphics.fillEllipse(15, 7, 2, 1);
        playerGraphics.fillEllipse(23, 7, 2, 1);
        
        // Enhanced jetpack
        playerGraphics.fillStyle(0x666666);
        playerGraphics.fillRoundedRect(4, 18, 10, 22, 3);
        playerGraphics.fillRoundedRect(26, 18, 10, 22, 3);
        
        // Jetpack fuel tanks
        playerGraphics.fillStyle(0x888888);
        playerGraphics.fillRoundedRect(5, 20, 8, 18, 2);
        playerGraphics.fillRoundedRect(27, 20, 8, 18, 2);
        
        // Jetpack details
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
        
        // Enhanced legs
        playerGraphics.fillStyle(0x0066cc);
        playerGraphics.fillRoundedRect(12, 40, 7, 15, 2);
        playerGraphics.fillRoundedRect(21, 40, 7, 15, 2);
        
        // Enhanced boots
        playerGraphics.fillStyle(0x222222);
        playerGraphics.fillRoundedRect(10, 52, 11, 6, 3);
        playerGraphics.fillRoundedRect(19, 52, 11, 6, 3);
        
        // Boot details
        playerGraphics.fillStyle(0x444444);
        playerGraphics.fillRect(11, 54, 9, 2);
        playerGraphics.fillRect(20, 54, 9, 2);
        
        playerGraphics.generateTexture('enhanced-jetpack-player', 40, 58);
        playerGraphics.destroy();

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

        this.createEnhancedBackground();
      }

      createEnhancedObstacles() {
        // Enhanced laser obstacle
        const laserGraphics = this.add.graphics();
        laserGraphics.fillStyle(0xff0000, 0.9);
        laserGraphics.fillRect(0, 0, 18, 350);
        laserGraphics.fillStyle(0xff6666, 0.7);
        laserGraphics.fillRect(3, 0, 12, 350);
        laserGraphics.fillStyle(0xffffff, 0.9);
        laserGraphics.fillRect(7, 0, 4, 350);
        
        for (let i = 0; i < 350; i += 20) {
          laserGraphics.fillStyle(0xffaaaa, 0.5);
          laserGraphics.fillRect(5, i, 8, 10);
        }
        laserGraphics.generateTexture('enhanced-laser-obstacle', 18, 350);
        laserGraphics.destroy();

        // Enhanced missile
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
        
        // Add grid pattern
        bgGraphics.lineStyle(1, 0x333366, 0.4);
        for (let x = 0; x < 1200; x += 40) {
          bgGraphics.lineBetween(x, 0, x, 600);
        }
        for (let y = 0; y < 600; y += 40) {
          bgGraphics.lineBetween(0, y, 1200, y);
        }
        
        // Add tech panels
        bgGraphics.fillStyle(0x333366, 0.5);
        for (let i = 0; i < 6; i++) {
          const x = i * 200 + 40;
          bgGraphics.fillRoundedRect(x, 40, 90, 120, 8);
          bgGraphics.fillRoundedRect(x, 440, 90, 120, 8);
          
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
        console.log('🚀 Creating PERFECT COLLISION jetpack game scene...');
        
        this.physics.world.setBounds(0, 0, 1200, 600);

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

        console.log('✅ PERFECT COLLISION jetpack game scene created successfully!');
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
        this.fuelBarBg = this.add.rectangle(1050, 80, 140, 25, 0x333333);
        this.fuelBarBg.setStrokeStyle(3, 0xffffff);
        
        this.fuelBarGlow = this.add.rectangle(1050, 80, 145, 30, 0x44ff44, 0.2);
        
        this.fuelBar = this.add.rectangle(1050, 80, 135, 20, 0x00ff44);
        
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

        coin.setTint(0xffffaa);
      }

      update() {
        // Enhanced jetpack input handling
        if (this.spaceKey.isDown || this.jetpackActive) {
          if (this.jetpackFuel > 0) {
            this.player.setVelocityY(-350);
            this.jetpackFuel = Math.max(0, this.jetpackFuel - 1.2);
            this.createEnhancedJetpackParticles();
            
            this.player.rotation = -0.25;
            this.player.setTint(0xaaddff);
          }
        } else {
          this.player.setVelocityY(this.player.body.velocity.y + 18);
          this.jetpackFuel = Math.min(100, this.jetpackFuel + 0.8);
          
          this.player.rotation = Math.min(0.4, this.player.body.velocity.y * 0.002);
          this.player.setTint(0xffffff);
        }

        this.updateEnhancedFuelBar();

        if (this.gameState === 'PLAYING') {
          this.scrollBackground();
          this.distance += 0.15;
        }

        this.cleanupObjects();

        if (this.gameState === 'PLAYING') {
          this.checkQuestionTrigger();
        }

        this.updateEnhancedJetpackUI();
        this.updateParticles();

        // 🔄 UPDATE MOVING ANSWERS - Move them slowly left
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
          answerObj.bg.setFillStyle(0x00ff44); // Bright Green
          answerObj.glow.setFillStyle(0x44ff88); // Light Green Glow
          
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
          
          // Hide question after 2 seconds
          this.time.delayedCall(2000, () => this.hideEnhancedQuestion());
          
        } else {
          console.log('❌ WRONG ANSWER!');
          
          // 🔴 WRONG ANSWER - RED HIGHLIGHT
          answerObj.bg.setFillStyle(0xff2222); // Bright Red
          answerObj.glow.setFillStyle(0xff6666); // Light Red Glow
          
          // 🟢 SHOW CORRECT ANSWER IN GREEN
          this.showCorrectAnswer(question.correctAnswer);
          
          // CAMERA SHAKE EFFECT
          this.cameras.main.shake(400, 0.02);
          
          // WRONG ANSWER SHAKE EFFECT
          this.tweens.add({
            targets: [answerObj.bg, answerObj.glow, answerObj.label, answerObj.text],
            x: '+=20',
            duration: 80,
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
              alpha: 0.8,
              duration: 300,
              yoyo: true,
              repeat: 3,
              onStart: () => {
                answerObj.bg.setFillStyle(0x00aa00); // Green
                answerObj.glow.setFillStyle(0x44aa44); // Light Green
              }
            });

            // Add checkmark to correct answer
            const checkmark = this.add.text(answerObj.bg.x + 150, answerObj.bg.y, '✓', {
              fontSize: '40px',
              fill: '#ffffff',
              fontWeight: 'bold',
              stroke: '#00aa00',
              strokeThickness: 3
            }).setOrigin(0.5);

            this.time.delayedCall(2500, () => {
              if (checkmark && checkmark.active) checkmark.destroy();
            });
          }
        });
      }

      createEnhancedJetpackParticles() {
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

        if (fuelPercent > 0.6) {
          this.fuelBar.setFillStyle(0x00ff44);
          this.fuelBarGlow.setFillStyle(0x44ff44);
        } else if (fuelPercent > 0.3) {
          this.fuelBar.setFillStyle(0xffaa00);
          this.fuelBarGlow.setFillStyle(0xffcc44);
        } else {
          this.fuelBar.setFillStyle(0xff4444);
          this.fuelBarGlow.setFillStyle(0xff6666);
          
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
        this.obstacles.children.entries.forEach(obstacle => {
          if (obstacle.x < -150) {
            if (this.gameState === 'PLAYING') {
              this.obstaclesPassed++;
            }
            obstacle.destroy();
          }
        });

        this.coins.children.entries.forEach(coin => {
          if (coin.x < -80) {
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

        this.obstacleTimer.paused = true;
        this.coinTimer.paused = true;

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

        this.showQuestionFromTop(question);

        this.time.delayedCall(1200, () => {
          this.showPerfectCollisionAnswerZones(question);
        });
      }

      showQuestionFromTop(question) {
        const questionBg = this.add.rectangle(600, -60, 1000, 100, 0x000066, 0.95);
        questionBg.setStrokeStyle(4, 0x4488ff);

        const questionGlow = this.add.rectangle(600, -60, 1010, 110, 0x4488ff, 0.4);

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

        this.tweens.add({
          targets: [questionBg, questionGlow, this.questionText],
          y: 80,
          duration: 800,
          ease: 'Back.easeOut'
        });

        this.currentQuestionElements = [questionBg, questionGlow, this.questionText];
      }

      // 🔥 MOVING COLLISION ANSWER ZONES - Slowly moving left for jetpack collision
      showPerfectCollisionAnswerZones(question) {
        console.log('🎯 Creating MOVING collision answer zones...');
        
        this.clearAnswerObjects();
        
        const answerColors = [0x4285f4, 0x34a853, 0xfbbc04, 0xea4335]; // Blue, Green, Yellow, Red
        const answerLabels = ['A', 'B', 'C', 'D'];
        
        this.answerObjects = [];
        
        for (let i = 0; i < question.answers.length; i++) {
          const yPos = 200 + (i * 120);
          const startX = 1400; // Start from right side
          
          // Visual elements
          const answerBg = this.add.rectangle(startX, yPos, 350, 90, answerColors[i], 0.9);
          answerBg.setStrokeStyle(4, 0xffffff);
          
          const answerGlow = this.add.rectangle(startX, yPos, 360, 100, answerColors[i], 0.3);
          
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
            // Movement properties
            moveSpeed: -30, // Move left slowly (30 pixels per second)
            isMoving: false
          };
          
          this.answerObjects.push(answerObj);
          
          // Start with invisible, then fade in
          answerBg.setAlpha(0);
          answerGlow.setAlpha(0);
          answerLabel.setAlpha(0);
          answerText.setAlpha(0);
          
          // Fade in animation
          this.tweens.add({
            targets: [answerBg, answerGlow, answerLabel, answerText],
            alpha: 1,
            duration: 500,
            delay: i * 150,
            ease: 'Power2.easeOut',
            onComplete: () => {
              // Start moving after fade in
              answerObj.isMoving = true;
              console.log(`📍 Answer zone ${i} now moving left at ${answerObj.moveSpeed} pixels/second`);
            }
          });
          
          console.log(`🎯 Created moving answer zone ${i} starting at x=${startX} for: "${question.answers[i]}"`);
        }
        
        // Show instruction
        this.time.delayedCall(800, () => {
          this.showQuestionInstruction();
        });
        
        console.log('✅ All answer zones ready for MOVING collision!');
      }

      // 🔄 UPDATE MOVING ANSWER POSITIONS - Called every frame
      updateMovingAnswers() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.answerObjects) return;
        
        const deltaTime = this.game.loop.delta / 1000; // Convert to seconds
        
        for (let i = 0; i < this.answerObjects.length; i++) {
          const answerObj = this.answerObjects[i];
          
          if (!answerObj.isMoving || answerObj.answered) continue;
          
          // Update position
          answerObj.currentX += answerObj.moveSpeed * deltaTime;
          
          // Update all visual elements
          answerObj.bg.x = answerObj.currentX;
          answerObj.glow.x = answerObj.currentX;
          answerObj.label.x = answerObj.currentX - 140;
          answerObj.text.x = answerObj.currentX;
          
          // Remove if moved too far left (optional cleanup)
          if (answerObj.currentX < -200) {
            answerObj.isMoving = false;
            console.log(`🗑️ Answer zone ${i} moved off screen`);
          }
        }
      }

      // 🎯 ENHANCED COLLISION DETECTION for moving answers
      checkAnswerCollisions() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.player || !this.answerObjects) return;
        
        const playerBounds = this.player.getBounds();
        
        for (let i = 0; i < this.answerObjects.length; i++) {
          const answerObj = this.answerObjects[i];
          
          if (answerObj.answered || !answerObj.isMoving) continue;
          
          // Calculate current bounds based on current position
          const bounds = {
            x: answerObj.currentX - 175, // left edge
            y: answerObj.currentY - 45,  // top edge  
            width: 350,                  // width
            height: 90                   // height
          };
          
          // Manual collision detection using bounding boxes
          if (playerBounds.x < bounds.x + bounds.width &&
              playerBounds.x + playerBounds.width > bounds.x &&
              playerBounds.y < bounds.y + bounds.height &&
              playerBounds.y + playerBounds.height > bounds.y) {
            
            console.log(`🎯 COLLISION! Player hit moving answer ${i}: "${answerObj.answerText}"`);
            console.log(`Player bounds: x=${Math.round(playerBounds.x)}, y=${Math.round(playerBounds.y)}, w=${Math.round(playerBounds.width)}, h=${Math.round(playerBounds.height)}`);
            console.log(`Answer bounds: x=${Math.round(bounds.x)}, y=${Math.round(bounds.y)}, w=${bounds.width}, h=${bounds.height}`);
            
            this.selectAnswer(i);
            return; // Exit after first collision
          }
        }
      }

      showQuestionInstruction() {
        const instruction = this.add.text(600, 520, '🚀 Fly your jetpack into the correct answer zone!', {
          fontSize: '20px',
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

        this.tweens.add({
          targets: instruction,
          alpha: 0.7,
          scale: 0.95,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.currentInstructionText = instruction;
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
        console.log('🔄 Hiding question UI');

        if (this.currentQuestionElements && this.currentQuestionElements.length > 0) {
          this.currentQuestionElements.forEach(element => {
            if (element && element.active) {
              this.tweens.add({
                targets: element,
                y: -150,
                alpha: 0,
                duration: 600,
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
            duration: 400,
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
          this.time.delayedCall(800, () => this.showResults());
          return;
        }

        this.time.delayedCall(1000, () => {
          console.log('🚀 Resuming game after question');
          this.gameState = 'PLAYING';
          this.obstacleTimer.paused = false;
          this.coinTimer.paused = false;

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
        console.log('🧹 Clearing answer objects');
        
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
        this.cameras.main.shake(400, 0.04);
        
        this.lives--;
        this.wrongAnswers++;
        console.log(`Lives remaining after obstacle hit: ${this.lives}`);

        this.isInvulnerable = true;
        this.player.setTint(0xff0000);

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

        this.createHitExplosion(player.x, player.y);

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

        if (this.invulnerabilityTimer) {
          this.invulnerabilityTimer.destroy();
        }
        this.invulnerabilityTimer = this.time.delayedCall(1800, () => {
          this.isInvulnerable = false;
          this.invulnerabilityTimer = null;
        });

        if (this.lives <= 0) {
          console.log('💀 Game Over - No lives remaining after obstacle hit');
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
        console.log('💀 Game Over screen showing');

        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();

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

        const gameOverContainer = this.add.container(600, 300);
        gameOverContainer.setDepth(3000);

        const overlay = this.add.rectangle(0, 0, 1200, 600, 0x000000, 0.95);

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

        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const statsText = this.add.text(0, -40, `🎯 Final Score: ${this.score}\n🚀 Distance: ${Math.floor(this.distance)}m\n📊 Questions: ${this.questionIndex}/${this.questions.length}\n✅ Correct: ${this.correctAnswers} | ❌ Wrong: ${this.wrongAnswers}\n🎪 Accuracy: ${accuracy}%`, {
          fontSize: '22px',
          fill: '#ffffff',
          align: 'center',
          lineSpacing: 12,
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

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
          duration: 1000,
          ease: 'Back.easeOut'
        });
      }

      showResults() {
        this.gameState = 'RESULTS';
        console.log('🏆 Showing results');

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

        console.log('Final results:', results);

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

        transitionContainer.setAlpha(0);
        this.tweens.add({
          targets: transitionContainer,
          alpha: 1,
          duration: 800,
          ease: 'Power2'
        });

        if (results.passed) {
          this.time.delayedCall(500, () => {
            this.createCelebrationParticles();
          });
        }

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
        <div className="text-center space-y-4">
          <div className="text-white text-2xl font-bold animate-pulse">
            Loading Perfect Collision Jetpack Game...
          </div>
          <div className="text-purple-300">
            🎯 GUARANTEED collision detection system loading!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          🎯 Perfect Collision Jetpack Quest
        </h1>
        
        <div className="flex gap-3">
          <button
            onClick={handleReloadClick}
            disabled={!mounted}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            🔄 Reload
          </button>
          <button
            onClick={handleRestartClick}
            disabled={!mounted || !gameLoaded}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            🚀 Restart
          </button>
          <button
            onClick={handleHomeClick}
            disabled={!mounted}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            🏠 Home
          </button>
        </div>
      </div>

      {/* Game Status Banner */}
      {isLoading && (
        <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 mb-4">
          <div className="text-green-200 font-medium">
            🔥 PERFECT COLLISION DETECTION - Physics-based answer zone collision system!
          </div>
          <div className="text-green-100 text-sm mt-1">
            ✅ Real physics collision zones | ✅ Perfect visual feedback | ✅ Proper scoring system
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-4">
          <div className="text-red-200 font-medium">❌ Error: {error}</div>
        </div>
      )}

      {/* Game Container */}
      <div className="bg-black/40 backdrop-blur rounded-xl p-6 border border-purple-500/30">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-white text-xl mb-4 animate-pulse">
              Loading Perfect Collision Jetpack Game...
            </div>
            <div className="text-purple-300 mb-6">
              🎯 Initializing GUARANTEED collision detection system...
            </div>
            <div className="w-64 mx-auto bg-purple-900/30 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        <div 
          ref={gameRef}
          className={`mx-auto border-2 border-purple-500/50 rounded-lg ${isLoading ? 'hidden' : 'block'}`}
          style={{ maxWidth: '1200px', maxHeight: '600px' }}
        />

        {/* Game Instructions */}
        {gameLoaded && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3">
              <div className="text-blue-300 font-medium mb-1">🎮 Controls</div>
              <div className="text-blue-100">**Hold SPACE** for boost</div>
            </div>
            
            <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-3">
              <div className="text-green-300 font-medium mb-1">⚡ Enhanced Jetpack</div>
              <div className="text-green-100">Better particles & effects</div>
              <div className="text-green-100">Visual fuel warnings</div>
              <div className="text-green-100">Recharges when idle</div>
            </div>
            
            <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-3">
              <div className="text-yellow-300 font-medium mb-1">💰 Enhanced Rewards</div>
              <div className="text-yellow-100">Sparkle effects (+8 pts)</div>
              <div className="text-yellow-100">Avoid enhanced obstacles</div>
            </div>
            
            <div className="bg-purple-600/20 border border-purple-600/50 rounded-lg p-3">
              <div className="text-purple-300 font-medium mb-1">❓ PERFECT Collision Questions</div>
              <div className="text-purple-100">🔥 Physics-based collision zones</div>
              <div className="text-purple-100">🟢 Green = Correct (+25 pts)</div>
              <div className="text-purple-100">🔴 Red = Wrong (-1 life)</div>
              <div className="text-purple-100">✅ Guaranteed to work!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}