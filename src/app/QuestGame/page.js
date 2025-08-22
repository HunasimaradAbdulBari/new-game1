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

        console.log('Starting game initialization...');

        // Load Phaser from CDN first
        await loadPhaserFromCDN();
        
        console.log('Phaser loaded, creating game scene...');

        // Create the complete GameScene class
        const GameScene = createCompleteGameScene();
        
        console.log('GameScene created, initializing Phaser game...');

        // Phaser game configuration
        const config = {
          type: window.Phaser.AUTO,
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
            mode: window.Phaser.Scale.FIT,
            autoCenter: window.Phaser.Scale.CENTER_BOTH,
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
        const game = new window.Phaser.Game(config);
        phaserGameRef.current = game;

        console.log('Phaser game created successfully');

        // Wait for scene to be ready
        setTimeout(() => {
          try {
            const scene = game.scene.getScene('GameScene');
            if (scene && scene.scene) {
              scene.scene.restart({ questions: QUESTIONS });
            }
            setGameLoaded(true);
            setIsLoading(false);
            console.log('Game loaded successfully');
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

  // Complete GameScene class with all functionality
  const createCompleteGameScene = () => {
    class GameScene extends window.Phaser.Scene {
      constructor() {
        super({ key: 'GameScene' });
        
        // Game state
        this.lives = 3;
        this.score = 0;
        this.questionIndex = 0;
        this.obstaclesPassed = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.gameState = 'PLAYING';
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;
        
        // Game objects
        this.player = null;
        this.obstacles = null;
        this.background = null;
        
        // UI elements
        this.livesText = null;
        this.scoreText = null;
        this.progressText = null;
        this.questionText = null;
        this.answerBoxes = [];
        this.questionContainer = null;
        
        // Input
        this.cursors = null;
        this.spaceKey = null;
        this.obstacleTimer = null;
        this.answerColliders = [];
        
        // Game data
        this.questions = [];
      }

      init(data) {
        this.questions = data?.questions || QUESTIONS;
        
        // Reset all game state
        this.lives = 3;
        this.score = 0;
        this.questionIndex = 0;
        this.obstaclesPassed = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.gameState = 'PLAYING';
        this.isInvulnerable = false;
        this.invulnerabilityTimer = null;
        this.answerColliders = [];
      }

      preload() {
        this.createGameAssets();
      }

      createGameAssets() {
        // Create rocket sprite
        const rocketGraphics = this.add.graphics();
        rocketGraphics.fillStyle(0x00ff44);
        rocketGraphics.fillTriangle(15, 0, 0, 30, 30, 30);
        rocketGraphics.fillStyle(0x0066ff);
        rocketGraphics.fillRect(12, 25, 6, 8);
        rocketGraphics.fillStyle(0x008822);
        rocketGraphics.fillTriangle(0, 30, 8, 35, 0, 35);
        rocketGraphics.fillTriangle(30, 30, 22, 35, 30, 35);
        rocketGraphics.fillStyle(0x88ddff);
        rocketGraphics.fillCircle(15, 12, 4);
        rocketGraphics.generateTexture('rocket', 30, 35);
        rocketGraphics.destroy();
        
        // Create obstacle sprite
        const obstacleGraphics = this.add.graphics();
        obstacleGraphics.fillStyle(0xff2222);
        obstacleGraphics.fillCircle(15, 15, 15);
        obstacleGraphics.fillStyle(0xaa0000);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = 15 + Math.cos(angle) * 12;
          const y1 = 15 + Math.sin(angle) * 12;
          const x2 = 15 + Math.cos(angle) * 20;
          const y2 = 15 + Math.sin(angle) * 20;
          const x3 = 15 + Math.cos(angle + 0.2) * 12;
          const y3 = 15 + Math.sin(angle + 0.2) * 12;
          obstacleGraphics.fillTriangle(x1, y1, x2, y2, x3, y3);
        }
        obstacleGraphics.generateTexture('obstacle', 30, 30);
        obstacleGraphics.destroy();
        
        // Create animated background
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x000011, 0x000033, 0x110033, 0x330055, 1);
        bgGraphics.fillRect(0, 0, 800, 600);
        
        // Add stars
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * 800;
          const y = Math.random() * 600;
          const brightness = Math.random();
          const size = brightness > 0.8 ? 2 : 1;
          
          if (brightness > 0.9) {
            bgGraphics.fillStyle(0xffffff);
          } else if (brightness > 0.7) {
            bgGraphics.fillStyle(0xccddff);
          } else {
            bgGraphics.fillStyle(0x888888);
          }
          
          bgGraphics.fillCircle(x, y, size);
        }
        
        bgGraphics.generateTexture('background', 800, 600);
        bgGraphics.destroy();
      }

      create() {
        console.log('Creating game scene...');
        
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // Create background
        this.background = this.add.image(400, 300, 'background');
        
        // Create player
        this.player = this.physics.add.sprite(150, 300, 'rocket');
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(500);
        this.player.setScale(1.2);
        this.player.setSize(25, 28);
        
        // Create obstacles group
        this.obstacles = this.physics.add.group();
        
        // Create UI
        this.createUI();
        
        // Setup input
        this.setupInput();
        
        // Setup collisions
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        
        // Start spawning obstacles
        this.startObstacleSpawning();
        
        // Create question UI
        this.createQuestionUI();
        
        console.log('Game scene created successfully');
      }

      createUI() {
        this.livesText = this.add.text(16, 16, `❤️ Lives: ${this.lives}`, {
          fontSize: '24px',
          fill: '#ff4444',
          stroke: '#ffffff',
          strokeThickness: 2,
          fontWeight: 'bold'
        });
        
        this.scoreText = this.add.text(16, 50, `⭐ Score: ${this.score}`, {
          fontSize: '24px',
          fill: '#44ff44',
          stroke: '#000000',
          strokeThickness: 2,
          fontWeight: 'bold'
        });

        const totalQuestions = this.questions.length;
        this.progressText = this.add.text(16, 84, `📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`, {
          fontSize: '20px',
          fill: '#4488ff',
          stroke: '#ffffff',
          strokeThickness: 1,
          fontWeight: 'bold'
        });

        this.add.text(784, 16, '🎮 SPACEBAR or TAP to fly up!', {
          fontSize: '16px',
          fill: '#ffff44',
          stroke: '#000000',
          strokeThickness: 1,
          fontWeight: 'bold'
        }).setOrigin(1, 0);
      }

      setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(window.Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.input.on('pointerdown', (pointer) => {
          if (this.gameState === 'PLAYING' || this.gameState === 'QUESTION_ACTIVE') {
            this.makePlayerJump();
            
            const ripple = this.add.circle(pointer.x, pointer.y, 5, 0xffffff, 0.8);
            this.tweens.add({
              targets: ripple,
              radius: 30,
              alpha: 0,
              duration: 300,
              onComplete: () => ripple.destroy()
            });
          }
        });
      }

      createQuestionUI() {
        this.questionContainer = this.add.container(0, 0);
        this.questionContainer.setVisible(false);
        this.questionContainer.setDepth(2000);
        
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
        this.questionContainer.add(overlay);
        
        const questionBg = this.add.rectangle(400, 120, 760, 120, 0xffffff);
        questionBg.setStrokeStyle(4, 0x4488ff);
        const questionGlow = this.add.rectangle(400, 120, 770, 130, 0x4488ff, 0.3);
        this.questionContainer.add([questionGlow, questionBg]);
        
        this.questionText = this.add.text(400, 120, '', {
          fontSize: '22px',
          fill: '#000000',
          align: 'center',
          fontWeight: 'bold',
          wordWrap: { width: 720 }
        }).setOrigin(0.5);
        this.questionContainer.add(this.questionText);
        
        const answerYPositions = [240, 340, 440];
        const answerColors = [0x4285f4, 0x34a853, 0xfbbc04];
        const answerLabels = ['A', 'B', 'C'];
        
        this.answerBoxes = [];
        for (let i = 0; i < 3; i++) {
          const answerGlow = this.add.rectangle(400, answerYPositions[i], 730, 85, answerColors[i], 0.3);
          const answerBox = this.add.rectangle(400, answerYPositions[i], 720, 80, answerColors[i]);
          answerBox.setStrokeStyle(4, 0xffffff);
          
          const labelText = this.add.text(80, answerYPositions[i], answerLabels[i], {
            fontSize: '28px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
          }).setOrigin(0.5);
          
          const answerText = this.add.text(400, answerYPositions[i], '', {
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center',
            fontWeight: 'bold',
            wordWrap: { width: 600 }
          }).setOrigin(0.5);
          
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
          
          const zone = this.physics.add.staticGroup().create(400, answerYPositions[i]);
          zone.setSize(720, 80);
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

        const instructionText = this.add.text(400, 520, '🚀 Click an answer or fly into it with your rocket!', {
          fontSize: '18px',
          fill: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        
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

      startObstacleSpawning() {
        this.obstacleTimer = this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true
        });
      }

      spawnObstacle() {
        if (this.gameState !== 'PLAYING') return;
        
        const x = window.Phaser.Math.Between(200, 750);
        const obstacle = this.obstacles.create(x, -30, 'obstacle');
        
        obstacle.setVelocityY(130);
        obstacle.setScale(1);
        obstacle.setCircle(15);
        obstacle.setAngularVelocity(window.Phaser.Math.Between(-200, 200));
        obstacle.setTint(0xff6666);
      }

      makePlayerJump() {
        if (this.gameState === 'GAME_OVER') return;
        
        this.player.setVelocityY(-320);
        this.player.setScale(1.3);
        this.time.delayedCall(100, () => this.player.setScale(1.2));
        
        for (let i = 0; i < 3; i++) {
          const particle = this.add.circle(
            this.player.x + window.Phaser.Math.Between(-10, 10), 
            this.player.y + 15, 
            2, 
            0x88ddff, 
            0.8
          );
          
          this.tweens.add({
            targets: particle,
            y: particle.y + 20,
            alpha: 0,
            duration: 400,
            onComplete: () => particle.destroy()
          });
        }
      }

      update() {
        if (this.spaceKey.isDown) {
          this.makePlayerJump();
        }
        
        this.obstacles.children.entries.forEach(obstacle => {
          if (obstacle.y > 650) {
            if (this.gameState === 'PLAYING') {
              this.obstaclesPassed++;
              if (this.obstaclesPassed >= 5) {
                this.obstaclesPassed = 0;
                this.showQuestion();
              }
            }
            obstacle.destroy();
          }
        });
        
        this.updateUI();
        
        if (this.gameState === 'PLAYING' && this.player) {
          this.player.rotation = Math.sin(this.time.now * 0.002) * 0.1;
        }
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
        this.obstacleTimer.paused = true;
        
        this.obstacles.children.entries.forEach(obstacle => {
          obstacle.setVelocity(0, 0);
          this.tweens.add({
            targets: obstacle,
            alpha: 0.3,
            duration: 500
          });
        });
        
        this.questionText.setText(question.question);
        
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
        
        this.questionContainer.setAlpha(0);
        this.questionContainer.setVisible(true);
        this.tweens.add({
          targets: this.questionContainer,
          alpha: 1,
          duration: 400
        });
        
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
        
        this.answerBoxes.forEach(answer => answer.disabled = true);
        
        if (isCorrect) {
          answerBox.box.setFillStyle(0x00ff44);
          answerBox.glow.setFillStyle(0x00ff44);
          
          this.createSuccessParticles(answerBox.box.x, answerBox.box.y);
          
          this.score += 10;
          this.correctAnswers++;
          this.questionIndex++;
          
          const scorePopup = this.add.text(answerBox.box.x, answerBox.box.y - 50, '+10', {
            fontSize: '32px',
            fill: '#00ff44',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: scorePopup,
            y: scorePopup.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => scorePopup.destroy()
          });
          
          this.time.delayedCall(1200, () => this.hideQuestion());
          
        } else {
          answerBox.box.setFillStyle(0xff2222);
          answerBox.glow.setFillStyle(0xff2222);
          
          this.tweens.add({
            targets: [answerBox.box, answerBox.glow, answerBox.text, answerBox.label],
            x: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 5
          });
          
          this.lives--;
          this.wrongAnswers++;
          
          const damageFlash = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3);
          damageFlash.setDepth(1500);
          this.tweens.add({
            targets: damageFlash,
            alpha: 0,
            duration: 200,
            onComplete: () => damageFlash.destroy()
          });
          
          if (this.lives <= 0) {
            this.gameState = 'GAME_OVER';
            this.time.delayedCall(1500, () => this.gameOver());
          }
        }
      }

      createSuccessParticles(x, y) {
        const colors = [0xffff00, 0x00ff00, 0x00ffff, 0xff88ff];
        
        for (let i = 0; i < 8; i++) {
          const particle = this.add.circle(x, y, 4, colors[i % colors.length]);
          const angle = (i / 8) * Math.PI * 2;
          const distance = 50 + Math.random() * 30;
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.5,
            duration: 800,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      hideQuestion() {
        this.tweens.add({
          targets: this.questionContainer,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            this.questionContainer.setVisible(false);
            this.questionContainer.setAlpha(1);
          }
        });
        
        this.clearAnswerColliders();
        
        if (this.questionIndex >= this.questions.length) {
          this.time.delayedCall(500, () => this.showResults());
          return;
        }
        
        this.time.delayedCall(600, () => {
          this.gameState = 'PLAYING';
          this.obstacleTimer.paused = false;
          
          this.obstacles.children.entries.forEach(obstacle => {
            obstacle.setVelocityY(130);
            this.tweens.add({
              targets: obstacle,
              alpha: 1,
              duration: 300
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
        
        obstacle.destroy();
        this.cameras.main.shake(200, 0.02);
        
        this.lives--;
        this.wrongAnswers++;
        this.isInvulnerable = true;
        
        this.player.setTint(0xff0000);
        
        this.tweens.add({
          targets: this.player,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.player.clearTint();
            this.player.setAlpha(1);
          }
        });
        
        const damageText = this.add.text(this.player.x, this.player.y - 30, '-1 LIFE', {
          fontSize: '20px',
          fill: '#ff0000',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: damageText,
          y: damageText.y - 40,
          alpha: 0,
          duration: 1000,
          onComplete: () => damageText.destroy()
        });
        
        if (this.invulnerabilityTimer) {
          this.invulnerabilityTimer.destroy();
        }
        this.invulnerabilityTimer = this.time.delayedCall(1000, () => {
          this.isInvulnerable = false;
          this.invulnerabilityTimer = null;
        });
        
        if (this.lives <= 0) {
          this.gameState = 'GAME_OVER';
          this.time.delayedCall(800, () => this.gameOver());
        }
      }

      updateUI() {
        this.livesText.setText(`❤️ Lives: ${this.lives}`);
        this.scoreText.setText(`⭐ Score: ${this.score}`);
        if (this.progressText) {
          const totalQuestions = this.questions.length;
          this.progressText.setText(`📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`);
        }
      }

      gameOver() {
        this.gameState = 'GAME_OVER';
        
        if (this.obstacleTimer) {
          this.obstacleTimer.destroy();
        }
        
        this.obstacles.children.entries.forEach(obstacle => {
          this.tweens.add({
            targets: obstacle,
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => obstacle.destroy()
          });
        });
        
        const gameOverContainer = this.add.container(400, 300);
        gameOverContainer.setDepth(3000);
        
        const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.95);
        
        const gameOverText = this.add.text(0, -80, 'GAME OVER!', {
          fontSize: '48px',
          fill: '#ffffff',
          fontWeight: 'bold',
          stroke: '#ff0000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
        const statsText = this.add.text(0, -20, 
          `🎯 Final Score: ${this.score}\n📊 Questions: ${this.questionIndex}/${this.questions.length}\n✅ Correct: ${this.correctAnswers} | ❌ Wrong: ${this.wrongAnswers}\n🎪 Accuracy: ${accuracy}%`, {
          fontSize: '18px',
          fill: '#ffffff',
          align: 'center',
          lineSpacing: 8,
          fontWeight: 'bold'
        }).setOrigin(0.5);
        
        const restartBtn = this.add.text(0, 70, '🔄 Restart Mission', {
          fontSize: '22px',
          fill: '#44ff44',
          backgroundColor: '#003300',
          padding: { x: 25, y: 12 },
          fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        const homeBtn = this.add.text(0, 120, '🏠 Return to Base', {
          fontSize: '18px',
          fill: '#ffffff',
          backgroundColor: '#333366',
          padding: { x: 20, y: 10 },
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
        
        gameOverContainer.add([overlay, gameOverText, statsText, restartBtn, homeBtn]);
        
        gameOverContainer.setScale(0.5);
        gameOverContainer.setAlpha(0);
        this.tweens.add({
          targets: gameOverContainer,
          scale: 1,
          alpha: 1,
          duration: 600,
          ease: 'Back.easeOut'
        });
      }

      showResults() {
        this.gameState = 'RESULTS';
        
        const totalQuestions = this.questionIndex;
        const percentage = totalQuestions > 0 ? Math.round((this.correctAnswers / totalQuestions) * 100) : 0;
        
        const results = {
          score: this.score,
          totalQuestions,
          correctAnswers: this.correctAnswers,
          wrongAnswers: this.wrongAnswers,
          livesUsed: 3 - this.lives,
          percentage,
          passed: percentage >= 70
        };
        
        const transitionContainer = this.add.container(400, 300);
        transitionContainer.setDepth(4000);
        
        const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.9);
        const completedText = this.add.text(0, -40, '🎉 Mission Complete!', {
          fontSize: '36px',
          fill: results.passed ? '#44ff44' : '#ffaa44',
          fontWeight: 'bold',
          stroke: '#ffffff',
          strokeThickness: 2
        }).setOrigin(0.5);
        
        const redirectText = this.add.text(0, 20, 'Redirecting to results...', {
          fontSize: '18px',
          fill: '#ffffff'
        }).setOrigin(0.5);
        
        transitionContainer.add([overlay, completedText, redirectText]);
        
        transitionContainer.setAlpha(0);
        this.tweens.add({
          targets: transitionContainer,
          alpha: 1,
          duration: 500
        });
        
        this.time.delayedCall(2000, () => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('gameResults', JSON.stringify(results));
            window.location.href = '/QuestGame/result';
          }
        });
      }
    }

    return GameScene;
  };

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
        
        {(isLoading || !gameLoaded) && (
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