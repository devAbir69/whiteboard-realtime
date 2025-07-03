const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const socket = io();

let username = '';
let isDrawingEnabled = false;
let painting = false;
let lastPos = null;

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

// Handle user join
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

// Handle user leave
socket.on('user_left_announcement', (data) => {
    updateUserList(data.userList);

    const joinNotice = document.getElementById('joinNotice');
    joinNotice.textContent = `❌ ${data.username} left the board`;
    setTimeout(() => joinNotice.textContent = '', 4000);
});

// Update connected user list
function updateUserList(users) {
    const userListEl = document.getElementById('userList');
    userListEl.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userListEl.appendChild(li);
    });
}

// Toolbar tools
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

// Responsive canvas
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.65;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Mouse drawing
canvas.addEventListener('mousedown', (e) => {
    painting = true;
    lastPos = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mouseup', () => {
    painting = false;
    lastPos = null;
});
canvas.addEventListener('mouseleave', () => {
    painting = false;
    lastPos = null;
});
canvas.addEventListener('mousemove', (e) => {
    if (!painting || !isDrawingEnabled) return;
    const pos = { x: e.clientX, y: e.clientY };
    drawLine(lastPos, pos);
    socket.emit('draw_event', { from: lastPos, to: pos });
    lastPos = pos;
});

// Touch drawing
canvas.addEventListener('touchstart', (e) => {
    painting = true;
    const touch = e.touches[0];
    lastPos = { x: touch.clientX, y: touch.clientY };
});
canvas.addEventListener('touchend', () => {
    painting = false;
    lastPos = null;
});
canvas.addEventListener('touchcancel', () => {
    painting = false;
    lastPos = null;
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!painting || !isDrawingEnabled) return;
    const touch = e.touches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    drawLine(lastPos, pos);
    socket.emit('draw_event', { from: lastPos, to: pos });
    lastPos = pos;
});

// Draw function using line instead of dots
function drawLine(from, to) {
    if (!from || !to) return;
    ctx.strokeStyle = isErasing ? '#ffffff' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

// Listen to other users' drawing
socket.on('broadcast_draw', (data) => {
    drawLine(data.from, data.to);
});
