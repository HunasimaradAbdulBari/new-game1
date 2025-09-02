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
        console.log('Starting REDESIGNED UI Jetpack game...');
        
        await loadPhaserFromCDN();
        console.log('Phaser loaded successfully');
        
        const RedesignedJetpackScene = createRedesignedJetpackScene();
        console.log('Redesigned UI scene created');

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
          scene: RedesignedJetpackScene,
          scale: {
            mode: window.Phaser.Scale.FIT,
            autoCenter: window.Phaser.Scale.CENTER_BOTH,
            min: { width: 800, height: 500 },
            max: { width: 1920, height: 1080 }
          }
        };

        const game = new window.Phaser.Game(config);
        phaserGameRef.current = game;
        console.log('Redesigned UI Phaser game created');

        setTimeout(() => {
          try {
            const scene = game.scene.getScene('JetpackGameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
            console.log('Redesigned UI game loaded successfully!');
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

  const createRedesignedJetpackScene = () => {
    class JetpackGameScene extends window.Phaser.Scene {
      constructor() {
        super({ key: 'JetpackGameScene' });
        
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
        this.scrollSpeed = 200;
        this.normalScrollSpeed = 200;
        this.questionScrollSpeed = 200 / 1.1;

        this.player = null;
        this.obstacles = null;
        this.background = null;
        this.backgroundVideo = null;
        this.jetpackParticles = [];
        this.coins = null;
        this.answerZones = null;

        this.livesText = null;
        this.scoreText = null;
        this.distanceText = null;
        this.progressText = null;
        this.questionText = null;
        this.answerObjects = [];
        this.jetpackBar = null;

        this.cursors = null;
        this.spaceKey = null;
        this.obstacleTimer = null;
        this.coinTimer = null;

        this.questions = [];
        this.currentQuestionElements = [];
        this.currentInstructionText = null;
        this.answerProcessed = false;
        
        // MODIFIED: Distance-based question triggers with 30m interval
        this.nextQuestionDistance = 75; // First question at 75m
        this.questionInterval = 30; // MODIFIED: Next questions every 30m (was 60m)
      }

      init(data) {
        this.questions = data?.questions || QUESTIONS;
        
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
        this.answerProcessed = false;
        
        // MODIFIED: Reset distance triggers with 30m interval
        this.nextQuestionDistance = 75; // First question at 75m
        this.questionInterval = 30; // MODIFIED: Next questions every 30m (was 60m)
      }

      preload() {
        this.createRedesignedAssets();
        
        try {
          this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
          console.log('Loading custom bg.mp4...');
        } catch (error) {
          console.log('Custom bg.mp4 not found, will use fallback');
        }
      }

      createRedesignedAssets() {
        // NEW SLEEK JETPACK DESIGN
        const playerGraphics = this.add.graphics();
        
        // Main body - sleeker design
        playerGraphics.fillStyle(0x2E86AB, 1);
        playerGraphics.fillRoundedRect(15, 25, 35, 40, 8);
        
        // Cockpit window
        playerGraphics.fillStyle(0x74D3AE, 0.9);
        playerGraphics.fillCircle(32, 35, 12);
        playerGraphics.fillStyle(0xA23B72, 0.8);
        playerGraphics.fillCircle(32, 35, 8);
        
        // Wings - more spacious
        playerGraphics.fillStyle(0xF18F01, 1);
        playerGraphics.fillRoundedRect(5, 40, 20, 8, 4);
        playerGraphics.fillRoundedRect(40, 40, 20, 8, 4);
        
        // Thrusters - redesigned
        playerGraphics.fillStyle(0xC73E1D, 1);
        playerGraphics.fillRoundedRect(20, 65, 8, 15, 4);
        playerGraphics.fillRoundedRect(37, 65, 8, 15, 4);
        
        // Exhaust ports
        playerGraphics.fillStyle(0xFF6B35, 1);
        playerGraphics.fillCircle(24, 75, 3);
        playerGraphics.fillCircle(41, 75, 3);
        
        playerGraphics.generateTexture('redesigned-jetpack-player', 65, 85);
        playerGraphics.destroy();

        this.createRedesignedObstacles();
        this.createRedesignedCoin();
        this.createRedesignedBackground();
      }

      createRedesignedObstacles() {
        // More spaced out obstacle designs
        const laserGraphics = this.add.graphics();
        laserGraphics.fillStyle(0xFF4444, 0.9);
        laserGraphics.fillRoundedRect(0, 0, 25, 350, 5);
        laserGraphics.fillStyle(0xFFFFFF, 0.7);
        laserGraphics.fillRoundedRect(7, 0, 11, 350, 3);
        laserGraphics.generateTexture('redesigned-laser-obstacle', 25, 350);
        laserGraphics.destroy();

        const asteroidGraphics = this.add.graphics();
        asteroidGraphics.fillStyle(0x8B4513, 1);
        asteroidGraphics.fillCircle(30, 30, 28);
        asteroidGraphics.fillStyle(0xA0522D, 0.8);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const spikeX = 30 + Math.cos(angle) * 35;
          const spikeY = 30 + Math.sin(angle) * 35;
          asteroidGraphics.fillCircle(spikeX, spikeY, 8);
        }
        asteroidGraphics.generateTexture('redesigned-asteroid-obstacle', 60, 60);
        asteroidGraphics.destroy();

        const energyGraphics = this.add.graphics();
        energyGraphics.fillStyle(0x00FFFF, 0.8);
        energyGraphics.fillRoundedRect(0, 0, 40, 100, 20);
        energyGraphics.fillStyle(0xFFFFFF, 0.6);
        energyGraphics.fillRoundedRect(5, 5, 30, 90, 15);
        energyGraphics.generateTexture('redesigned-energy-obstacle', 40, 100);
        energyGraphics.destroy();
      }

      createRedesignedCoin() {
        // FIXED: Removed invalid fillText call
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xFFD700, 1);
        coinGraphics.fillCircle(20, 20, 18);
        coinGraphics.fillStyle(0xFFF8DC, 0.9);
        coinGraphics.fillCircle(20, 20, 14);
        coinGraphics.fillStyle(0xFFD700, 1);
        coinGraphics.fillCircle(20, 20, 8); // Inner decoration instead of text
        coinGraphics.generateTexture('redesigned-coin', 40, 40);
        coinGraphics.destroy();
      }

      createRedesignedBackground() {
        const bgGraphics = this.add.graphics();
        
        // Clean gradient background
        bgGraphics.fillGradientStyle(0x0B1426, 0x1A2332, 0x2D3748, 0x4A5568, 1);
        bgGraphics.fillRect(0, 0, 1400, 700);

        // Spaced out stars
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * 1400;
          const y = Math.random() * 300;
          const brightness = Math.random();
          if (brightness > 0.7) {
            bgGraphics.fillStyle(0xFFFFFF, brightness);
            bgGraphics.fillCircle(x, y, brightness > 0.9 ? 3 : 1);
          }
        }

        // Clean city silhouette with better spacing
        const cityColor = 0x1A202C;
        const buildingWidth = 80;
        const buildingSpacing = 20;
        const minHeight = 150;
        const maxHeight = 300;

        for (let x = 0; x <= 1400; x += buildingWidth + buildingSpacing) {
          const buildingH = window.Phaser.Math.Between(minHeight, maxHeight);
          
          bgGraphics.fillStyle(cityColor, 1);
          bgGraphics.fillRoundedRect(x, 700 - buildingH, buildingWidth, buildingH, 5);
          
          // Well-spaced windows
          const windowSize = 8;
          const windowSpacingX = 18;
          const windowSpacingY = 25;
          const rows = Math.floor(buildingH / (windowSize + windowSpacingY));
          const cols = Math.floor(buildingWidth / (windowSize + windowSpacingX));
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              if (window.Phaser.Math.Between(0, 100) > 40) {
                const wx = x + 10 + col * windowSpacingX;
                const wy = 700 - buildingH + 20 + row * windowSpacingY;
                
                bgGraphics.fillStyle(0xFED7AA, 0.9);
                bgGraphics.fillRoundedRect(wx, wy, windowSize, windowSize, 2);
              }
            }
          }
        }

        bgGraphics.generateTexture('redesigned-cityscape-background', 1400, 700);
        bgGraphics.destroy();
      }

      create() {
        console.log('Creating REDESIGNED UI jetpack game scene...');
        this.physics.world.setBounds(0, 0, 1400, 700);

        this.createScrollingBackground();
        this.createRedesignedPlayer();
        
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        this.createRedesignedUI();
        this.setupInput();

        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        this.startSpawning();
        console.log('REDESIGNED UI jetpack game scene created successfully!');
      }

      createScrollingBackground() {
        try {
          if (this.cache.video.exists('bgvideo')) {
            this.backgroundVideo = this.add.video(0, 0, 'bgvideo');
            this.backgroundVideo.setOrigin(0, 0);
            this.backgroundVideo.setDisplaySize(1400, 700);
            this.backgroundVideo.play(true);
            console.log('Using custom bg.mp4 background');

            this.backgroundOverlay = this.add.tileSprite(0, 0, 1400, 700, 'redesigned-cityscape-background');
            this.backgroundOverlay.setOrigin(0, 0);
            this.backgroundOverlay.setAlpha(0.7);
          } else {
            this.background = this.add.tileSprite(0, 0, 1400, 700, 'redesigned-cityscape-background');
            this.background.setOrigin(0, 0);
            console.log('Using redesigned cityscape background');
          }
        } catch (error) {
          console.warn('Background creation error, using fallback');
          this.background = this.add.tileSprite(0, 0, 1400, 700, 'redesigned-cityscape-background');
          this.background.setOrigin(0, 0);
        }
      }

      createRedesignedPlayer() {
        this.player = this.physics.add.sprite(120, 350, 'redesigned-jetpack-player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setScale(0.8);
        this.player.setSize(50, 65);
        this.player.setGravityY(0);
        this.player.setTint(0xFFFFFF);
      }

      createRedesignedUI() {
        // TOP LEFT - Game Stats (well-spaced)
        this.livesText = this.add.text(30, 30, 'Lives: ' + this.lives, {
          fontSize: '22px',
          fill: '#E2E8F0',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        });

        this.scoreText = this.add.text(30, 65, 'Score: ' + this.score, {
          fontSize: '22px',
          fill: '#68D391',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        });

        this.distanceText = this.add.text(30, 100, 'Distance: ' + this.distance + 'm', {
          fontSize: '18px',
          fill: '#90CDF4',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        });

        const totalQuestions = this.questions.length;
        this.progressText = this.add.text(30, 135, 'Question: ' + Math.min(this.questionIndex + 1, totalQuestions) + '/' + totalQuestions, {
          fontSize: '16px',
          fill: '#F6AD55',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        });

        // TOP RIGHT - Fuel bar only (removed overlapping text)
        this.createCleanFuelBar();
      }

      createCleanFuelBar() {
        // MODIFIED: Moved fuel bar down to avoid overlap with question
        this.fuelBarBg = this.add.rectangle(1200, 160, 160, 20, 0x2D3748);
        this.fuelBarBg.setStrokeStyle(2, 0xE2E8F0);
        this.fuelBar = this.add.rectangle(1200, 160, 150, 16, 0x68D391);

        this.fuelText = this.add.text(1200, 190, 'JETPACK FUEL', {
          fontSize: '12px',
          fill: '#E2E8F0',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5, 0);

        this.fuelPercentText = this.add.text(1200, 160, '100%', {
          fontSize: '10px',
          fill: '#1A202C',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);
      }

      setupInput() {
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
        const ripple = this.add.circle(x, y, 8, 0x68D391, 0.7);
        this.tweens.add({
          targets: ripple,
          radius: 40,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => ripple.destroy()
        });
      }

      startSpawning() {
        this.obstacleTimer = this.time.addEvent({
          delay: 2500,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true
        });

        this.coinTimer = this.time.addEvent({
          delay: 2000,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true
        });
      }

      spawnObstacle() {
        if (this.gameState !== 'PLAYING') return;

        const obstacleTypes = ['redesigned-laser-obstacle', 'redesigned-asteroid-obstacle', 'redesigned-energy-obstacle'];
        const randomType = window.Phaser.Math.RND.pick(obstacleTypes);
        let obstacle;
        let yPos = window.Phaser.Math.Between(200, 500);

        if (randomType === 'redesigned-laser-obstacle') {
          obstacle = this.obstacles.create(1450, yPos, randomType);
          obstacle.setSize(25, 350);
        } else if (randomType === 'redesigned-asteroid-obstacle') {
          obstacle = this.obstacles.create(1450, yPos, randomType);
          obstacle.setSize(50, 50);
          obstacle.setAngularVelocity(100);
        } else {
          obstacle = this.obstacles.create(1450, yPos, randomType);
          obstacle.setSize(35, 85);
        }

        obstacle.setVelocityX(-this.scrollSpeed);
        obstacle.setTint(0xFFAAAA);
      }

      spawnCoin() {
        if (this.gameState !== 'PLAYING') return;

        const x = window.Phaser.Math.Between(1450, 1600);
        const y = window.Phaser.Math.Between(200, 500);
        const coin = this.coins.create(x, y, 'redesigned-coin');
        coin.setVelocityX(-this.scrollSpeed);
        coin.setScale(1.0);
        coin.setCircle(18);

        this.tweens.add({
          targets: coin,
          scaleX: 1.2,
          scaleY: 1.2,
          rotation: Math.PI * 2,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      update() {
        if (this.spaceKey.isDown || this.jetpackActive) {
          if (this.jetpackFuel > 0) {
            this.player.setVelocityY(-320);
            this.jetpackFuel = Math.max(0, this.jetpackFuel - 1.0);
            this.createJetpackParticles();
            this.player.rotation = -0.2;
            this.player.setTint(0xAADDFF);
          }
        } else {
          this.player.setVelocityY(this.player.body.velocity.y + 15);
          this.jetpackFuel = Math.min(100, this.jetpackFuel + 0.6);
          this.player.rotation = Math.min(0.3, this.player.body.velocity.y * 0.001);
          this.player.setTint(0xFFFFFF);
        }

        this.updateFuelBar();

        if (this.gameState === 'PLAYING') {
          this.scrollSpeed = this.normalScrollSpeed;
          this.scrollBackground();
          this.distance += 0.12;
        } else if (this.gameState === 'QUESTION_ACTIVE') {
          this.scrollSpeed = this.questionScrollSpeed;
          this.scrollBackground();
          this.distance += 0.12 / 1.1;
        }

        this.cleanupObjects();

        if (this.gameState === 'PLAYING') {
          this.checkQuestionTrigger();
        }

        this.updateUI();
        this.updateParticles();

        if (this.gameState === 'QUESTION_ACTIVE') {
          this.updateMovingAnswers();
        }

        if (this.gameState === 'QUESTION_ACTIVE') {
          this.checkAnswerCollisions();
        }
      }

      createJetpackParticles() {
        for (let i = 0; i < 4; i++) {
          const particle = this.add.circle(
            this.player.x - 20 + window.Phaser.Math.Between(-8, 8),
            this.player.y + 25,
            window.Phaser.Math.Between(3, 6),
            window.Phaser.Math.RND.pick([0xF56565, 0xF6AD55, 0xFED7AA]),
            0.8
          );

          this.jetpackParticles.push(particle);

          this.tweens.add({
            targets: particle,
            x: particle.x - window.Phaser.Math.Between(30, 60),
            y: particle.y + window.Phaser.Math.Between(15, 40),
            alpha: 0,
            scale: 0.2,
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

      updateFuelBar() {
        const fuelPercent = this.jetpackFuel / 100;
        this.fuelBar.scaleX = fuelPercent;
        this.fuelPercentText.setText(Math.round(this.jetpackFuel) + '%');

        if (fuelPercent > 0.6) {
          this.fuelBar.setFillStyle(0x68D391);
        } else if (fuelPercent > 0.3) {
          this.fuelBar.setFillStyle(0xF6AD55);
        } else {
          this.fuelBar.setFillStyle(0xF56565);
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
          if (obstacle.x < -200) {
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

      // MODIFIED: Changed from obstacle-based to distance-based trigger
      checkQuestionTrigger() {
        if (this.distance >= this.nextQuestionDistance) {
          console.log(`Distance trigger reached: ${this.distance}m >= ${this.nextQuestionDistance}m`);
          this.showRedesignedQuestion();
        }
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 8;

        const coinText = this.add.text(coin.x, coin.y, '+8', {
          fontSize: '20px',
          fill: '#F6AD55',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        });

        this.tweens.add({
          targets: coinText,
          y: coinText.y - 40,
          alpha: 0,
          scale: 1.4,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => coinText.destroy()
        });
      }

      updateParticles() {
        this.jetpackParticles = this.jetpackParticles.filter(particle => particle && particle.active);
      }

      updateUI() {
        this.livesText.setText('Lives: ' + this.lives);
        this.scoreText.setText('Score: ' + this.score);
        this.distanceText.setText('Distance: ' + Math.floor(this.distance) + 'm');

        if (this.progressText) {
          const totalQuestions = this.questions.length;
          this.progressText.setText('Question: ' + Math.min(this.questionIndex + 1, totalQuestions) + '/' + totalQuestions);
        }
      }

      showRedesignedQuestion() {
        if (this.questionIndex >= this.questions.length) {
          this.showResults();
          return;
        }

        const question = this.questions[this.questionIndex];
        if (!question) {
          this.showResults();
          return;
        }

        console.log('Showing redesigned question', this.questionIndex + 1 + ':', question.question);
        this.gameState = 'QUESTION_ACTIVE';
        this.answerProcessed = false;

        this.obstacleTimer.paused = true;
        this.coinTimer.paused = true;

        this.obstacles.children.entries.forEach(obstacle => {
          obstacle.setVelocityX(-this.questionScrollSpeed);
          this.tweens.add({
            targets: obstacle,
            alpha: 0.3,
            duration: 600
          });
        });

        this.coins.children.entries.forEach(coin => {
          coin.setVelocityX(-this.questionScrollSpeed);
          this.tweens.add({
            targets: coin,
            alpha: 0.4,
            duration: 600
          });
        });

        this.showCleanQuestionUI(question);
        this.time.delayedCall(1000, () => {
          this.showTransparentAnswerZones(question);
        });
      }

      showCleanQuestionUI(question) {
        // MODIFIED: Added more top margin to avoid overlapping
        const questionBg = this.add.rectangle(700, -60, 900, 80, 0x2D3748, 0.95);
        questionBg.setStrokeStyle(2, 0x68D391);

        this.questionText = this.add.text(700, -60, question.question, {
          fontSize: '20px',
          fill: '#E2E8F0',
          align: 'center',
          fontWeight: 'bold',
          wordWrap: { width: 850 },
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: [questionBg, this.questionText],
          y: 50, // MODIFIED: Even higher position with more top margin
          duration: 700,
          ease: 'Back.easeOut'
        });

        this.currentQuestionElements = [questionBg, this.questionText];
      }

      showTransparentAnswerZones(question) {
        console.log('Creating properly aligned transparent answer zones...');
        this.clearAnswerObjects();

        const answerLabels = ['A', 'B', 'C', 'D'];
        this.answerObjects = [];

        // MODIFIED: Centered X position for perfect vertical alignment
        const centerX = 1500;

        for (let i = 0; i < question.answers.length; i++) {
          // MODIFIED: Perfectly aligned vertical positioning with consistent spacing
          const yPos = 200 + (i * 120); // MODIFIED: Consistent 120px spacing for perfect alignment

          // MODIFIED: More transparent background, removed green border
          const answerBg = this.add.rectangle(centerX, yPos, 500, 100, 0xE8E8E8, 0.4); // MODIFIED: Reduced opacity from 0.85 to 0.4 for more transparency
          // REMOVED: Green border - no setStrokeStyle call
          
          const answerLabel = this.add.text(centerX - 220, yPos, answerLabels[i], {
            fontSize: '28px',
            fill: '#F6AD55',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            stroke: '#1A202C',
            strokeThickness: 3
          }).setOrigin(0.5);

          const answerText = this.add.text(centerX, yPos, question.answers[i], {
            fontSize: '18px',
            fill: '#1A202C',
            align: 'center',
            fontWeight: 'bold',
            wordWrap: { width: 450 },
            fontFamily: 'Arial, sans-serif'
          }).setOrigin(0.5);

          const answerObj = {
            bg: answerBg,
            label: answerLabel,
            text: answerText,
            answered: false,
            answerIndex: i,
            answerText: question.answers[i],
            currentX: centerX,
            currentY: yPos,
            moveSpeed: -182.8125, // MODIFIED: 1.25x faster (from -146.25 to -182.8125)
            isMoving: false,
            hasPassedPlayer: false
          };

          this.answerObjects.push(answerObj);

          // Start invisible
          answerBg.setAlpha(0);
          answerLabel.setAlpha(0);
          answerText.setAlpha(0);

          // Fade in with stagger
          this.tweens.add({
            targets: [answerBg, answerLabel, answerText],
            alpha: 1,
            duration: 500,
            delay: i * 150,
            ease: 'Power2.easeOut',
            onComplete: () => {
              answerObj.isMoving = true;
              console.log('Answer zone', i, 'now moving at', answerObj.moveSpeed, 'pixels/second');
            }
          });
        }

        this.time.delayedCall(800, () => {
          this.showCleanInstruction();
        });
      }

      updateMovingAnswers() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.answerObjects) return;

        const deltaTime = this.game.loop.delta / 1000;

        for (let i = 0; i < this.answerObjects.length; i++) {
          const answerObj = this.answerObjects[i];
          if (!answerObj.isMoving) continue;

          answerObj.currentX += answerObj.moveSpeed * deltaTime;

          answerObj.bg.x = answerObj.currentX;
          answerObj.label.x = answerObj.currentX - 220;
          answerObj.text.x = answerObj.currentX;

          if (answerObj.currentX < -300) {
            answerObj.isMoving = false;
          }
        }
      }

      checkAnswerCollisions() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.player || !this.answerObjects || this.answerProcessed) return;

        const playerBounds = this.player.getBounds();

        for (let i = 0; i < this.answerObjects.length; i++) {
          const answerObj = this.answerObjects[i];
          if (!answerObj.isMoving) continue;

          const bounds = {
            x: answerObj.currentX - 250,
            y: answerObj.currentY - 50,
            width: 500,
            height: 100
          };

          const isColliding = playerBounds.x < bounds.x + bounds.width &&
                             playerBounds.x + playerBounds.width > bounds.x &&
                             playerBounds.y < bounds.y + bounds.height &&
                             playerBounds.y + playerBounds.height > bounds.y;

          if (isColliding && !answerObj.hasPassedPlayer) {
            answerObj.hasPassedPlayer = true;
            console.log('Player selected answer', i + ':', answerObj.answerText);
            this.selectAnswer(i);
            return;
          }
        }
      }

      showCleanInstruction() {
        const instruction = this.add.text(700, 650, 'Fly your jetpack through the correct answer!', {
          fontSize: '16px',
          fill: '#FED7D7',
          align: 'center',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          stroke: '#1A202C',
          strokeThickness: 2
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

      selectAnswer(answerIndex) {
        console.log('Selecting answer', answerIndex);
        if (this.answerProcessed) return;
        
        const answerObj = this.answerObjects[answerIndex];
        if (!answerObj) return;

        this.answerProcessed = true;

        const question = this.questions[this.questionIndex];
        const selectedAnswer = question.answers[answerIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;

        if (isCorrect) {
          console.log('CORRECT!');
          
          // Show success feedback
          answerObj.bg.setFillStyle(0x68D391);
          answerObj.bg.setAlpha(0.8);
          
          this.createSuccessEffect(answerObj.bg.x, answerObj.bg.y);
          
          this.score += 25;
          this.correctAnswers++;
          this.questionIndex++;

          // MODIFIED: Set next question distance after answering (30m interval)
          this.nextQuestionDistance = this.distance + this.questionInterval;
          console.log(`Next question will appear at ${this.nextQuestionDistance}m`);

          const scorePopup = this.add.text(answerObj.bg.x, answerObj.bg.y - 50, '+25', {
            fontSize: '36px',
            fill: '#68D391',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
          }).setOrigin(0.5);

          this.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 1400,
            ease: 'Power2',
            onComplete: () => scorePopup.destroy()
          });

          this.time.delayedCall(2500, () => this.hideQuestion());
        } else {
          console.log('WRONG!');
          
          answerObj.bg.setFillStyle(0xF56565);
          answerObj.bg.setAlpha(0.8);

          this.showCorrectAnswer(question.correctAnswer);
          this.cameras.main.shake(400, 0.02);

          this.lives--;
          this.wrongAnswers++;

          // MODIFIED: Set next question distance after wrong answer too (30m interval)
          this.nextQuestionDistance = this.distance + this.questionInterval;
          console.log(`Next question will appear at ${this.nextQuestionDistance}m`);

          const damageText = this.add.text(this.player.x, this.player.y - 50, '-1 LIFE', {
            fontSize: '28px',
            fill: '#F56565',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
          }).setOrigin(0.5);

          this.tweens.add({
            targets: damageText,
            y: damageText.y - 60,
            alpha: 0,
            duration: 1400,
            onComplete: () => damageText.destroy()
          });

          if (this.lives <= 0) {
            this.gameState = 'GAME_OVER';
            this.time.delayedCall(1800, () => this.gameOver());
          } else {
            this.time.delayedCall(3000, () => this.hideQuestion());
          }
        }
      }

      showCorrectAnswer(correctAnswer) {
        this.answerObjects.forEach((answerObj, index) => {
          const question = this.questions[this.questionIndex];
          if (question.answers[index] === correctAnswer) {
            // MODIFIED: Only highlight with green color, no tick mark
            this.tweens.add({
              targets: answerObj.bg,
              alpha: 0.9,
              duration: 300,
              yoyo: true,
              repeat: 3,
              onStart: () => {
                answerObj.bg.setFillStyle(0x68D391); // Green highlight only
              }
            });

            // REMOVED: Tick mark - no checkmark creation
          }
        });
      }

      createSuccessEffect(x, y) {
        const colors = [0x68D391, 0x90CDF4, 0xF6AD55, 0xFED7AA];
        for (let i = 0; i < 12; i++) {
          const particle = this.add.circle(x, y, window.Phaser.Math.Between(4, 8), colors[i % colors.length]);
          const angle = (i / 12) * Math.PI * 2;
          const distance = 80 + Math.random() * 40;
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.3,
            duration: 1100,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      hideQuestion() {
        console.log('Hiding question UI');
        
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
        }

        this.clearAnswerObjects();

        if (this.questionIndex >= this.questions.length) {
          this.time.delayedCall(800, () => this.showResults());
          return;
        }

        this.time.delayedCall(1000, () => {
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
        if (this.answerObjects && this.answerObjects.length > 0) {
          this.answerObjects.forEach(answerObj => {
            if (answerObj.bg && answerObj.bg.active) answerObj.bg.destroy();
            if (answerObj.label && answerObj.label.active) answerObj.label.destroy();
            if (answerObj.text && answerObj.text.active) answerObj.text.destroy();
          });
        }
        this.answerObjects = [];
      }

      hitObstacle(player, obstacle) {
        if (this.isInvulnerable || this.gameState !== 'PLAYING') return;

        obstacle.destroy();
        this.cameras.main.shake(350, 0.03);

        this.lives--;
        this.wrongAnswers++;

        this.isInvulnerable = true;
        this.player.setTint(0xFF6B6B);

        this.tweens.add({
          targets: this.player,
          alpha: 0.3,
          duration: 150,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            this.player.clearTint();
            this.player.setAlpha(1);
          }
        });

        const damageText = this.add.text(this.player.x, this.player.y - 50, '-1 LIFE', {
          fontSize: '24px',
          fill: '#F56565',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: damageText,
          y: damageText.y - 60,
          alpha: 0,
          duration: 1400,
          onComplete: () => damageText.destroy()
        });

        if (this.invulnerabilityTimer) {
          this.invulnerabilityTimer.destroy();
        }

        this.invulnerabilityTimer = this.time.delayedCall(1500, () => {
          this.isInvulnerable = false;
          this.invulnerabilityTimer = null;
        });

        if (this.lives <= 0) {
          this.gameState = 'GAME_OVER';
          this.time.delayedCall(1000, () => this.gameOver());
        }
      }

      gameOver() {
        this.gameState = 'GAME_OVER';

        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();

        const gameOverContainer = this.add.container(700, 350);
        gameOverContainer.setDepth(3000);

        const overlay = this.add.rectangle(0, 0, 1400, 700, 0x1A202C, 0.95);
        
        const gameOverText = this.add.text(0, -100, 'MISSION FAILED', {
          fontSize: '54px',
          fill: '#F56565',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const statsText = this.add.text(0, -20, 
          `Final Score: ${this.score}\n` +
          `Distance: ${Math.floor(this.distance)}m\n` +
          `Questions: ${this.questionIndex}/${this.questions.length}\n` +
          `Correct: ${this.correctAnswers} | Wrong: ${this.wrongAnswers}\n` +
          `Accuracy: ${accuracy}%`, {
          fontSize: '18px',
          fill: '#E2E8F0',
          align: 'center',
          lineSpacing: 8,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(0, 80, 'Restart Mission', {
          fontSize: '24px',
          fill: '#1A202C',
          backgroundColor: '#68D391',
          padding: { x: 30, y: 15 },
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setInteractive();

        const homeBtn = this.add.text(0, 130, 'Return Home', {
          fontSize: '20px',
          fill: '#E2E8F0',
          backgroundColor: '#2D3748',
          padding: { x: 25, y: 12 },
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => {
          restartBtn.setScale(1.05);
          restartBtn.setStyle({ backgroundColor: '#4FD1C7' });
        });

        restartBtn.on('pointerout', () => {
          restartBtn.setScale(1);
          restartBtn.setStyle({ backgroundColor: '#68D391' });
        });

        homeBtn.on('pointerover', () => {
          homeBtn.setScale(1.05);
          homeBtn.setStyle({ backgroundColor: '#4A5568' });
        });

        homeBtn.on('pointerout', () => {
          homeBtn.setScale(1);
          homeBtn.setStyle({ backgroundColor: '#2D3748' });
        });

        restartBtn.on('pointerdown', () => {
          this.scene.restart({ questions: this.questions });
        });

        homeBtn.on('pointerdown', () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        });

        gameOverContainer.add([overlay, gameOverText, statsText, restartBtn, homeBtn]);
        gameOverContainer.setAlpha(0);

        this.tweens.add({
          targets: gameOverContainer,
          alpha: 1,
          duration: 800,
          ease: 'Power2'
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

        const transitionContainer = this.add.container(700, 350);
        transitionContainer.setDepth(4000);

        const overlay = this.add.rectangle(0, 0, 1400, 700, 0x1A202C, 0.95);
        
        const completedText = this.add.text(0, -50, 'Mission Complete!', {
          fontSize: '48px',
          fill: results.passed ? '#68D391' : '#F6AD55',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const scoreText = this.add.text(0, 10, `Final Score: ${results.score} points`, {
          fontSize: '24px',
          fill: '#90CDF4',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const redirectText = this.add.text(0, 50, 'Preparing results...', {
          fontSize: '16px',
          fill: '#E2E8F0',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        transitionContainer.add([overlay, completedText, scoreText, redirectText]);
        transitionContainer.setAlpha(0);

        this.tweens.add({
          targets: transitionContainer,
          alpha: 1,
          duration: 700,
          ease: 'Power2'
        });

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

  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: 'linear-gradient(45deg, #0B1426, #1A2332)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>Loading Redesigned Game...</div>
          <div style={{ fontSize: '16px', opacity: 0.7 }}>Preparing clean UI systems...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(45deg, #1A202C, #2D3748)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '20px' }}>Game Error</div>
        <div style={{ fontSize: '18px', marginBottom: '30px', maxWidth: '600px' }}>{error}</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={handleReloadClick}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#68D391',
              color: '#1A202C',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Game
          </button>
          <button 
            onClick={handleHomeClick}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#2D3748',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      overflow: 'hidden',
      background: 'linear-gradient(45deg, #0B1426, #1A2332)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {isLoading && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(45deg, #0B1426, #1A2332)',
          color: 'white',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>Loading Redesigned Game...</div>
            <div style={{ fontSize: '16px', opacity: 0.7 }}>Preparing clean systems...</div>
          </div>
        </div>
      )}
      
      <div 
        ref={gameRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }} 
      />
      
      {gameLoaded && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '10px',
          zIndex: 100
        }}>
          <button 
            onClick={handleRestartClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#68D391',
              color: '#1A202C',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/>
            </svg>
            Restart
          </button>
          <button 
            onClick={handleHomeClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2D3748',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M11.293 3.293a1 1 0 0 1 1.414 0l6 6 2 2a1 1 0 0 1-1.414 1.414L19 12.414V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-3h-2v3a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-6.586l-.293.293a1 1 0 0 1-1.414-1.414l2-2 6-6Z" clipRule="evenodd"/>
            </svg>
            Home
          </button>
        </div>
      )}
    </div>
  );
}
