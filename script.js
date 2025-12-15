const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const rickrollAudio = document.getElementById('rickroll');

let gameState = 'start';
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let pipesPassed = 0;
let gravity = 0.15;
let jumpPower = -6;
let bird = { x: 100, y: 300, velocity: 0, radius: 20 };
let pipes = [];
let pipeWidth = 50;
let pipeGap = 220;
let pipeSpeed = 0.9;
let frame = 0;
let particles = [];
const GROUND_Y = canvas.height; // Visual ground at very bottom

function flap() {
    if (gameState === 'playing') {
        bird.velocity = jumpPower;
        createParticles(bird.x, bird.y, '#FFD700');
    } else if (gameState === 'start') {
        startGame();
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            maxLife: 30,
            color: color
        });
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flap();
    }
});

canvas.addEventListener('click', flap);
restartBtn.addEventListener('click', restartGame);

function addPipe() {
    let currentPipeWidth = pipeWidth;
    if (pipesPassed < 20) {
        currentPipeWidth = 30;
    }
    
    const minGap = 120;
    const maxGap = (canvas.height - 150) - pipeGap - 120; // Keep pipes away from bottom
    const topHeight = Math.random() * (maxGap - minGap) + minGap;
    pipes.push({ x: canvas.width, topHeight, scored: false });
}

function update() {
    if (gameState !== 'playing') return;

    bird.velocity += gravity;
    bird.y += bird.velocity;
    
    pipeSpeed = 0.9 + Math.min(pipesPassed * 0.001, 0.3);

    // Lose ONLY when bird is COMPLETELY OFF SCREEN DOWN (y + radius > canvas.height)
    if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < -10) {
        gameOver();
        return;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        if (pipes[i].x + pipeWidth < bird.x && !pipes[i].scored) {
            score++;
            pipesPassed++;
            scoreEl.textContent = `Score: ${score}`;
            pipes[i].scored = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
            }
        }

        const pipeBottomY = pipes[i].topHeight + pipeGap;
        if (bird.x + bird.radius > pipes[i].x &&
            bird.x - bird.radius < pipes[i].x + pipeWidth) {
            if (bird.y - bird.radius < pipes[i].topHeight ||
                bird.y + bird.radius > pipeBottomY) {
                gameOver();
                return;
            }
        }

        if (pipes[i].x + pipeWidth < -50) {
            pipes.splice(i, 1);
        }
    }

    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vy += 0.3;
        p.color = `hsla(${Math.random()*60 + 40}, 100%, 60%, ${p.life/p.maxLife})`;
        return p.life > 0;
    });

    frame++;
    if (frame % 240 === 0) {
        addPipe();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 4; i++) {
        const cloudX = (100 + (frame * 0.6 + i * 180)) % (canvas.width + 250);
        const cloudY = 80 + i * 60 + Math.sin(frame * 0.02 + i) * 10;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 35, 0, Math.PI * 2);
        ctx.arc(cloudX + 35, cloudY, 45, 0, Math.PI * 2);
        ctx.arc(cloudX + 70, cloudY, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.min(Math.max(bird.velocity * 0.06, -0.5), 0.8));
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(-18, -8, 36, 16);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.arc(12, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#228B22';
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 5;
    for (let pipe of pipes) {
        let currentPipeWidth = pipeWidth;
        if (pipesPassed < 20) {
            currentPipeWidth = 30;
        }
        
        ctx.fillRect(pipe.x, 0, currentPipeWidth, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, currentPipeWidth, pipe.topHeight);
        
        const bottomY = pipe.topHeight + pipeGap;
        ctx.fillRect(pipe.x, bottomY, currentPipeWidth, GROUND_Y - bottomY);
        ctx.strokeRect(pipe.x, bottomY, currentPipeWidth, GROUND_Y - bottomY);
        
        ctx.fillStyle = '#006400';
        for (let j = 0; j < 8; j++) {
            ctx.fillRect(pipe.x + 5, j * 12, currentPipeWidth - 10, 8);
        }
    }
    ctx.fillStyle = '#228B22';

    // Visual ground at VERY BOTTOM 
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, GROUND_Y - 40, canvas.width, 40);

    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (gameState === 'start') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 15;
        ctx.fillText('FLAPPY', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText('BIRD', canvas.width / 2, canvas.height / 2 + 30);
        ctx.shadowBlur = 0;
        
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Click or Space to Flap!', canvas.width / 2, canvas.height / 2 + 100);
        
        ctx.font = '24px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height - 80);
    }

    if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    score = 0;
    pipesPassed = 0;
    scoreEl.textContent = 'Score: 0';
    bird.y = 300;
    bird.velocity = 0;
    pipes = [];
    frame = 0;
    particles = [];
    addPipe();
}

function gameOver() {
    gameState = 'gameOver';
    finalScoreEl.textContent = score;
    gameOverEl.style.display = 'block';
    createParticles(bird.x, bird.y, '#FF6B6B');
    rickrollAudio.currentTime = 0;
    rickrollAudio.play().catch(e => console.log('Audio play failed:', e));
}

function restartGame() {
    gameOverEl.style.display = 'none';
    rickrollAudio.pause();
    rickrollAudio.currentTime = 0;
    startGame();
}

gameLoop();