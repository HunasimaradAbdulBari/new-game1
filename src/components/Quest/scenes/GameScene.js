import { GameLogic, GAME_CONFIG } from '../utils/gameLogic.js';

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
    
    // Game logic
    this.gameLogic = null;
    this.obstacleTimer = null;
    this.answerColliders = [];
  }

  init(data) {
    this.questions = data.questions || [];
    this.gameLogic = new GameLogic(this.questions);
  }

  preload() {
    // Create fallback graphics
    this.createFallbackAssets();
    
    // Try to load assets
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load ${file.key}, using fallback`);
    });
    
    this.load.image('background', '/bg.png');
    this.load.image('rocket', '/rocket.png');
    this.load.image('obstacle', '/obstacle.png');
    this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
  }

  createFallbackAssets() {
    // Rocket fallback
    const rocketGraphics = this.add.graphics();
    rocketGraphics.fillStyle(0x00ff00);
    rocketGraphics.fillTriangle(0, 15, 30, 0, 30, 30);
    rocketGraphics.fillStyle(0x0066cc);
    rocketGraphics.fillRect(25, 12, 10, 6);
    rocketGraphics.generateTexture('rocket-fallback', 40, 30);
    rocketGraphics.destroy();
    
    // Obstacle fallback
    const obstacleGraphics = this.add.graphics();
    obstacleGraphics.fillStyle(0xff0000);
    obstacleGraphics.fillCircle(15, 15, 15);
    obstacleGraphics.generateTexture('obstacle-fallback', 30, 30);
    obstacleGraphics.destroy();
    
    // Background fallback
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a3e, 0x1a1a3e, 1);
    bgGraphics.fillRect(0, 0, 800, 600);
    bgGraphics.generateTexture('background-fallback', 800, 600);
    bgGraphics.destroy();
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);
    
    // Create background
    this.createBackground();
    
    // Create player
    this.createPlayer();
    
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
  }

  createBackground() {
    try {
      if (this.cache.video.exists('bgvideo')) {
        this.background = this.add.video(400, 300, 'bgvideo');
        this.background.setDisplaySize(800, 600);
        this.background.play(true);
      } else if (this.textures.exists('background')) {
        this.background = this.add.image(400, 300, 'background');
        this.background.setDisplaySize(800, 600);
      } else {
        this.background = this.add.image(400, 300, 'background-fallback');
      }
    } catch (error) {
      this.background = this.add.image(400, 300, 'background-fallback');
    }
  }

  createPlayer() {
    const playerTexture = this.textures.exists('rocket') ? 'rocket' : 'rocket-fallback';
    
    this.player = this.physics.add.sprite(GAME_CONFIG.PLANE_POSITION_X, 300, playerTexture);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GAME_CONFIG.GRAVITY);
    this.player.setScale(1);
    this.player.setSize(30, 20);
  }

  createUI() {
    this.livesText = this.add.text(16, 16, `Lives: ${this.gameLogic.lives}`, {
      fontSize: '24px',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 2
    });
    
    this.scoreText = this.add.text(16, 50, `Score: ${this.gameLogic.score}`, {
      fontSize: '24px',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    });
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    this.input.on('pointerdown', () => {
      if (this.gameLogic.isPlaying() || this.gameLogic.isQuestionActive()) {
        this.makePlayerJump();
      }
    });
  }

  createQuestionUI() {
    this.questionContainer = this.add.container(0, 0);
    this.questionContainer.setVisible(false);
    this.questionContainer.setDepth(2000);
    
    // Overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    this.questionContainer.add(overlay);
    
    // Question background
    const questionBg = this.add.rectangle(400, 100, 750, 100, 0xffffff);
    this.questionContainer.add(questionBg);
    
    // Question text
    this.questionText = this.add.text(400, 100, '', {
      fontSize: '18px',
      fill: '#000000',
      align: 'center',
      wordWrap: { width: 700 }
    }).setOrigin(0.5);
    this.questionContainer.add(this.questionText);
    
    // Answer boxes
    const answerYPositions = [220, 320, 420];
    const answerColors = [0x4285f4, 0x34a853, 0xfbbc04];
    
    this.answerBoxes = [];
    for (let i = 0; i < 3; i++) {
      const answerBox = this.add.rectangle(400, answerYPositions[i], 700, 70, answerColors[i]);
      answerBox.setStrokeStyle(3, 0xffffff);
      
      const answerText = this.add.text(400, answerYPositions[i], '', {
        fontSize: '16px',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 500 }
      }).setOrigin(0.5);
      
      answerBox.setInteractive();
      answerBox.on('pointerdown', () => this.selectAnswer(i));
      
      const zone = this.physics.add.staticGroup().create(400, answerYPositions[i]);
      zone.setSize(700, 70);
      zone.setVisible(false);
      
      this.answerBoxes.push({
        box: answerBox,
        text: answerText,
        zone: zone,
        disabled: false,
        originalColor: answerColors[i]
      });
      
      this.questionContainer.add([answerBox, answerText]);
    }
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
    const obstacleTexture = this.textures.exists('obstacle') ? 'obstacle' : 'obstacle-fallback';
    const obstacle = this.obstacles.create(x, -50, obstacleTexture);
    
    obstacle.setVelocityY(GAME_CONFIG.OBSTACLE_SPEED);
    obstacle.setScale(1);
  }

  makePlayerJump() {
    if (this.gameLogic.isGameOver()) return;
    this.player.setVelocityY(GAME_CONFIG.PLANE_IMPULSE);
  }

  update() {
    if (this.spaceKey.isDown) {
      this.makePlayerJump();
    }
    
    // Clean up obstacles and check for questions
    this.obstacles.children.entries.forEach(obstacle => {
      if (obstacle.y > 650) {
        if (this.gameLogic.isPlaying()) {
          const shouldShowQuestion = this.gameLogic.passObstacle();
          if (shouldShowQuestion) {
            this.showQuestion();
          }
        }
        obstacle.destroy();
      }
    });
    
    this.updateUI();
  }

  showQuestion() {
    const question = this.gameLogic.getCurrentQuestion();
    if (!question) {
      this.showResults();
      return;
    }
    
    this.obstacleTimer.paused = true;
    
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocity(0, 0);
    });
    
    this.questionText.setText(question.question);
    
    for (let i = 0; i < 3; i++) {
      const answer = this.answerBoxes[i];
      answer.text.setText(question.answers[i]);
      answer.box.setFillStyle(answer.originalColor);
      answer.disabled = false;
    }
    
    this.questionContainer.setVisible(true);
    
    this.clearAnswerColliders();
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

  selectAnswer(answerIndex) {
    const answerBox = this.answerBoxes[answerIndex];
    if (answerBox.disabled) return;
    
    const question = this.gameLogic.getCurrentQuestion();
    const selectedAnswer = question.answers[answerIndex];
    const result = this.gameLogic.submitAnswer(selectedAnswer);
    
    if (result.correct) {
      answerBox.box.setFillStyle(0x00ff00);
      this.time.delayedCall(1000, () => this.hideQuestion());
    } else {
      answerBox.box.setFillStyle(0xff0000);
      answerBox.disabled = true;
      
      if (result.gameEnded) {
        this.time.delayedCall(1500, () => this.gameOver());
      }
    }
  }

  hideQuestion() {
    this.questionContainer.setVisible(false);
    this.clearAnswerColliders();
    this.obstacleTimer.paused = false;
    
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocityY(GAME_CONFIG.OBSTACLE_SPEED);
    });
    
    if (this.gameLogic.isAllQuestionsDone()) {
      this.showResults();
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

  hitObstacle(player, obstacle) {
    if (this.gameLogic.isInvulnerable || !this.gameLogic.isPlaying()) return;
    
    obstacle.destroy();
    this.gameLogic.decrementLife();
    this.gameLogic.setInvulnerable(this);
    
    this.player.setTint(0xff0000);
    this.time.delayedCall(200, () => this.player.clearTint());
    
    if (this.gameLogic.isGameOver()) {
      this.time.delayedCall(500, () => this.gameOver());
    }
  }

  updateUI() {
    this.livesText.setText(`Lives: ${this.gameLogic.lives}`);
    this.scoreText.setText(`Score: ${this.gameLogic.score}`);
  }

  gameOver() {
    this.obstacleTimer.destroy();
    this.obstacles.clear(true);
    
    const gameOverContainer = this.add.container(400, 300);
    gameOverContainer.setDepth(3000);
    
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.9);
    const gameOverText = this.add.text(0, -60, 'GAME OVER!', {
      fontSize: '48px',
      fill: '#ff0000',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(0, 40, 'Click to Restart', {
      fontSize: '20px',
      fill: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    
    restartBtn.on('pointerdown', () => this.scene.restart());
    
    gameOverContainer.add([overlay, gameOverText, restartBtn]);
  }

  showResults() {
    const results = this.gameLogic.getResults();
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gameResults', JSON.stringify(results));
      window.location.href = '/QuestGame/result';
    }
  }
}