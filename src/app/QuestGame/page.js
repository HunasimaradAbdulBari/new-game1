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
        await loadPhaserFromCDN();

        const RedesignedJetpackScene = createRedesignedJetpackScene();
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

        setTimeout(() => {
          try {
            const scene = game.scene.getScene('JetpackGameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
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
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Phaser from CDN'));
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

        this.heartIcons = [];
        this.scoreText = null;
        this.distanceText = null;
        this.progressText = null;
        this.questionText = null;
        this.answerObjects = [];
        this.fuelBar = null;
        this.fuelBarBg = null;
        this.fuelText = null;
        this.fuelPercentText = null;

        this.cursors = null;
        this.spaceKey = null;
        this.obstacleTimer = null;
        this.coinTimer = null;

        this.questions = [];
        this.currentQuestionElements = [];
        this.currentInstructionText = null;
        this.answerProcessed = false;

        this.nextQuestionDistance = 75;
        this.questionInterval = 30;
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

        this.nextQuestionDistance = 75;
        this.questionInterval = 30;
      }

      preload() {
        this.createRedesignedAssets();
        try {
          this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
        } catch {}
      }

      createRedesignedAssets() {
        // Player texture
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x2E86AB, 1);
        playerGraphics.fillRoundedRect(15, 25, 35, 40, 8);
        playerGraphics.fillStyle(0x74D3AE, 0.9);
        playerGraphics.fillCircle(32, 35, 12);
        playerGraphics.fillStyle(0xA23B72, 0.8);
        playerGraphics.fillCircle(32, 35, 8);
        playerGraphics.fillStyle(0xF18F01, 1);
        playerGraphics.fillRoundedRect(5, 40, 20, 8, 4);
        playerGraphics.fillRoundedRect(40, 40, 20, 8, 4);
        playerGraphics.fillStyle(0xC73E1D, 1);
        playerGraphics.fillRoundedRect(20, 65, 8, 15, 4);
        playerGraphics.fillRoundedRect(37, 65, 8, 15, 4);
        playerGraphics.fillStyle(0xFF6B35, 1);
        playerGraphics.fillCircle(24, 75, 3);
        playerGraphics.fillCircle(41, 75, 3);
        playerGraphics.generateTexture('redesigned-jetpack-player', 65, 85);
        playerGraphics.destroy();

        // Hearts (full / empty) as shapes
        const fullHeart = this.add.graphics();
        fullHeart.fillStyle(0xE53E3E, 1);
        fullHeart.fillCircle(12, 12, 8);
        fullHeart.fillCircle(24, 12, 8);
        fullHeart.fillTriangle(18, 24, 6, 12, 30, 12);
        fullHeart.generateTexture('full-heart', 36, 32);
        fullHeart.destroy();

        const emptyHeart = this.add.graphics();
        emptyHeart.lineStyle(2, 0xE53E3E, 1);
        emptyHeart.strokeCircle(12, 12, 8);
        emptyHeart.strokeCircle(24, 12, 8);
        emptyHeart.strokeTriangle(18, 24, 6, 12, 30, 12);
        emptyHeart.generateTexture('empty-heart', 36, 32);
        emptyHeart.destroy();

        // Obstacles
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

        // Coin (shapes only)
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xFFD700, 1);
        coinGraphics.fillCircle(20, 20, 18);
        coinGraphics.fillStyle(0xFFF8DC, 0.9);
        coinGraphics.fillCircle(20, 20, 14);
        coinGraphics.fillStyle(0xFFD700, 1);
        coinGraphics.fillCircle(20, 20, 8);
        coinGraphics.generateTexture('redesigned-coin', 40, 40);
        coinGraphics.destroy();

        // Background texture
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x0B1426, 0x1A2332, 0x2D3748, 0x4A5568, 1);
        bgGraphics.fillRect(0, 0, 1400, 700);
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * 1400;
          const y = Math.random() * 300;
          const a = Math.random();
          if (a > 0.7) {
            bgGraphics.fillStyle(0xFFFFFF, a);
            bgGraphics.fillCircle(x, y, a > 0.9 ? 3 : 1);
          }
        }
        const cityColor = 0x1A202C;
        const buildingWidth = 80;
        const buildingSpacing = 20;
        const minHeight = 150;
        const maxHeight = 300;
        for (let x = 0; x <= 1400; x += buildingWidth + buildingSpacing) {
          const h = window.Phaser.Math.Between(minHeight, maxHeight);
          bgGraphics.fillStyle(cityColor, 1);
          bgGraphics.fillRoundedRect(x, 700 - h, buildingWidth, h, 5);
          const windowSize = 8;
          const sx = 18;
          const sy = 25;
          const rows = Math.floor(h / (windowSize + sy));
          const cols = Math.floor(buildingWidth / (windowSize + sx));
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (window.Phaser.Math.Between(0, 100) > 40) {
                const wx = x + 10 + c * sx;
                const wy = 700 - h + 20 + r * sy;
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
      }

      createScrollingBackground() {
        try {
          if (this.cache.video.exists('bgvideo')) {
            this.backgroundVideo = this.add.video(0, 0, 'bgvideo');
            this.backgroundVideo.setOrigin(0, 0);
            this.backgroundVideo.setDisplaySize(1400, 700);
            this.backgroundVideo.play(true).catch(() => {
              if (this.backgroundVideo) {
                this.backgroundVideo.destroy();
                this.backgroundVideo = null;
              }
              this.background = this.add.tileSprite(0, 0, 1400, 700, 'redesigned-cityscape-background');
              this.background.setOrigin(0, 0);
            });
            this.backgroundOverlay = this.add.tileSprite(0, 0, 1400, 700, 'redesigned-cityscape-background');
            this.backgroundOverlay.setOrigin(0, 0);
            this.backgroundOverlay.setAlpha(0.7);
          } else {
            this.background = this.add.tileSprite(0, 0, 1400, 700, 'redesigned-cityscape-background');
            this.background.setOrigin(0, 0);
          }
        } catch {
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
        // Hearts
        this.createHeartIcons();

        // Score / distance / progress
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

        // Fuel bar moved UP to avoid any overlap with answers (answers start near y=200)
        this.createCleanFuelBar();
      }

      createHeartIcons() {
        this.heartIcons = [];
        for (let i = 0; i < 3; i++) {
          const heart = this.add.image(30 + (i * 45), 35, 'full-heart');
          heart.setScale(0.8);
          this.heartIcons.push(heart);
        }
      }

      updateHeartIcons() {
        for (let i = 0; i < 3; i++) {
          if (i < this.lives) {
            this.heartIcons[i].setTexture('full-heart');
          } else {
            this.heartIcons[i].setTexture('empty-heart');
          }
        }
      }

      // Fuel bar group + visibility helpers
      createCleanFuelBar() {
        // moved up from 160 -> 110 to keep well away from answer stack
        this.fuelBarBg = this.add.rectangle(1200, 110, 160, 20, 0x2D3748);
        this.fuelBarBg.setStrokeStyle(2, 0xE2E8F0);
        this.fuelBar = this.add.rectangle(1200, 110, 150, 16, 0x68D391);

        this.fuelText = this.add.text(1200, 135, 'JETPACK FUEL', {
          fontSize: '12px',
          fill: '#E2E8F0',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5, 0);

        this.fuelPercentText = this.add.text(1200, 110, '100%', {
          fontSize: '10px',
          fill: '#1A202C',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);
      }

      setFuelBarVisible(visible) {
        if (!this.fuelBarBg || !this.fuelBar || !this.fuelText || !this.fuelPercentText) return;
        this.fuelBarBg.setVisible(visible);
        this.fuelBar.setVisible(visible);
        this.fuelText.setVisible(visible);
        this.fuelPercentText.setVisible(visible);
      }

      setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(window.Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.on('pointerdown', (pointer) => {
          this.jetpackActive = true;
          const ripple = this.add.circle(pointer.x, pointer.y, 8, 0x68D391, 0.7);
          this.tweens.add({
            targets: ripple,
            radius: 40,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ripple.destroy()
          });
        });

        this.input.on('pointerup', () => {
          this.jetpackActive = false;
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
              if (particle.active) particle.destroy();
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

      checkQuestionTrigger() {
        if (this.distance >= this.nextQuestionDistance) {
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
        this.updateHeartIcons();
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

        // Hide fuel bar during question display to guarantee no overlap
        this.setFuelBarVisible(false);

        this.gameState = 'QUESTION_ACTIVE';
        this.answerProcessed = false;

        this.obstacleTimer.paused = true;
        this.coinTimer.paused = true;

        this.obstacles.children.entries.forEach(obstacle => {
          obstacle.setVelocityX(-this.questionScrollSpeed);
          this.tweens.add({ targets: obstacle, alpha: 0.3, duration: 600 });
        });

        this.coins.children.entries.forEach(coin => {
          coin.setVelocityX(-this.questionScrollSpeed);
          this.tweens.add({ targets: coin, alpha: 0.4, duration: 600 });
        });

        this.showCleanQuestionUI(question);
        this.time.delayedCall(1000, () => {
          this.showTransparentAnswerZones(question);
        });
      }

      showCleanQuestionUI(question) {
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
          y: 50,
          duration: 700,
          ease: 'Back.easeOut'
        });

        this.currentQuestionElements = [questionBg, this.questionText];
      }

      showTransparentAnswerZones(question) {
        this.clearAnswerObjects();

        const answerLabels = ['A', 'B', 'C', 'D'];
        this.answerObjects = [];

        // Fixed vertical column alignment
        const centerX = 1500;     // same X for all answers
        const startY = 200;       // start Y
        const gapY = 120;         // spacing

        for (let i = 0; i < question.answers.length; i++) {
          const yPos = startY + (i * gapY);

          const answerBg = this.add.rectangle(centerX, yPos, 500, 100, 0xE8E8E8, 0.4);
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
            moveSpeed: -182.8125,
            isMoving: true,          // IMPORTANT: all answers start moving immediately to keep column aligned
            hasPassedPlayer: false
          };

          this.answerObjects.push(answerObj);

          // Fade-in may be staggered, but movement already started for all to preserve alignment
          answerBg.setAlpha(0);
          answerLabel.setAlpha(0);
          answerText.setAlpha(0);

          this.tweens.add({
            targets: [answerBg, answerLabel, answerText],
            alpha: 1,
            duration: 500,
            delay: i * 150,
            ease: 'Power2.easeOut'
          });
        }

        this.time.delayedCall(800, () => {
          this.showCleanInstruction();
        });
      }

      updateMovingAnswers() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.answerObjects) return;

        const dt = this.game.loop.delta / 1000;

        for (let i = 0; i < this.answerObjects.length; i++) {
          const a = this.answerObjects[i];
          if (!a.isMoving) continue;

          a.currentX += a.moveSpeed * dt;

          a.bg.x = a.currentX;
          a.label.x = a.currentX - 220;
          a.text.x = a.currentX;

          if (a.currentX < -300) a.isMoving = false;
        }
      }

      checkAnswerCollisions() {
        if (this.gameState !== 'QUESTION_ACTIVE' || !this.player || !this.answerObjects || this.answerProcessed) return;

        const p = this.player.getBounds();

        for (let i = 0; i < this.answerObjects.length; i++) {
          const a = this.answerObjects[i];
          if (!a.isMoving) continue;

          const bounds = { x: a.currentX - 250, y: a.currentY - 50, width: 500, height: 100 };

          const hit = p.x < bounds.x + bounds.width &&
                      p.x + p.width > bounds.x &&
                      p.y < bounds.y + bounds.height &&
                      p.y + p.height > bounds.y;

          if (hit && !a.hasPassedPlayer) {
            a.hasPassedPlayer = true;
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
        if (this.answerProcessed) return;

        const a = this.answerObjects[answerIndex];
        if (!a) return;

        this.answerProcessed = true;

        const q = this.questions[this.questionIndex];
        const selectedAnswer = q.answers[answerIndex];
        const isCorrect = selectedAnswer === q.correctAnswer;

        if (isCorrect) {
          a.bg.setFillStyle(0x68D391).setAlpha(0.8);

          this.createSuccessEffect(a.bg.x, a.bg.y);

          this.score += 25;
          this.correctAnswers++;
          this.questionIndex++;

          this.nextQuestionDistance = this.distance + this.questionInterval;

          const scorePopup = this.add.text(a.bg.x, a.bg.y - 50, '+25', {
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
          a.bg.setFillStyle(0xF56565).setAlpha(0.8);

          this.showCorrectAnswer(q.correctAnswer);
          this.cameras.main.shake(400, 0.02);

          this.lives--;
          this.wrongAnswers++;

          this.nextQuestionDistance = this.distance + this.questionInterval;

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
        this.answerObjects.forEach((a, idx) => {
          const q = this.questions[this.questionIndex];
          if (q.answers[idx] === correctAnswer) {
            this.tweens.add({
              targets: a.bg,
              alpha: 0.9,
              duration: 300,
              yoyo: true,
              repeat: 3,
              onStart: () => {
                a.bg.setFillStyle(0x68D391);
              }
            });
          }
        });
      }

      createSuccessEffect(x, y) {
        const colors = [0x68D391, 0x90CDF4, 0xF6AD55, 0xFED7AA];
        for (let i = 0; i < 12; i++) {
          const p = this.add.circle(x, y, window.Phaser.Math.Between(4, 8), colors[i % colors.length]);
          const angle = (i / 12) * Math.PI * 2;
          const dist = 80 + Math.random() * 40;
          this.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            alpha: 0,
            scale: 0.3,
            duration: 1100,
            ease: 'Power2',
            onComplete: () => p.destroy()
          });
        }
      }

      hideQuestion() {
        if (this.currentQuestionElements && this.currentQuestionElements.length > 0) {
          this.currentQuestionElements.forEach(el => {
            if (el && el.active) {
              this.tweens.add({
                targets: el,
                y: -150,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                  if (el && el.active) el.destroy();
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

          // Restore fuel bar after question
          this.setFuelBarVisible(true);

          this.obstacles.children.entries.forEach(obstacle => {
            obstacle.setVelocityX(-this.scrollSpeed);
            this.tweens.add({ targets: obstacle, alpha: 1, duration: 500 });
          });

          this.coins.children.entries.forEach(coin => {
            coin.setVelocityX(-this.scrollSpeed);
            this.tweens.add({ targets: coin, alpha: 1, duration: 500 });
          });
        });
      }

      clearAnswerObjects() {
        if (this.answerObjects && this.answerObjects.length > 0) {
          this.answerObjects.forEach(a => {
            if (a.bg && a.bg.active) a.bg.destroy();
            if (a.label && a.label.active) a.label.destroy();
            if (a.text && a.text.active) a.text.destroy();
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

        const container = this.add.container(700, 350);
        container.setDepth(3000);

        const overlay = this.add.rectangle(0, 0, 1400, 700, 0x1A202C, 0.95);
        const title = this.add.text(0, -100, 'MISSION FAILED', {
          fontSize: '54px',
          fill: '#F56565',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const stats = this.add.text(0, -20,
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
          if (typeof window !== 'undefined') window.location.href = '/';
        });

        container.add([overlay, title, stats, restartBtn, homeBtn]);
        container.setAlpha(0);
        this.tweens.add({ targets: container, alpha: 1, duration: 800, ease: 'Power2' });
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

        const container = this.add.container(700, 350);
        container.setDepth(4000);

        const overlay = this.add.rectangle(0, 0, 1400, 700, 0x1A202C, 0.95);
        const completed = this.add.text(0, -50, 'Mission Complete!', {
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

        container.add([overlay, completed, scoreText, redirectText]);
        container.setAlpha(0);
        this.tweens.add({ targets: container, alpha: 1, duration: 700, ease: 'Power2' });

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
