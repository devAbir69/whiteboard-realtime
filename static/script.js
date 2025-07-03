const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const socket = io();

let username = '';
let isDrawingEnabled = false;

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

socket.on('user_left_announcement', (data) => {
    updateUserList(data.userList);
    const joinNotice = document.getElementById('joinNotice');
    joinNotice.textContent = `❌ ${data.username} left the board`;
    setTimeout(() => joinNotice.textContent = '', 4000);
});

function updateUserList(users) {
    const userListEl = document.getElementById('userList');
    userListEl.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userListEl.appendChild(li);
    });
}

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
    // You can also emit a clear event here if needed
});

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.65;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let painting = false;
let lastPos = null;

canvas.addEventListener('mousedown', (e) => {
    painting = true;
    lastPos = getCanvasCoords(e.clientX, e.clientY);
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
    const pos = getCanvasCoords(e.clientX, e.clientY);
    drawOnCanvas(lastPos, pos);
    socket.emit('draw_event', { from: lastPos, to: pos });
    lastPos = pos;
});

canvas.addEventListener('touchstart', (e) => {
    painting = true;
    const touch = e.touches[0];
    lastPos = getCanvasCoords(touch.clientX, touch.clientY);
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
    if (!painting || !isDrawingEnabled) return;
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasCoords(touch.clientX, touch.clientY);
    drawOnCanvas(lastPos, pos);
    socket.emit('draw_event', { from: lastPos, to: pos });
    lastPos = pos;
});

function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function drawOnCanvas(from, to) {
    if (!from || !to) return;
    ctx.strokeStyle = isErasing ? '#ffffff' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

// Receive draw from others
socket.on('broadcast_draw', ({ from, to }) => {
    drawOnCanvas(from, to);
});
