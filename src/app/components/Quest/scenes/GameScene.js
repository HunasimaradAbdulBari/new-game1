// src/components/Quest/scenes/GameScene.js

import { GameLogic, GAME_CONFIG, GAME_STATES } from '../utils/gameLogic.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Game objects
    this.player = null;
    this.obstacles = null;
    this.background = null;
    
    // UI elements
    this.livesText = null;
    this.scoreText = null;
    this.questionText = null;
    this.answerBoxes = [];
    this.questionContainer = null;
    
    // Input
    this.cursors = null;
    this.spaceKey = null;
    this.touchArea = null;
    
    // Game logic
    this.gameLogic = null;
    this.obstacleTimer = null;
    
    // State flags
    this.isPlayerInvulnerable = false;
  }

  init(data) {
    // Receive questions from page.js
    this.questions = data.questions || [];
    this.gameLogic = new GameLogic(this.questions);
  }

  preload() {
    // Load assets
    this.load.image('background', '/bg.png');
    this.load.image('player', '/plane.png');
    this.load.image('obstacle', '/obstacle.png');
    
    // Create simple colored rectangles if images don't exist
    this.load.image('player-fallback', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
  }

  create() {
    // World bounds
    this.physics.world.setBounds(0, 0, 800, 600);
    
    // Background
    this.background = this.add.image(400, 300, 'background')
      .setDisplaySize(800, 600);
    
    // Create fallback graphics if assets fail
    if (!this.textures.exists('background')) {
      this.background = this.add.rectangle(400, 300, 800, 600, 0x87CEEB);
    }
    
    // Create player
    this.createPlayer();
    
    // Create obstacles group
    this.obstacles = this.physics.add.group();
    
    // Create UI
    this.createUI();
    
    // Setup input
    this.setupInput();
    
    // Setup collision detection
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    
    // Start obstacle spawning
    this.startObstacleSpawning();
    
    // Create question UI (hidden initially)
    this.createQuestionUI();
  }

  createPlayer() {
    // Create player sprite
    if (this.textures.exists('player')) {
      this.player = this.physics.add.sprite(150, 300, 'player');
    } else {
      // Fallback: create a simple triangle shape
      const graphics = this.add.graphics();
      graphics.fillStyle(0x00FF00);
      graphics.fillTriangle(0, 10, 20, 0, 20, 20);
      graphics.generateTexture('player-triangle', 20, 20);
      this.player = this.physics.add.sprite(150, 300, 'player-triangle');
    }
    
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GAME_CONFIG.GRAVITY);
    this.player.setScale(1.5);
  }

  createUI() {
    // Lives display
    this.livesText = this.add.text(16, 16, `Lives: ${this.gameLogic.lives}`, {
      fontSize: '24px',
      fill: '#FF0000',
      fontWeight: 'bold'
    });
    
    // Score display
    this.scoreText = this.add.text(16, 50, `Score: ${this.gameLogic.score}`, {
      fontSize: '24px',
      fill: '#00FF00',
      fontWeight: 'bold'
    });
  }

  setupInput() {
    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Touch input
    this.input.on('pointerdown', () => {
      if (this.gameLogic.isPlaying() || this.gameLogic.isQuestionActive()) {
        this.makePlayerJump();
      }
    });
  }

  createQuestionUI() {
    // Create container for question UI
    this.questionContainer = this.add.container(0, 0).setVisible(false);
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    this.questionContainer.add(overlay);
    
    // Question text background
    const questionBg = this.add.rectangle(400, 100, 750, 80, 0xFFFFFF);
    this.questionContainer.add(questionBg);
    
    // Question text
    this.questionText = this.add.text(400, 100, '', {
      fontSize: '20px',
      fill: '#000000',
      align: 'center',
      wordWrap: { width: 720 }
    }).setOrigin(0.5);
    this.questionContainer.add(this.questionText);
    
    // Create answer boxes
    const answerYPositions = [200, 300, 400];
    const answerColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1];
    
    for (let i = 0; i < 3; i++) {
      const answerBox = this.add.rectangle(400, answerYPositions[i], 700, 60, answerColors[i]);
      const answerText = this.add.text(400, answerYPositions[i], '', {
        fontSize: '18px',
        fill: '#FFFFFF',
        align: 'center',
        fontWeight: 'bold'
      }).setOrigin(0.5);
      
      // Make boxes interactive
      answerBox.setInteractive();
      answerBox.on('pointerdown', () => this.selectAnswer(i));
      
      // Create physics body for plane collision detection
      this.physics.add.existing(answerBox, true); // true = static body
      
      this.answerBoxes.push({
        box: answerBox,
        text: answerText,
        zone: answerBox,
        disabled: false
      });
      
      this.questionContainer.add([answerBox, answerText]);
    }
    
    // Instructions
    const instructions = this.add.text(400, 500, 'Fly into the correct answer or tap it!', {
      fontSize: '16px',
      fill: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);
    this.questionContainer.add(instructions);
  }

  startObstacleSpawning() {
    this.obstacleTimer = this.time.addEvent({
      delay: GAME_CONFIG.OBSTACLE_SPAWN_INTERVAL,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  spawnObstacle() {
    if (!this.gameLogic.isPlaying()) return;
    
    const x = Phaser.Math.Between(50, 750);
    let obstacle;
    
    if (this.textures.exists('obstacle')) {
      obstacle = this.obstacles.create(x, -50, 'obstacle');
    } else {
      // Fallback: create a red circle
      const graphics = this.add.graphics();
      graphics.fillStyle(0xFF0000);
      graphics.fillCircle(15, 15, 15);
      graphics.generateTexture('obstacle-circle', 30, 30);
      obstacle = this.obstacles.create(x, -50, 'obstacle-circle');
    }
    
    obstacle.setVelocityY(GAME_CONFIG.OBSTACLE_SPEED);
    obstacle.setScale(1.2);
  }

  makePlayerJump() {
    this.player.setVelocityY(GAME_CONFIG.PLANE_IMPULSE);
  }

  update() {
    // Handle input
    if (this.spaceKey.isDown) {
      this.makePlayerJump();
    }
    
    // Update obstacles
    this.obstacles.children.entries.forEach(obstacle => {
      if (obstacle.y > 650) {
        // Obstacle passed - increment counter
        if (this.gameLogic.isPlaying()) {
          const shouldShowQuestion = this.gameLogic.passObstacle();
          if (shouldShowQuestion) {
            this.showQuestion();
          }
        }
        obstacle.destroy();
      }
    });
    
    // Check for answer zone collisions when question is active
    if (this.gameLogic.isQuestionActive()) {
      this.checkAnswerCollisions();
    }
    
    // Update UI
    this.updateUI();
  }

  showQuestion() {
    const question = this.gameLogic.getCurrentQuestion();
    if (!question) return;
    
    // Pause obstacle spawning
    this.obstacleTimer.paused = true;
    
    // Stop existing obstacles
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocity(0, 0);
    });
    
    // Setup question UI
    this.questionText.setText(question.question);
    
    // Reset and setup answer boxes
    for (let i = 0; i < 3; i++) {
      const answer = this.answerBoxes[i];
      answer.text.setText(question.answers[i]);
      answer.box.setFillStyle(0x4472C4); // Reset to blue
      answer.disabled = false;
      answer.box.setAlpha(1);
    }
    
    // Show question container
    this.questionContainer.setVisible(true);
    
    // Setup collision detection for answer zones
    for (let i = 0; i < 3; i++) {
      this.physics.add.overlap(this.player, this.answerBoxes[i].box, 
        () => this.selectAnswer(i), null, this);
    }
  }

  checkAnswerCollisions() {
    // This is handled by the overlap detection set up in showQuestion
  }

  selectAnswer(answerIndex) {
    const answerBox = this.answerBoxes[answerIndex];
    if (answerBox.disabled) return;
    
    const question = this.gameLogic.getCurrentQuestion();
    const selectedAnswer = question.answers[answerIndex];
    const result = this.gameLogic.submitAnswer(selectedAnswer);
    
    // Visual feedback
    if (result.correct) {
      answerBox.box.setFillStyle(0x00FF00); // Green
      this.time.delayedCall(800, () => this.hideQuestion());
    } else {
      answerBox.box.setFillStyle(0xFF0000); // Red
      answerBox.box.setAlpha(0.5);
      answerBox.disabled = true;
      
      if (result.gameEnded) {
        this.time.delayedCall(1000, () => this.gameOver());
      }
      // If not game over, player can try other answers
    }
  }

  hideQuestion() {
    // Hide question UI
    this.questionContainer.setVisible(false);
    
    // Resume obstacle spawning
    this.obstacleTimer.paused = false;
    
    // Resume obstacle movement
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocityY(GAME_CONFIG.OBSTACLE_SPEED);
    });
    
    // Remove answer collision detection
    for (let i = 0; i < 3; i++) {
      // Remove overlap detection
      this.physics.world.removeCollider();
    }
    
    // Check if game should end
    if (this.gameLogic.isAllQuestionsDone()) {
      this.showResults();
    }
  }

  hitObstacle(player, obstacle) {
    if (this.gameLogic.isInvulnerable || !this.gameLogic.isPlaying()) return;
    
    // Remove obstacle
    obstacle.destroy();
    
    // Decrease life
    this.gameLogic.decrementLife();
    this.gameLogic.setInvulnerable();
    
    // Visual feedback
    this.player.setTint(0xFF0000);
    this.time.delayedCall(200, () => this.player.clearTint());
    
    // Check game over
    if (this.gameLogic.isGameOver()) {
      this.gameOver();
    }
  }

  updateUI() {
    this.livesText.setText(`Lives: ${this.gameLogic.lives}`);
    this.scoreText.setText(`Score: ${this.gameLogic.score}`);
  }

  gameOver() {
    // Stop everything
    this.obstacleTimer.destroy();
    this.obstacles.clear(true);
    
    // Show game over screen
    const gameOverContainer = this.add.container(400, 300);
    
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8);
    const gameOverText = this.add.text(0, -100, 'GAME OVER!', {
      fontSize: '48px',
      fill: '#FF0000',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    const finalScore = this.add.text(0, -20, `Final Score: ${this.gameLogic.score}`, {
      fontSize: '24px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(0, 60, 'Click to Restart', {
      fontSize: '20px',
      fill: '#00FF00',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    
    restartBtn.on('pointerdown', () => this.restartGame());
    
    gameOverContainer.add([overlay, gameOverText, finalScore, restartBtn]);
  }

  showResults() {
    const results = this.gameLogic.getResults();
    
    // Navigate to results page with data
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gameResults', JSON.stringify(results));
      window.location.href = '/QuestGame/result';
    }
  }

  restartGame() {
    this.scene.restart();
  }
}