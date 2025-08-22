// src/components/Quest/scenes/GameScene.js
// Complete GameScene with embedded logic and enhanced features

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Game state (embedded to avoid import issues)
    this.lives = 3;
    this.score = 0;
    this.questionIndex = 0;
    this.obstaclesPassed = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.gameState = 'PLAYING'; // PLAYING, QUESTION_ACTIVE, GAME_OVER, RESULTS
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
    this.questions = data?.questions || [];
    
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
    // Create enhanced fallback graphics first
    this.createEnhancedAssets();
    
    // Set up error handling for external assets
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load ${file.key}, using enhanced fallback`);
    });
    
    // Try to load external assets (fallback to generated if missing)
    this.load.image('background', '/bg.png');
    this.load.image('rocket', '/rocket.png');
    this.load.image('obstacle', '/obstacle.png');
    
    // Optional video background
    try {
      this.load.video('bgvideo', '/bg.mp4', 'loadeddata', false, false);
    } catch (error) {
      console.log('Video background not available, using static background');
    }
  }

  createEnhancedAssets() {
    // Enhanced rocket design
    const rocketGraphics = this.add.graphics();
    // Main body (green)
    rocketGraphics.fillStyle(0x00ff44);
    rocketGraphics.fillTriangle(15, 0, 0, 30, 30, 30);
    // Engine (blue)
    rocketGraphics.fillStyle(0x0066ff);
    rocketGraphics.fillRect(12, 25, 6, 8);
    // Fins (dark green)
    rocketGraphics.fillStyle(0x008822);
    rocketGraphics.fillTriangle(0, 30, 8, 35, 0, 35);
    rocketGraphics.fillTriangle(30, 30, 22, 35, 30, 35);
    // Window (light blue)
    rocketGraphics.fillStyle(0x88ddff);
    rocketGraphics.fillCircle(15, 12, 4);
    rocketGraphics.generateTexture('rocket-fallback', 30, 35);
    rocketGraphics.destroy();
    
    // Enhanced obstacle design (spiky asteroid)
    const obstacleGraphics = this.add.graphics();
    obstacleGraphics.fillStyle(0xff2222);
    obstacleGraphics.fillCircle(15, 15, 15);
    // Add spikes
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
    obstacleGraphics.generateTexture('obstacle-fallback', 30, 30);
    obstacleGraphics.destroy();
    
    // Enhanced animated starfield background
    const bgGraphics = this.add.graphics();
    // Gradient background
    bgGraphics.fillGradientStyle(0x000011, 0x000033, 0x110033, 0x330055, 1);
    bgGraphics.fillRect(0, 0, 800, 600);
    
    // Add varied stars
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const brightness = Math.random();
      const size = brightness > 0.8 ? 2 : 1;
      
      if (brightness > 0.9) {
        bgGraphics.fillStyle(0xffffff); // Bright white stars
      } else if (brightness > 0.7) {
        bgGraphics.fillStyle(0xccddff); // Blue-white stars
      } else if (brightness > 0.5) {
        bgGraphics.fillStyle(0xffddcc); // Orange stars
      } else {
        bgGraphics.fillStyle(0x888888); // Dim stars
      }
      
      bgGraphics.fillCircle(x, y, size);
    }
    
    // Add some nebula effects
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const size = 30 + Math.random() * 60;
      bgGraphics.fillStyle(0x331166, 0.3);
      bgGraphics.fillCircle(x, y, size);
    }
    
    bgGraphics.generateTexture('background-fallback', 800, 600);
    bgGraphics.destroy();
  }

  create() {
    // Set world bounds
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
      // Priority: Video > Image > Fallback
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
      console.warn('Background creation error, using fallback');
      this.background = this.add.image(400, 300, 'background-fallback');
    }
  }

  createPlayer() {
    const playerTexture = this.textures.exists('rocket') ? 'rocket' : 'rocket-fallback';
    
    this.player = this.physics.add.sprite(150, 300, playerTexture);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(500);
    this.player.setScale(1.2);
    this.player.setSize(25, 28);
    
    // Add a subtle glow effect
    this.player.setBlendMode('ADD');
    this.time.delayedCall(100, () => this.player.setBlendMode('NORMAL'));
  }

  createUI() {
    // Lives display with heart icons
    this.livesText = this.add.text(16, 16, `❤️ Lives: ${this.lives}`, {
      fontSize: '24px',
      fill: '#ff4444',
      stroke: '#ffffff',
      strokeThickness: 2,
      fontWeight: 'bold'
    });
    
    // Score display with coin icon
    this.scoreText = this.add.text(16, 50, `⭐ Score: ${this.score}`, {
      fontSize: '24px',
      fill: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2,
      fontWeight: 'bold'
    });

    // Progress indicator
    const totalQuestions = this.questions.length;
    this.progressText = this.add.text(16, 84, `📝 Question: ${Math.min(this.questionIndex + 1, totalQuestions)}/${totalQuestions}`, {
      fontSize: '20px',
      fill: '#4488ff',
      stroke: '#ffffff',
      strokeThickness: 1,
      fontWeight: 'bold'
    });

    // Game instructions (top right)
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
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Enhanced touch/click input with visual feedback
    this.input.on('pointerdown', (pointer) => {
      if (this.gameState === 'PLAYING' || this.gameState === 'QUESTION_ACTIVE') {
        this.makePlayerJump();
        
        // Visual feedback for touch
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
    
    // Enhanced overlay with pulse effect
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
    this.questionContainer.add(overlay);
    
    // Enhanced question background with glow
    const questionBg = this.add.rectangle(400, 120, 760, 120, 0xffffff);
    questionBg.setStrokeStyle(4, 0x4488ff);
    const questionGlow = this.add.rectangle(400, 120, 770, 130, 0x4488ff, 0.3);
    this.questionContainer.add([questionGlow, questionBg]);
    
    // Question text with enhanced styling
    this.questionText = this.add.text(400, 120, '', {
      fontSize: '22px',
      fill: '#000000',
      align: 'center',
      fontWeight: 'bold',
      wordWrap: { width: 720 }
    }).setOrigin(0.5);
    this.questionContainer.add(this.questionText);
    
    // Enhanced answer boxes with labels
    const answerYPositions = [240, 340, 440];
    const answerColors = [0x4285f4, 0x34a853, 0xfbbc04]; // Blue, Green, Yellow
    const answerLabels = ['A', 'B', 'C'];
    
    this.answerBoxes = [];
    for (let i = 0; i < 3; i++) {
      // Glow effect behind answer box
      const answerGlow = this.add.rectangle(400, answerYPositions[i], 730, 85, answerColors[i], 0.3);
      
      // Main answer box
      const answerBox = this.add.rectangle(400, answerYPositions[i], 720, 80, answerColors[i]);
      answerBox.setStrokeStyle(4, 0xffffff);
      
      // Answer label (A, B, C)
      const labelText = this.add.text(80, answerYPositions[i], answerLabels[i], {
        fontSize: '28px',
        fill: '#ffffff',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Answer text
      const answerText = this.add.text(400, answerYPositions[i], '', {
        fontSize: '18px',
        fill: '#ffffff',
        align: 'center',
        fontWeight: 'bold',
        wordWrap: { width: 600 }
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

    // Enhanced instruction text with animation
    const instructionText = this.add.text(400, 520, '🚀 Click an answer or fly into it with your rocket!', {
      fontSize: '18px',
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

  startObstacleSpawning() {
    this.obstacleTimer = this.time.addEvent({
      delay: 1400, // Spawn every 1.4 seconds
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  spawnObstacle() {
    if (this.gameState !== 'PLAYING') return;
    
    const x = Phaser.Math.Between(200, 750);
    const obstacleTexture = this.textures.exists('obstacle') ? 'obstacle' : 'obstacle-fallback';
    const obstacle = this.obstacles.create(x, -30, obstacleTexture);
    
    obstacle.setVelocityY(130);
    obstacle.setScale(1);
    obstacle.setCircle(15);
    
    // Add rotation to obstacles for visual appeal
    obstacle.setAngularVelocity(Phaser.Math.Between(-200, 200));
    
    // Add a subtle red glow
    obstacle.setTint(0xff6666);
  }

  makePlayerJump() {
    if (this.gameState === 'GAME_OVER') return;
    
    this.player.setVelocityY(-320);
    
    // Visual feedback for jump
    this.player.setScale(1.3);
    this.time.delayedCall(100, () => this.player.setScale(1.2));
    
    // Particle effect for jump (simple)
    for (let i = 0; i < 3; i++) {
      const particle = this.add.circle(
        this.player.x + Phaser.Math.Between(-10, 10), 
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
    // Handle spacebar input
    if (this.spaceKey.isDown) {
      this.makePlayerJump();
    }
    
    // Clean up obstacles and check for questions
    this.obstacles.children.entries.forEach(obstacle => {
      if (obstacle.y > 650) {
        if (this.gameState === 'PLAYING') {
          this.obstaclesPassed++;
          if (this.obstaclesPassed >= 5) { // Show question every 5 obstacles
            this.obstaclesPassed = 0;
            this.showQuestion();
          }
        }
        obstacle.destroy();
      }
    });
    
    // Update UI
    this.updateUI();
    
    // Add subtle player animation when playing
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
    
    // Pause obstacle spawning
    this.obstacleTimer.paused = true;
    
    // Stop all existing obstacles with fade effect
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.setVelocity(0, 0);
      this.tweens.add({
        targets: obstacle,
        alpha: 0.3,
        duration: 500
      });
    });
    
    // Set question text with typewriter effect
    this.questionText.setText('');
    this.typeWriterText(this.questionText, question.question, 30);
    
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

  typeWriterText(textObject, fullText, speed = 50) {
    let currentText = '';
    let charIndex = 0;
    
    const timer = this.time.addEvent({
      delay: speed,
      repeat: fullText.length - 1,
      callback: () => {
        currentText += fullText[charIndex];
        textObject.setText(currentText);
        charIndex++;
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
      this.score += 10;
      this.correctAnswers++;
      this.questionIndex++;
      
      // Show +10 score popup
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
      // Wrong answer - red with shake
      answerBox.box.setFillStyle(0xff2222);
      answerBox.glow.setFillStyle(0xff2222);
      
      // Shake effect
      this.tweens.add({
        targets: [answerBox.box, answerBox.glow, answerBox.text, answerBox.label],
        x: '+=10',
        duration: 50,
        yoyo: true,
        repeat: 5
      });
      
      // Decrease life
      this.lives--;
      this.wrongAnswers++;
      
      // Screen flash for damage
      const damageFlash = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3);
      damageFlash.setDepth(1500);
      this.tweens.add({
        targets: damageFlash,
        alpha: 0,
        duration: 200,
        onComplete: () => damageFlash.destroy()
      });
      
      // Check if game over
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
    // Fade out question UI
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
    
    // Check if all questions are done
    if (this.questionIndex >= this.questions.length) {
      this.time.delayedCall(500, () => this.showResults());
      return;
    }
    
    // Resume game after delay
    this.time.delayedCall(600, () => {
      this.gameState = 'PLAYING';
      this.obstacleTimer.paused = false;
      
      // Resume obstacle movement and restore alpha
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
    
    // Enhanced hit effects
    obstacle.destroy();
    
    // Screen shake
    this.cameras.main.shake(200, 0.02);
    
    // Decrease life
    this.lives--;
    this.wrongAnswers++;
    
    // Set invulnerability
    this.isInvulnerable = true;
    
    // Enhanced visual feedback
    this.player.setTint(0xff0000);
    
    // Player flash effect
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
    
    // Damage text popup
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
    
    // Remove invulnerability after 1 second
    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.destroy();
    }
    this.invulnerabilityTimer = this.time.delayedCall(1000, () => {
      this.isInvulnerable = false;
      this.invulnerabilityTimer = null;
    });
    
    // Check if game over
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
    
    // Stop obstacle spawning
    if (this.obstacleTimer) {
      this.obstacleTimer.destroy();
    }
    
    // Clear all obstacles with fade effect
    this.obstacles.children.entries.forEach(obstacle => {
      this.tweens.add({
        targets: obstacle,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => obstacle.destroy()
      });
    });
    
    // Create enhanced game over screen
    const gameOverContainer = this.add.container(400, 300);
    gameOverContainer.setDepth(3000);
    
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.95);
    
    // Main game over text with glow
    const gameOverGlow = this.add.text(0, -80, 'GAME OVER!', {
      fontSize: '52px',
      fill: '#ff4444',
      fontWeight: 'bold',
      stroke: '#ffcccc',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    const gameOverText = this.add.text(0, -80, 'GAME OVER!', {
      fontSize: '48px',
      fill: '#ffffff',
      fontWeight: 'bold',
      stroke: '#ff0000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Enhanced stats display
    const accuracy = this.questionIndex > 0 ? Math.round((this.correctAnswers / this.questionIndex) * 100) : 0;
    const statsText = this.add.text(0, -20, 
      `🎯 Final Score: ${this.score}\n📊 Questions: ${this.questionIndex}/${this.questions.length}\n✅ Correct: ${this.correctAnswers} | ❌ Wrong: ${this.wrongAnswers}\n🎪 Accuracy: ${accuracy}%`, {
      fontSize: '18px',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 8,
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // Enhanced restart button
    const restartBtn = this.add.text(0, 70, '🔄 Restart Mission', {
      fontSize: '22px',
      fill: '#44ff44',
      backgroundColor: '#003300',
      padding: { x: 25, y: 12 },
      fontWeight: 'bold'
    }).setOrigin(0.5).setInteractive();
    
    // Enhanced home button
    const homeBtn = this.add.text(0, 120, '🏠 Return to Base', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333366',
      padding: { x: 20, y: 10 },
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
    
    // Animate game over screen in
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
    
    // Show transition screen before redirect
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
    
    // Animate transition in
    transitionContainer.setAlpha(0);
    this.tweens.add({
      targets: transitionContainer,
      alpha: 1,
      duration: 500
    });
    
    // Save results and redirect after animation
    this.time.delayedCall(2000, () => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('gameResults', JSON.stringify(results));
        window.location.href = '/QuestGame/result';
      }
    });
  }
}