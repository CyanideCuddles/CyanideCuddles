const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');

// Game Constants
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 100; // frames
const PIPE_GAP = 150;
const PIPE_WIDTH = 60;

// Game State
let state = 'start'; // 'start', 'playing', 'gameover'
let frames = 0;
let score = 0;
let bestScore = localStorage.getItem('neonBirdBestScore') || 0;
let animationId;

// Bird Object
const bird = {
    x: 100,
    y: 300,
    radius: 12,
    velocity: 0,
    rotation: 0,
    color: '#ff007f', // Accent color

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw bird glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Inner core
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();

        // Eye
        ctx.beginPath();
        ctx.arc(4, -3, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    },

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Calculate rotation based on velocity
        if (this.velocity >= JUMP_STRENGTH) {
            this.rotation = Math.min(Math.PI / 4, (this.velocity / 10) * (Math.PI / 4));
        } else {
            this.rotation = -Math.PI / 6;
        }

        // Floor collision
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }
        
        // Ceiling collision
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },

    jump() {
        this.velocity = JUMP_STRENGTH;
    },

    reset() {
        this.y = 300;
        this.velocity = 0;
        this.rotation = 0;
    }
};

// Pipes Array
let pipes = [];

class Pipe {
    constructor() {
        this.x = canvas.width;
        // Min height of a pipe part is 50px
        const minHeight = 50;
        const maxPos = canvas.height - minHeight - PIPE_GAP;
        this.topHeight = Math.max(minHeight, Math.random() * maxPos);
        this.bottomY = this.topHeight + PIPE_GAP;
        this.bottomHeight = canvas.height - this.bottomY;
        this.passed = false;
        this.color = '#66fcf1'; // Primary color
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        // Top Pipe
        ctx.fillRect(this.x, 0, PIPE_WIDTH, this.topHeight);
        ctx.strokeRect(this.x, 0, PIPE_WIDTH, this.topHeight);
        
        // Bottom Pipe
        ctx.fillRect(this.x, this.bottomY, PIPE_WIDTH, this.bottomHeight);
        ctx.strokeRect(this.x, this.bottomY, PIPE_WIDTH, this.bottomHeight);
        
        ctx.restore();
    }

    update() {
        this.x -= PIPE_SPEED;

        // Score update
        if (!this.passed && this.x + PIPE_WIDTH < bird.x) {
            score++;
            scoreDisplay.innerText = score;
            this.passed = true;
        }

        // Collision detection
        const hitX = bird.x + bird.radius > this.x && bird.x - bird.radius < this.x + PIPE_WIDTH;
        const hitY = bird.y - bird.radius < this.topHeight || bird.y + bird.radius > this.bottomY;

        if (hitX && hitY) {
            gameOver();
        }
    }
}

// Background Particles for extra aesthetic
let particles = [];
class Particle {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.color = 'rgba(255, 255, 255, ' + Math.random() * 0.5 + ')';
    }
    update() {
        this.x -= this.speed;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleParticles() {
    if (frames % 10 === 0) {
        particles.push(new Particle());
    }
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].x < 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

// Game Control Functions
function resetGame() {
    bird.reset();
    pipes = [];
    score = 0;
    frames = 0;
    scoreDisplay.innerText = score;
    scoreDisplay.style.opacity = '1';
    state = 'start';
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    drawInitial();
}

function startGame() {
    state = 'playing';
    startScreen.classList.add('hidden');
    loop();
}

function gameOver() {
    state = 'gameover';
    cancelAnimationFrame(animationId);
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('neonBirdBestScore', bestScore);
    }
    
    finalScoreEl.innerText = score;
    bestScoreEl.innerText = bestScore;
    
    scoreDisplay.style.opacity = '0';
    gameOverScreen.classList.remove('hidden');
}

// Input Handling
function flap() {
    if (state === 'start') {
        startGame();
        bird.jump();
    } else if (state === 'playing') {
        bird.jump();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
    }
});

canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent double firing with mousedown
    flap();
});

startBtn.addEventListener('click', () => {
    if (state === 'start') startGame();
});

restartBtn.addEventListener('click', () => {
    resetGame();
});

// Main Loop
function loop() {
    if (state !== 'playing') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    handleParticles();

    // Pipe logic
    if (frames % PIPE_SPAWN_RATE === 0) {
        pipes.push(new Pipe());
    }

    for (let i = 0; i < pipes.length; i++) {
        pipes[i].update();
        pipes[i].draw();

        // Remove off-screen pipes
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
            i--;
        }
    }

    bird.update();
    bird.draw();

    frames++;
    animationId = requestAnimationFrame(loop);
}

// Initial Draw (Background only)
function drawInitial() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bird.draw();
}

// Initialize
drawInitial();
