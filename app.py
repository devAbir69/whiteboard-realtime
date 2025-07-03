from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins

connected_users = set()
users_by_sid = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('user_joined')
def handle_user_join(username):
    connected_users.add(username)
    users_by_sid[request.sid] = username

    print(f"✅ {username} joined (SID: {request.sid})")
    emit('user_joined_announcement', {
        'username': username,
        'userList': list(connected_users)
    }, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    username = users_by_sid.get(sid)

    if username:
        connected_users.discard(username)
        del users_by_sid[sid]

        print(f"❌ {username} disconnected (SID: {sid})")
        emit('user_left_announcement', {
            'username': username,
            'userList': list(connected_users)
        }, broadcast=True)

@socketio.on('draw_event')
def handle_draw_event(data):
    emit('broadcast_draw', data, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # 💡 Dynamic for Render
    socketio.run(app, host='0.0.0.0', port=port)
