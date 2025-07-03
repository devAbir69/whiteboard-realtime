const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const socket = io();

let username = '';
let isDrawingEnabled = false;

// Join handler
function startDrawing() {
    const input = document.getElementById('usernameInput');
    const name = input.value.trim();
    if (name !== '') {
        username = name;
        isDrawingEnabled = true;
        document.querySelector('.username-box').style.display = 'none';
        socket.emit('user_joined', username);
    } else {
        alert('Please enter a username to join!');
    }
}

// User joined broadcast
socket.on('user_joined_announcement', (data) => {
    updateUserList(data.userList);

    const joinNotice = document.getElementById('joinNotice');
    joinNotice.textContent = `✨ ${data.username} joined the board`;
    setTimeout(() => joinNotice.textContent = '', 4000);

    const joinSound = document.getElementById('joinSound');
    if (joinSound) {
        joinSound.currentTime = 0;
        joinSound.play().catch(e => console.log("Audio play blocked:", e));
    }
});

// User left broadcast
socket.on('user_left_announcement', (data) => {
    updateUserList(data.userList);

    const joinNotice = document.getElementById('joinNotice');
    joinNotice.textContent = `❌ ${data.username} left the board`;
    setTimeout(() => joinNotice.textContent = '', 4000);
});

// Update user list in sidebar
function updateUserList(users) {
    const userListEl = document.getElementById('userList');
    userListEl.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userListEl.appendChild(li);
    });
}

// Tool setup
let brushColor = '#000000';
let brushSize = 4;
let isErasing = false;

document.getElementById('colorPicker').addEventListener('input', (e) => {
    brushColor = e.target.value;
    isErasing = false;
});

document.getElementById('brushSize').addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
});

document.getElementById('eraserBtn').addEventListener('click', () => {
    isErasing = true;
});

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Canvas resize logic
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.65;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing handlers
let painting = false;

canvas.addEventListener('mousedown', () => painting = true);
canvas.addEventListener('mouseup', () => painting = false);
canvas.addEventListener('mouseleave', () => painting = false);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', () => painting = true);
canvas.addEventListener('touchend', () => painting = false);
canvas.addEventListener('touchcancel', () => painting = false);
canvas.addEventListener('touchmove', drawTouch);

function draw(e) {
    if (!painting || !isDrawingEnabled) return;
    const pos = { x: e.clientX, y: e.clientY };
    drawOnCanvas(pos);
    socket.emit('draw_event', pos);
}

function drawTouch(e) {
    e.preventDefault();
    if (!painting || !isDrawingEnabled) return;
    const touch = e.touches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    drawOnCanvas(pos);
    socket.emit('draw_event', pos);
}

function drawOnCanvas(pos) {
    ctx.fillStyle = isErasing ? '#ffffff' : brushColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}

// Receive draw event from others
socket.on('broadcast_draw', drawOnCanvas);
