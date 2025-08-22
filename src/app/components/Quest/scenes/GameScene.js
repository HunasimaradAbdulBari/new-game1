import { GameLogic, GAME_CONFIG, GAME_STATES } from '../utils/gameLogic.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Game objects
    this.player = null;
    this.obstacles = null;
    this.background = null;
    this.videoBackground = null;
    
    // UI elements
    this.livesText = null;
    this.scoreText = null;
    this.questionText = null;
    this.answerBoxes = [];
    this.questionContainer = null;
    
    // Input
    this.cursors = null;
    this.spaceKey = null;
    this.isJumping = false;
    
    // Game logic
    this.gameLogic = null;
    this.obstacleTimer = null;
    this.answerColliders = [];
  }

  init(data) {
    // Receive questions from page.js
    this.questions = data.questions || [];
    this.gameLogic = new GameLogic(this.questions);
  }

  preload() {
    // Create fallback graphics for missing assets
    this.createFallbackAssets();
    
    // Try to load actual assets if they exist
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load ${file.key}, using fallback`);
    });
    
    // Attempt to load assets
    this.load.image('background', '/bg.png');
    this.load.image('rocket', '/rocket.png');
    this.load.image('obstacle', '/obstacle.png');
    
    // Load video background
    this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
  }

  createFallbackAssets() {
    // Create rocket/plane fallback
    const rocketGraphics = this.add.graphics();
    rocketGraphics.fillStyle(0x00ff00);
    rocketGraphics.fillTriangle(0, 15, 30, 0, 30, 30);
    rocketGraphics.fillStyle(0x0066cc);
    rocketGraphics.fillRect(25, 12, 10, 6);
    rocketGraphics.generateTexture('rocket-fallback', 40, 30);
    rocketGraphics.destroy();
    
    // Create obstacle fallback
    const obstacleGraphics = this.add.graphics();
    obstacleGraphics.fillStyle(0xff0000);
    obstacleGraphics.fillCircle(15, 15, 15);
    obstacleGraphics.generateTexture('obstacle-fallback', 30, 30);
    obstacleGraphics.destroy();
    
    // Create background fallback
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x98fb98, 0x98fb98, 1);
    bgGraphics.fillRect(0, 0, 800, 600);
    bgGraphics.generateTexture('background-fallback', 800, 600);
    bgGraphics.destroy();
  }

  create() {
    // World bounds
    this.physics.world.setBounds(0, 0, 800, 600);
    
    // Create background (video or fallback)
    this.createBackground();
    
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
    
    console.log('Game initialized with', this.questions.length, 'questions');
  }

  createBackground() {
    try {
      // Try video background first
      if (this.cache.video.exists('bgvideo')) {
        this.videoBackground = this.add.video(400, 300, 'bgvideo');
        this.videoBackground.setDisplaySize(800, 600);
        this.videoBackground.play(true); // loop = true
        this.background = this.videoBackground;
      } else if (this.textures.exists('background')) {
        this.background = this.add.image(400, 300, 'background');
        this.background.setDisplaySize(800, 600);
      } else {
        this.background = this.add.image(400, 300, 'background-fallback');
      }
    } catch (error) {
      console.warn('Background setup failed, using fallback');
      this.background = this.add.image(400, 300, 'background-fallback');
    }
  }

  createPlayer() {
    // Create player sprite
    let playerTexture = 'rocket-fallback';
    if (this.textures.exists('rocket')) {
      playerTexture = 'rocket';
    }
    
    this.player = this.physics.add.sprite(GAME_CONFIG.PLANE_POSITION_X, 300, playerTexture);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GAME_CONFIG.GRAVITY);
    this.player.setScale(1);
    this.player.setSize(30, 20); // Set collision box
    
    // Add thrust particles
    const particles = this.add.particles(0, 0, 'rocket-fallback', {
      scale: { start: 0.1, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 200,
      quantity: 2,
      tint: [0xff6600, 0xff9900]
    });
    particles.startFollow(this.player, -15, 0);
  }

  createUI() {
    // Create UI container
    const uiContainer = this.add.container(0, 0);
    uiContainer.setDepth(1000);
    
    // Lives display with icon
    const livesIcon = this.add.text(16, 16, '❤️', { fontSize: '20px' });
    this.livesText = this.add.text(45, 16, `${this.gameLogic.lives}`, {
      fontSize: '24px',
      fill: '#ff0000',
      fontWeight: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2
    });
    
    // Score display with icon
    const scoreIcon = this.add.text(16, 50, '⭐', { fontSize: '20px' });
    this.scoreText = this.add.text(45, 50, `${this.gameLogic.score}`, {
      fontSize: '24px',
      fill: '#00ff00',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    uiContainer.add([livesIcon, this.livesText, scoreIcon, this.scoreText]);
  }

  setupInput() {
    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Touch input for mobile
    this.input.on('pointerdown', (pointer) => {
      if (this.gameLogic.isPlaying() || this.gameLogic.isQuestionActive()) {
        this.makePlayerJump();
      }
    });
    
    // Prevent space key from scrolling the page
    this.spaceKey.on('down', (event) => {
      event.preventDefault();
    });
  }

  createQuestionUI() {
    // Create container for question UI
    this.questionContainer = this.add.container(0, 0);
    this.questionContainer.setVisible(false);
    this.questionContainer.setDepth(2000);
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    this.questionContainer.add(overlay);
    
    // Question text background
    const questionBg = this.add.rectangle(400, 100, 750, 100, 0xffffff);
    questionBg.setStrokeStyle(3, 0x333333);
    this.questionContainer.add(questionBg);
    
    // Question text
    this.questionText = this.add.text(400, 100, '', {
      fontSize: '18px',
      fill: '#000000',
      align: 'center',
      wordWrap: { width: 700 },
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.questionContainer.add(this.questionText);
    
    // Create answer boxes (horizontal bands for plane movement)
    const answerYPositions = [220, 320, 420];
    const answerColors = [0x4285f4, 0x34a853, 0xfbbc04]; // Google colors
    
    this.answerBoxes = [];
    for (let i = 0; i < 3; i++) {
      // Create answer band
      const answerBox = this.add.rectangle(400, answerYPositions[i], 700, 70, answerColors[i]);
      answerBox.setStrokeStyle(3, 0xffffff);
      
      // Answer label (A, B, C)
      const answerLabel = this.add.text(80, answerYPositions[i], String.fromCharCode(65 + i), {
        fontSize: '24px',
        fill: '#ffffff',
        fontWeight: 'bold',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);
      
      // Answer text
      const answerText = this.add.text(400, answerYPositions[i], '', {
        fontSize: '16px',
        fill: '#ffffff',
        align: 'center',
        fontWeight: 'bold',
        wordWrap: { width: 500 }
      }).setOrigin(0.5);
      
      // Make clickable for desktop
      answerBox.setInteractive();
      answerBox.on('pointerdown', () => this.selectAnswer(i));
      
      // Create physics body for collision detection
      const zoneBody = this.physics.add.staticGroup();
      const zone = zoneBody.create(400, answerYPositions[i]);
      zone.setSize(700, 70);
      zone.setVisible(false);
      
      this.answerBoxes.push({
        box: answerBox,
        text: answerText,
        label: answerLabel,
        zone: zone,
        disabled: false,
        originalColor: answerColors[i]
      });
      
      this.questionContainer.add([answerBox, answerLabel, answerText]);
    }
    
    // Instructions
    const instructions = this.add.text(400, 530, 'Fly into the correct answer band or click it!', {
      fontSize: '16px',
      fill: '#ffffff',
      align: 'center',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
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
    
    const x = Phaser.Math.Between(80, 720);
    let obstacle;
    
    // Use rocket texture or fallback
    const obstacleTexture = this.textures.exists('obstacle') ? 'obstacle' : 'obstacle-fallback';
    obstacle = this.obstacles.create(x, -50, obstacleTexture);
    
    obstacle.setVelocityY(GAME_CONFIG.OBSTACLE_SPEED);
    obstacle.setScale(1);
    obstacle.setSize(25, 25); // Set collision box
    
    // Add rotation for visual effect
    obstacle.setAngularVelocity(Phaser.Math.Between(-100, 100));
  }

  makePlayerJump() {
    if (this.gameLogic.isGameOver()) return;
    
    this.player.setVelocityY(GAME_CONFIG.PLANE_IMPULSE);
    this.isJumping = true;
  }

  update() {
    // Handle continuous input
    if (this.spaceKey.isDown) {
      this.makePlayerJump();
    } else {
      this.isJumping = false;
    }
    
    // Update obstacles and check for passed obstacles
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
    if (!question) {
      this.showResults();
      return;
    }
    
    console.log('Showing question:', question.question);
    
    // Pause obstacle spawning
    this.obstacleTimer.paused = true;
    
    // Stop existing obstacles
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocity(0, 0);
      obstacle.setAngularVelocity(0);
    });
    
    // Setup question UI
    this.questionText.setText(question.question);
    
    // Reset and setup answer boxes
    for (let i = 0; i < 3; i++) {
      const answer = this.answerBoxes[i];
      answer.text.setText(question.answers[i]);
      answer.box.setFillStyle(answer.originalColor);
      answer.box.setAlpha(1);
      answer.disabled = false;
    }
    
    // Show question container
    this.questionContainer.setVisible(true);
    
    // Clear previous colliders
    this.clearAnswerColliders();
    
    // Setup collision detection for answer zones
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
  }

  clearAnswerColliders() {
    this.answerColliders.forEach(collider => {
      if (collider && collider.destroy) {
        collider.destroy();
      }
    });
    this.answerColliders = [];
  }

  checkAnswerCollisions() {
    // Collision detection is handled by the overlap setup in showQuestion
  }

  selectAnswer(answerIndex) {
    const answerBox = this.answerBoxes[answerIndex];
    if (answerBox.disabled) return;
    
    const question = this.gameLogic.getCurrentQuestion();
    const selectedAnswer = question.answers[answerIndex];
    const result = this.gameLogic.submitAnswer(selectedAnswer);
    
    console.log('Selected answer:', selectedAnswer, 'Correct:', result.correct);
    
    // Visual feedback
    if (result.correct) {
      answerBox.box.setFillStyle(0x00ff00); // Green
      answerBox.label.setText('✓');
      this.time.delayedCall(1000, () => this.hideQuestion());
    } else {
      answerBox.box.setFillStyle(0xff0000); // Red
      answerBox.box.setAlpha(0.6);
      answerBox.label.setText('✗');
      answerBox.disabled = true;
      
      if (result.gameEnded) {
        this.time.delayedCall(1500, () => this.gameOver());
      }
      // If not game over, player can try other answers
    }
  }

  hideQuestion() {
    console.log('Hiding question');
    
    // Hide question UI
    this.questionContainer.setVisible(false);
    
    // Clear answer colliders
    this.clearAnswerColliders();
    
    // Resume obstacle spawning
    this.obstacleTimer.paused = false;
    
    // Resume obstacle movement
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocityY(GAME_CONFIG.OBSTACLE_SPEED);
      obstacle.setAngularVelocity(Phaser.Math.Between(-100, 100));
    });
    
    // Check if game should end
    if (this.gameLogic.isAllQuestionsDone()) {
      this.showResults();
    }
  }

  hitObstacle(player, obstacle) {
    if (this.gameLogic.isInvulnerable || !this.gameLogic.isPlaying()) return;
    
    console.log('Player hit obstacle!');
    
    // Remove obstacle
    obstacle.destroy();
    
    // Decrease life and set invulnerability
    this.gameLogic.decrementLife();
    this.gameLogic.setInvulnerable(this);
    
    // Visual feedback - player flashing
    this.player.setTint(0xff0000);
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.player.clearTint();
        this.player.setAlpha(1);
      }
    });
    
    // Check game over
    if (this.gameLogic.isGameOver()) {
      this.time.delayedCall(500, () => this.gameOver());
    }
  }

  updateUI() {
    this.livesText.setText(`${this.gameLogic.lives}`);
    this.scoreText.setText(`${this.gameLogic.score}`);
  }

  gameOver() {
    console.log('Game Over!');
    
    // Stop everything
    this.obstacleTimer.destroy();
    this.obstacles.clear(true);
    this.clearAnswerColliders();
    
    // Hide question UI if visible
    this.questionContainer.setVisible(false);
    
    // Show game over screen
    const gameOverContainer = this.add.container(400, 300);
    gameOverContainer.setDepth(3000);
    
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.9);
    
    const gameOverText = this.add.text(0, -120, 'GAME OVER!', {
      fontSize: '56px',
      fill: '#ff0000',
      fontWeight: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    const finalScore = this.add.text(0, -40, `Final Score: ${this.gameLogic.score}`, {
      fontSize: '28px',
      fill: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    const livesUsed = this.add.text(0, 0, `Lives Used: ${GAME_CONFIG.STARTING_LIVES - this.gameLogic.lives}`, {
      fontSize: '20px',
      fill: '#ffaa00'
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(0, 60, '🔄 Restart Game', {
      fontSize: '24px',
      fill: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
      fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive();
    
    const homeBtn = this.add.text(0, 110, '🏠 Back to Home', {
      fontSize: '20px',
      fill: '#0099ff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    
    // Button interactions
    restartBtn.on('pointerdown', () => this.restartGame());
    restartBtn.on('pointerover', () => restartBtn.setScale(1.1));
    restartBtn.on('pointerout', () => restartBtn.setScale(1));
    
    homeBtn.on('pointerdown', () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    });
    homeBtn.on('pointerover', () => homeBtn.setScale(1.1));
    homeBtn.on('pointerout', () => homeBtn.setScale(1));
    
    gameOverContainer.add([overlay, gameOverText, finalScore, livesUsed, restartBtn, homeBtn]);
  }

  showResults() {
    console.log('Showing results');
    
    const results = this.gameLogic.getResults();
    console.log('Results:', results);
    
    // Stop everything
    if (this.obstacleTimer) this.obstacleTimer.destroy();
    this.obstacles.clear(true);
    this.clearAnswerColliders();
    
    // Navigate to results page with data
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gameResults', JSON.stringify(results));
      window.location.href = '/QuestGame/result';
    }
  }

  restartGame() {
    console.log('Restarting game');
    this.scene.restart();
  }
}