from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from flask_admin import Admin
from flask_sqlalchemy import SQLAlchemy
from flask_admin.contrib import sqla
from datetime import datetime, timedelta
from sqlalchemy import text, or_
import json
import os
import time
import random
import uuid
from flask_socketio import SocketIO, emit, join_room
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv

# Loading environment variables from .env file
load_dotenv()

# ===== PATH =====
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# ===== APP =====
app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = 'your-secret-key-change-it'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'tag.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

socketio = SocketIO(app, cors_allowed_origins="*")

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# ===== MODELS =====
class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(50), unique=True)

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'))
    city = db.relationship('City', backref='locations')
    theme = db.Column(db.String(50))
    photos = db.Column(db.Text)
    approved = db.Column(db.Boolean, default=False)

class Suggestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20))
    city = db.Column(db.String(100))
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    user_id = db.Column(db.String(50))
    nickname = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SuggestionPhoto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location_title = db.Column(db.String(200))
    city = db.Column(db.String(100))
    filename = db.Column(db.String(200))
    user_id = db.Column(db.String(50))
    status = db.Column(db.String(20), default='pending')

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    telegram_username = db.Column(db.String(120), unique=True, nullable=True)
    telegram_id = db.Column(db.String(50), unique=True, nullable=True)
    nickname = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    avatar = db.Column(db.Text, nullable=True)  # Base64 encoded image
    is_confirmed = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class PrivateMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    file_url = db.Column(db.String(500), nullable=True)  # Path to uploaded file
    file_type = db.Column(db.String(50), nullable=True)  # 'image', 'file', etc.
    file_name = db.Column(db.String(255), nullable=True)  # Original filename
    location = db.Column(db.Text, nullable=True)  # JSON string of location data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    city_slug = db.Column(db.String(50))
    user_id = db.Column(db.String(50))
    nickname = db.Column(db.String(100))
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SavedLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='saved_locations')
    location = db.relationship('Location', backref='saved_by')

class FavoriteLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='favorite_locations')
    __table_args__ = (db.UniqueConstraint('user_id', 'title', name='uix_user_location'),)

class FriendRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_friend_requests')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_friend_requests')
    __table_args__ = (db.UniqueConstraint('sender_id', 'receiver_id', name='uix_sender_receiver'),)

# ===== ADMIN =====
admin = Admin(app, name='THEARCGO Admin')
admin.add_view(sqla.ModelView(City, db.session))
admin.add_view(sqla.ModelView(Location, db.session))
admin.add_view(sqla.ModelView(Suggestion, db.session))
admin.add_view(sqla.ModelView(SuggestionPhoto, db.session))
admin.add_view(sqla.ModelView(User, db.session))
admin.add_view(sqla.ModelView(PrivateMessage, db.session))
admin.add_view(sqla.ModelView(Message, db.session))
admin.add_view(sqla.ModelView(FavoriteLocation, db.session))
admin.add_view(sqla.ModelView(FriendRequest, db.session))

# ===== API =====
@socketio.on('join')
def on_join(data):
    user_id = data['user_id']
    join_room(str(user_id))

@socketio.on('private_message')
def handle_private_message(data):
    if not current_user.is_authenticated:
        return
    sender_id = current_user.id
    receiver_id = data['receiver_id']
    message_text = data.get('message', '')
    file_url = data.get('file_url')
    file_type = data.get('file_type')
    file_name = data.get('file_name')
    location = data.get('location')

    # Save to DB
    msg = PrivateMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message_text,
        file_url=file_url,
        file_type=file_type,
        file_name=file_name,
        location=json.dumps(location) if location else None
    )
    db.session.add(msg)
    db.session.commit()

    # Send to receiver
    emit('new_private_message', {
        'id': msg.id,
        'sender_id': sender_id,
        'receiver_id': receiver_id,
        'message': message_text,
        'file_url': file_url,
        'file_type': file_type,
        'file_name': file_name,
        'location': location,
        'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'sender_nickname': current_user.nickname
    }, room=str(receiver_id))
    
    # And to self too, to display
    emit('new_private_message', {
        'id': msg.id,
        'sender_id': sender_id,
        'receiver_id': receiver_id,
        'message': message_text,
        'file_url': file_url,
        'file_type': file_type,
        'file_name': file_name,
        'location': location,
        'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'sender_nickname': current_user.nickname
    }, room=str(sender_id))

# 🔹 ADDING A CITY FROM THE WEB
@app.route('/api/add-city', methods=['POST'])
def add_city():
    if not request.is_json:
        return jsonify({'error': 'Expected JSON'}), 400

    data = request.get_json(silent=True)
    name = data.get('name')
    slug = data.get('slug')

    if not name or not slug:
        return jsonify({'error': 'name and slug required'}), 400

    if City.query.filter_by(slug=slug).first():
        return jsonify({'error': 'city already exists'}), 400

    city = City(name=name, slug=slug)
    db.session.add(city)
    db.session.commit()

    return jsonify({'status': 'ok'})

# 🔹 SUGGESTIONS
@app.route('/api/suggest', methods=['POST'])
def suggest():
    if not request.is_json:
        return jsonify({'error': 'Expected JSON'}), 400

    data = request.get_json(silent=True)

    suggestion = Suggestion(
        type=data.get('type'),
        city=data.get('city'),
        title=data.get('title'),
        description=data.get('description'),
        user_id=data.get('user_id'),
        nickname=data.get('nickname')
    )

    db.session.add(suggestion)
    db.session.commit()

    return jsonify({'status': 'ok'})

# 🔹 CITIES
@app.route('/api/cities')
def get_cities():
    cities = City.query.all()
    return jsonify([{'name': c.name, 'slug': c.slug} for c in cities])

# 🔹 LOCATIONS
@app.route('/api/locations/<city_slug>')
def get_locations(city_slug):
    city = City.query.filter_by(slug=city_slug).first()
    if not city:
        return jsonify([])

    locations = Location.query.filter_by(city_id=city.id, approved=True).all()

    def _parse_themes(val):
        if not val:
            return ['popular']
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, str):
                return [parsed]
        except Exception:
            return [val]

    return jsonify([
        {
            'title': l.title,
            'desc': l.description or '',
            'themes': _parse_themes(l.theme),
            'photos': json.loads(l.photos or '[]')
        } for l in locations
    ])

@app.route('/api/save_location/<int:location_id>', methods=['POST'])
@login_required
def save_location(location_id):
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404

    existing = SavedLocation.query.filter_by(user_id=current_user.id, location_id=location_id).first()
    if existing:
        return jsonify({'success': True, 'saved': True, 'message': 'Already saved'})

    saved = SavedLocation(user_id=current_user.id, location_id=location_id)
    db.session.add(saved)
    db.session.commit()
    return jsonify({'success': True, 'saved': True})

@app.route('/api/unsave_location/<int:location_id>', methods=['POST'])
@login_required
def unsave_location(location_id):
    saved = SavedLocation.query.filter_by(user_id=current_user.id, location_id=location_id).first()
    if saved:
        db.session.delete(saved)
        db.session.commit()
    return jsonify({'success': True, 'saved': False})

@app.route('/api/check_saved/<int:location_id>')
@login_required
def check_saved(location_id):
    saved = SavedLocation.query.filter_by(user_id=current_user.id, location_id=location_id).first()
    return jsonify({'saved': bool(saved)})

@app.route('/api/saved_locations')
@login_required
def get_saved_locations():
    saved = SavedLocation.query.filter_by(user_id=current_user.id).all()
    locations = []
    for s in saved:
        loc = s.location
        locations.append({
            'id': loc.id,
            'title': loc.title,
            'desc': loc.description or '',
            'city': loc.city.name,
            'themes': json.loads(loc.theme or '[]'),
            'photos': json.loads(loc.photos or '[]')
        })
    return jsonify(locations)

@app.route('/api/favorite_locations', methods=['GET'])
@login_required
def get_favorite_locations():
    favorites = FavoriteLocation.query.filter_by(user_id=current_user.id).all()
    return jsonify([f.title for f in favorites])

@app.route('/api/favorite_locations', methods=['POST'])
@login_required
def add_favorite_location():
    data = request.get_json(silent=True) or {}
    title = data.get('title')
    if not title:
        return jsonify({'error': 'title required'}), 400

    existing = FavoriteLocation.query.filter_by(user_id=current_user.id, title=title).first()
    if not existing:
        fav = FavoriteLocation(user_id=current_user.id, title=title)
        db.session.add(fav)
        db.session.commit()
    return jsonify({'success': True})

@app.route('/api/favorite_locations', methods=['DELETE'])
@login_required
def delete_favorite_location():
    data = request.get_json(silent=True) or {}
    title = data.get('title')
    if not title:
        return jsonify({'error': 'title required'}), 400

    existing = FavoriteLocation.query.filter_by(user_id=current_user.id, title=title).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
    return jsonify({'success': True})

@app.route('/api/search_users')
@login_required
def search_users():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    search_term = f'%{query}%'
    users = User.query.filter(
        User.id != current_user.id,
        or_(
            User.nickname.ilike(search_term),
            User.telegram_username.ilike(search_term),
        ),
    ).limit(10).all()
    return jsonify([
        {
            'id': u.id,
            'name': u.telegram_username or u.nickname,
            'nickname': u.nickname,
        }
        for u in users
    ])

@app.route('/api/friend_request', methods=['POST'])
@login_required
def friend_request():
    data = request.get_json(silent=True) or {}
    friend_id = data.get('friend_id')
    if not friend_id:
        return jsonify({'error': 'friend_id required'}), 400

    if friend_id == current_user.id:
        return jsonify({'error': 'cannot add yourself'}), 400

    receiver = User.query.get(friend_id)
    if not receiver:
        return jsonify({'error': 'user not found'}), 404

    existing = FriendRequest.query.filter_by(
        sender_id=current_user.id,
        receiver_id=friend_id,
    ).first()
    if not existing:
        request_record = FriendRequest(
            sender_id=current_user.id,
            receiver_id=friend_id,
        )
        db.session.add(request_record)
        db.session.commit()

    return jsonify({'success': True})

@app.route('/api/chat_list')
@login_required
def get_chat_list():
    # Получить всех пользователей, с которыми есть переписка
    sent_messages = db.session.query(PrivateMessage.receiver_id).filter(PrivateMessage.sender_id == current_user.id).distinct()
    received_messages = db.session.query(PrivateMessage.sender_id).filter(PrivateMessage.receiver_id == current_user.id).distinct()

    # Объединить и получить уникальные ID пользователей
    user_ids = set()
    for msg in sent_messages:
        user_ids.add(msg[0])
    for msg in received_messages:
        user_ids.add(msg[0])

    # Получить пользователей и последнее сообщение для каждого
    chats = []
    for user_id in user_ids:
        user = User.query.get(user_id)
        if user:
            # Получить последнее сообщение
            last_message = PrivateMessage.query.filter(
                ((PrivateMessage.sender_id == current_user.id) & (PrivateMessage.receiver_id == user_id)) |
                ((PrivateMessage.sender_id == user_id) & (PrivateMessage.receiver_id == current_user.id))
            ).order_by(PrivateMessage.created_at.desc()).first()

            chats.append({
                'id': user.id,
                'nickname': user.nickname,
                'last_message': last_message.message if last_message else '',
                'last_message_time': last_message.created_at.strftime('%Y-%m-%d %H:%M:%S') if last_message else '',
                'has_file': bool(last_message and last_message.file_url) if last_message else False
            })

    # Сортировать по времени последнего сообщения
    chats.sort(key=lambda x: x['last_message_time'], reverse=True)
    return jsonify(chats)

@app.route('/api/messages/<int:user_id>')
@login_required
def get_messages(user_id):
    messages = PrivateMessage.query.filter(
        ((PrivateMessage.sender_id == current_user.id) & (PrivateMessage.receiver_id == user_id)) |
        ((PrivateMessage.sender_id == user_id) & (PrivateMessage.receiver_id == current_user.id))
    ).order_by(PrivateMessage.created_at).all()
    return jsonify([{
        'id': m.id,
        'sender_id': m.sender_id,
        'receiver_id': m.receiver_id,
        'message': m.message,
        'file_url': m.file_url,
        'file_type': m.file_type,
        'file_name': m.file_name,
        'location': json.loads(m.location) if m.location else None,
        'created_at': m.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'sender_nickname': m.sender.nickname
    } for m in messages])

@app.route('/api/suggest/photos', methods=['POST'])
def photo_suggest():
    files = request.files.getlist('photos')
    location = request.form.get('location')
    city = request.form.get('city')
    user_id = request.form.get('user_id')

    if not files or not location or not city or not user_id:
        return jsonify({'error': 'photos, location, city and user_id required'}), 400

    photos_dir = os.path.join(BASE_DIR, 'uploads', 'photos_pending')
    os.makedirs(photos_dir, exist_ok=True)

    for file in files:
        if file and file.filename:
            ext = os.path.splitext(file.filename)[1] or '.jpg'
            filename = f"{user_id}_{int(time.time())}_{uuid.uuid4().hex}{ext}"
            file.save(os.path.join(photos_dir, filename))

            photo = SuggestionPhoto(
                location_title=location,
                city=city,
                filename=filename,
                user_id=user_id,
                status='pending'
            )
            db.session.add(photo)

    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/upload_file', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Create uploads directory if it doesn't exist
        uploads_dir = os.path.join(BASE_DIR, 'uploads', 'chat_files')
        os.makedirs(uploads_dir, exist_ok=True)

        # Generate unique filename
        timestamp = int(time.time())
        filename = f"{current_user.id}_{timestamp}_{file.filename}"
        file_path = os.path.join(uploads_dir, filename)
        file.save(file_path)

        # Determine file type
        if file.content_type.startswith('image/'):
            file_type = 'image'
        else:
            file_type = 'file'

        return jsonify({
            'success': True,
            'file_url': f'/uploads/chat_files/{filename}',
            'file_type': file_type,
            'file_name': file.filename
        })

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ===== SITE =====
@app.route("/")
@login_required
def index():
    return render_template("index.html")

@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html")

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if current_user.is_authenticated:
            logout_user()

        nickname = request.form.get('nickname')
        password = request.form.get('password')
        user = User.query.filter_by(nickname=nickname).first()
        if user and user.password_hash and check_password_hash(user.password_hash, password):
            login_user(user)
            session.permanent = True
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        return render_template("login.html", error="Invalid nickname or password")
    return render_template("login.html")

@app.route("/register", methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        nickname = request.form.get('nickname')
        password = request.form.get('password')

        if not nickname or not password:
            return render_template('register.html', error='All fields are required')

        if User.query.filter_by(nickname=nickname).first():
            return render_template('register.html', error='Nickname already in use')

        password_hash = generate_password_hash(password)

        user = User(
            telegram_username=None,
            nickname=nickname,
            password_hash=password_hash,
            is_confirmed=True
        )
        db.session.add(user)
        db.session.commit()

        login_user(user)
        session.permanent = True
        return redirect(url_for('index'))

    return render_template('register.html')

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route("/delete-account", methods=["POST"])
@login_required
def delete_account():
    user_id = current_user.id
    logout_user()

    PrivateMessage.query.filter(
        (PrivateMessage.sender_id == user_id) | (PrivateMessage.receiver_id == user_id)
    ).delete(synchronize_session=False)
    User.query.filter_by(id=user_id).delete(synchronize_session=False)
    db.session.commit()
    return redirect(url_for('register'))

@app.route("/update-profile", methods=["POST"])
@login_required
def update_profile():
    data = request.get_json(silent=True) or {}
    nickname = data.get('nickname')
    avatar = data.get('avatar')

    if nickname is not None:
        nickname = nickname.strip()
        if not nickname:
            return jsonify({"success": False, "error": "Nickname cannot be empty"}), 400

        existing = User.query.filter(
            User.nickname == nickname,
            User.id != current_user.id,
        ).first()
        if existing:
            return jsonify({"success": False, "error": "Nickname already in use"}), 400

        current_user.nickname = nickname

    if avatar is not None:
        current_user.avatar = avatar

    db.session.commit()
    return jsonify({
        "success": True,
        "nickname": current_user.nickname,
        "avatar": current_user.avatar,
    })

def migrate_user_verification_schema():
    with db.engine.begin() as conn:
        if conn.engine.url.drivername.startswith('sqlite'):
            existing = {r[1] for r in conn.execute(text('PRAGMA table_info("user")')).fetchall()}
            if 'is_confirmed' not in existing:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN is_confirmed BOOLEAN DEFAULT 0'))
            if 'verification_code' not in existing:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN verification_code VARCHAR(6)'))
            if 'verification_expires' not in existing:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN verification_expires DATETIME'))
            if 'avatar' not in existing:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN avatar TEXT'))
            if 'telegram_username' not in existing:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN telegram_username VARCHAR(120)'))
            if 'telegram_id' not in existing:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN telegram_id VARCHAR(50)'))

            # Migration for PrivateMessage
            pm_existing = {r[1] for r in conn.execute(text('PRAGMA table_info("private_message")')).fetchall()}
            if 'file_url' not in pm_existing:
                conn.execute(text('ALTER TABLE "private_message" ADD COLUMN file_url VARCHAR(500)'))
            if 'file_type' not in pm_existing:
                conn.execute(text('ALTER TABLE "private_message" ADD COLUMN file_type VARCHAR(50)'))
            if 'file_name' not in pm_existing:
                conn.execute(text('ALTER TABLE "private_message" ADD COLUMN file_name VARCHAR(255)'))
            if 'location' not in pm_existing:
                conn.execute(text('ALTER TABLE "private_message" ADD COLUMN location TEXT'))


@app.route("/chats")
@login_required
def chats():
    return render_template("chats.html")

# ===== RUN =====
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  
    
    with app.app_context():
        db.create_all()
        print("[OK] Database is ready")
        
        # Add Moscow if not exists
        moscow = City.query.filter_by(slug='moscow').first()
        if not moscow:
            moscow = City(name='Москва', slug='moscow')
            db.session.add(moscow)
            db.session.commit()

        # Add Saint Petersburg if not exists
        spb = City.query.filter_by(slug='spb').first()
        if not spb:
            spb = City(name='Санкт-Петербург', slug='spb')
            db.session.add(spb)
            db.session.commit()

        # Add Novosibirsk if not exists
        novosibirsk = City.query.filter_by(slug='novosibirsk').first()
        if not novosibirsk:
            novosibirsk = City(name='Новосибирск', slug='novosibirsk')
            db.session.add(novosibirsk)
            db.session.commit()
        
        # Add Moscow locations if not exist
        locations_data = [
            {
                'title': 'Хлебзавод',
                'description': 'Креативное пространство на территории бывшего хлебозавода.',
                'theme': 'culture',
                'photos': 'hlebz1.jpg,hlebz2.jpg,hlebz3.jpg,hlebz4.jpg',
                'city_id': moscow.id
            },
            {
                'title': 'Naberezhnye',
                'description': 'Современный комплекс на набережной.',
                'theme': 'leisure',
                'photos': 'nabber1.jpg,nabber2.jpg,nabber3.jpg,nabber4.jpg,nabber5.jpg,nabber6.jpg,nabber7.png,nabber8.jpg,nabber9.jpg',
                'city_id': moscow.id
            },
            {
                'title': 'Завод Арма',
                'description': 'Адрес: Нижний Сусальный переулок, 5 (метро «Курская», «Чкаловская»)',
                'theme': 'industrial',
                'photos': 'arma1.jpg,arma2.jpg,arma3.jpg',
                'city_id': moscow.id
            },
            {
                'title': 'Humbl Cookies',
                'description': 'Уютная кофейня с выпечкой и печеньем ручной работы в Петербурге.',
                'theme': 'food',
                'photos': '',
                'city_id': spb.id
            },
            {
                'title': 'The Buddy Cafe',
                'description': 'Небольшое кафе в Петербурге с атмосферой для встреч и лёгких закусок.',
                'theme': 'food',
                'photos': '',
                'city_id': spb.id
            },
            {
                'title': 'Nobody Knows i Suppose',
                'description': 'Атмосферный бар в Новосибирске с нишевой концепцией и авторской музыкой.',
                'theme': json.dumps(['нишевые', 'бары']),
                'photos': json.dumps(['/static/photos/novosibirsk/restDv4.jpg']),
                'city_id': novosibirsk.id
            }
        ]
        
        for loc_data in locations_data:
            location = Location.query.filter_by(title=loc_data['title'], city_id=loc_data['city_id']).first()
            if not location:
                location = Location(
                    title=loc_data['title'],
                    description=loc_data['description'],
                    city_id=loc_data['city_id'],
                    theme=loc_data['theme'],
                    photos=loc_data['photos'],
                    approved=True
                )
                db.session.add(location)
        db.session.commit()
        
        print("Cities:", City.query.count())
        migrate_user_verification_schema() 

    print(f"[SERVER] http://0.0.0.0:{port}/")
    print(f"[ADMIN] http://0.0.0.0:{port}/admin/")

    socketio.run(app, host="0.0.0.0", port=port, debug=True)
