// Configuration constants
export const GAME_CONFIG = {
  STARTING_LIVES: 3,
  OBSTACLES_TO_QUESTION: 6,
  OBSTACLE_SPAWN_INTERVAL: 1200,
  INVULNERABILITY_MS_AFTER_HIT: 1000,
  SCORE_PER_CORRECT: 10,
  PLANE_IMPULSE: -300,
  GRAVITY: 500,
  OBSTACLE_SPEED: 150,
  PLANE_POSITION_X: 150
};

// Game states
export const GAME_STATES = {
  PLAYING: 'PLAYING',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE', 
  GAME_OVER: 'GAME_OVER',
  RESULTS: 'RESULTS'
};

// Game logic class to manage state
export class GameLogic {
  constructor(questions = []) {
    this.questions = questions;
    this.reset();
  }

  reset() {
    this.lives = GAME_CONFIG.STARTING_LIVES;
    this.score = 0;
    this.questionIndex = 0;
    this.obstaclesPassed = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.gameState = GAME_STATES.PLAYING;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = null;
  }

  // Question management
  getCurrentQuestion() {
    if (this.questionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.questionIndex];
  }

  advanceQuestion() {
    this.questionIndex++;
    if (this.questionIndex >= this.questions.length) {
      this.gameState = GAME_STATES.RESULTS;
      return false;
    }
    return true;
  }

  // Score and lives management
  incrementScore() {
    this.score += GAME_CONFIG.SCORE_PER_CORRECT;
    this.correctAnswers++;
  }

  decrementLife() {
    this.lives--;
    this.wrongAnswers++;
    if (this.lives <= 0) {
      this.gameState = GAME_STATES.GAME_OVER;
    }
  }

  // Obstacle tracking
  passObstacle() {
    if (this.gameState !== GAME_STATES.PLAYING) return false;
    
    this.obstaclesPassed++;
    if (this.obstaclesPassed >= GAME_CONFIG.OBSTACLES_TO_QUESTION) {
      this.obstaclesPassed = 0;
      return this.triggerQuestion();
    }
    return false;
  }

  triggerQuestion() {
    const question = this.getCurrentQuestion();
    if (question) {
      this.gameState = GAME_STATES.QUESTION_ACTIVE;
      return true;
    } else {
      this.gameState = GAME_STATES.RESULTS;
      return false;
    }
  }

  // Answer validation
  submitAnswer(selectedAnswer) {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return { correct: false, gameEnded: true };

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      this.incrementScore();
      this.advanceQuestion();
      this.gameState = GAME_STATES.PLAYING;
      return { correct: true, gameEnded: this.gameState === GAME_STATES.RESULTS };
    } else {
      this.decrementLife();
      return { correct: false, gameEnded: this.gameState === GAME_STATES.GAME_OVER };
    }
  }

  // State checkers
  isGameOver() {
    return this.gameState === GAME_STATES.GAME_OVER;
  }

  isAllQuestionsDone() {
    return this.gameState === GAME_STATES.RESULTS;
  }

  isQuestionActive() {
    return this.gameState === GAME_STATES.QUESTION_ACTIVE;
  }

  isPlaying() {
    return this.gameState === GAME_STATES.PLAYING;
  }

  // Get final results
  getResults() {
    const totalQuestions = this.questionIndex;
    const percentage = totalQuestions > 0 ? Math.round((this.correctAnswers / totalQuestions) * 100) : 0;
    
    return {
      score: this.score,
      totalQuestions,
      correctAnswers: this.correctAnswers,
      wrongAnswers: this.wrongAnswers,
      livesUsed: GAME_CONFIG.STARTING_LIVES - this.lives,
      percentage,
      passed: percentage >= 70 // 70% passing threshold
    };
  }

  // Invulnerability management
  setInvulnerable(scene, duration = GAME_CONFIG.INVULNERABILITY_MS_AFTER_HIT) {
    this.isInvulnerable = true;
    
    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.destroy();
    }
    
    this.invulnerabilityTimer = scene.time.delayedCall(duration, () => {
      this.isInvulnerable = false;
      this.invulnerabilityTimer = null;
    });
  }

  // Load questions (for API integration later)
  loadQuestions(newQuestions) {
    this.questions = newQuestions;
    this.reset();
  }
}