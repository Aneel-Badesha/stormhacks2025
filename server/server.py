#!/usr/bin/env python3
"""
Flask server for SQLite-based loyalty rewards with authentication (email-only)
"""
import os
import sqlite3
import bcrypt
import secrets
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS

# ----------------------------------
# App & session cookie configuration
# ----------------------------------
app = Flask(__name__)
app.secret_key = secrets.token_hex(32) #stable = persistant sessions 

# Same-origin local dev over HTTP:
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",  # good for same-origin calls
    SESSION_COOKIE_SECURE=False,# true for HTTPS
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)

# CORS (only needed if you ever call /api from a different origin)
CORS(app, supports_credentials=True, resources={
    r"/api/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5000"]}
})

DB_PATH = 'data/rewards.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema"""
    conn = get_db()
    with open('data/schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("✅ Database initialized")

# Mobile Auth

@app.route('/api/mobile/auth/register', methods=['POST'])
def mobile_register():
    """Register a new user"""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    full_name = (data.get('full_name') or '').strip()
    
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    conn = get_db()
    
    # Check if user already exists
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'User already exists', 'user_id': existing['id']}), 409
    
    # Create new user
    cursor = conn.execute(
        'INSERT INTO users (email, phone, full_name) VALUES (?, ?, ?)',
        (email, phone, full_name)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'user_id': user_id,
        'email': email,
        'full_name': full_name
    }), 201

# 
@app.route('/api/mobile/auth/login', methods=['POST'])
def mobile_login():
    """Login existing user (simple email-based)"""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    conn = get_db()
    user = conn.execute(
        'SELECT id, email, phone, full_name FROM users WHERE email = ?',
        (email,)
    ).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'user_id': user['id'],
        'email': user['email'],
        'phone': user['phone'],
        'full_name': user['full_name']
    })

@app.route('/api/mobile/companies', methods=['GET'])
def mobile_companies():
    """Get all active companies"""
    conn = get_db()
    companies = conn.execute(
        'SELECT id, name, description FROM companies WHERE is_active = 1'
    ).fetchall()
    conn.close()
    
    return jsonify([{
        'id': c['id'],
        'name': c['name'],
        'description': c['description'] or ''
    } for c in companies])

@app.route('/api/mobile/scan', methods=['POST'])
def mobile_scan():
    """
    PRIMARY NFC SCAN ENDPOINT
    Called when user scans NFC tag at a business
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    company_id = data.get('company_id')
    
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    if not company_id:
        return jsonify({'error': 'company_id required'}), 400
    
    conn = get_db()
    
    # Verify user exists
    user = conn.execute('SELECT id FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Verify company exists and is active
    company = conn.execute(
        'SELECT id, name FROM companies WHERE id = ? AND is_active = 1',
        (company_id,)
    ).fetchone()
    if not company:
        conn.close()
        return jsonify({'error': 'Company not found or inactive'}), 404
    
    # Get current reward status
    existing = conn.execute(
        'SELECT id, score, target_score FROM rewards WHERE user_id = ? AND company_id = ?',
        (user_id, company_id)
    ).fetchone()
    
    now_iso = datetime.now().isoformat()
    
    if existing:
        previous_score = int(existing['score'] or 0)
        target_score = int(existing['target_score'] or 10)
        new_score = previous_score + 1
        
        conn.execute(
            'UPDATE rewards SET score = ?, last_scan_at = ?, updated_at = ? WHERE id = ?',
            (new_score, now_iso, now_iso, existing['id'])
        )
    else:
        previous_score = 0
        new_score = 1
        target_score = 10
        
        conn.execute(
            'INSERT INTO rewards (user_id, company_id, score, target_score, last_scan_at) '
            'VALUES (?, ?, ?, ?, ?)',
            (user_id, company_id, new_score, target_score, now_iso)
        )
    
    conn.commit()
    conn.close()
    
    reward_earned = new_score >= target_score
    progress_percentage = int((new_score / target_score) * 100)
    scans_until_reward = max(0, target_score - new_score)
    
    response = {
        'success': True,
        'user_id': user_id,
        'company_id': company_id,
        'company_name': company['name'],
        'previous_score': previous_score,
        'new_score': new_score,
        'target_score': target_score,
        'reward_earned': reward_earned,
        'progress_percentage': progress_percentage,
        'scans_until_reward': scans_until_reward
    }
    
    if reward_earned:
        response['reward_message'] = f"🎉 Congratulations! You earned a reward at {company['name']}!"
    
    return jsonify(response)

@app.route('/api/mobile/rewards/<int:user_id>', methods=['GET'])
def mobile_user_rewards(user_id):
    """Get all rewards for a user"""
    conn = get_db()
    
    rewards = conn.execute('''
        SELECT 
            r.company_id,
            c.name as company_name,
            r.score,
            r.target_score,
            r.last_scan_at,
            r.created_at
        FROM rewards r
        JOIN companies c ON r.company_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.last_scan_at DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        'user_id': user_id,
        'rewards': [{
            'company_id': r['company_id'],
            'company_name': r['company_name'],
            'score': r['score'],
            'target_score': r['target_score'],
            'progress_percentage': int((r['score'] / r['target_score']) * 100),
            'reward_earned': r['score'] >= r['target_score'],
            'last_scan_at': r['last_scan_at']
        } for r in rewards]
    })

# REMOVED: /api/programs - duplicate of /api/mobile/companies (use that instead)

# ============================================
# Authentication Routes (email-only)
# ============================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Company login via EMAIL ONLY (bcrypt)"""
    data = request.get_json(silent=True) or {}
    raw_email = (data.get('email') or '').strip()
    email = " ".join(raw_email.split()).lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    import os
    print("LOGIN hitting DB:", os.path.abspath(DB_PATH))
    print("LOGIN attempt email:", repr(email))

    conn = get_db()
    conn.row_factory = sqlite3.Row
    company = conn.execute(
        'SELECT id, name, description, login_email, password_hash '
        'FROM companies WHERE login_email = ? COLLATE NOCASE',
        (email,)
    ).fetchone()
    conn.close()

    # SAFE debug print
    if company:
        ph = company['password_hash']
        d = dict(company)
        d['password_hash'] = (ph[:10] + '…') if isinstance(ph, str) else '<non-str>'
        print("LOGIN found:", d)
    else:
        print("LOGIN no row found for:", repr(email))

    if not company:
        return jsonify({'error': 'Invalid email or password'}), 401

    try:
        ok = bcrypt.checkpw(password.encode('utf-8'),
                            company['password_hash'].encode('utf-8'))
    except Exception as e:
        print("bcrypt error:", e)
        return jsonify({'error': 'Server password check error'}), 500

    if not ok:
        return jsonify({'error': 'Invalid email or password'}), 401

    session.clear()
    session['company_id'] = company['id']
    session['company_name'] = company['name']
    session.permanent = True

    print("LOGIN OK → session:", dict(session))
    return jsonify({
        'success': True,
        'company': {
            'id': company['id'],
            'name': company['name'],
            'description': company['description'],
        }
    })



@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Log out the current company and redirect to login"""
    session.clear()
    return jsonify({'success': True, 'redirect': '/index.html'})

@app.route('/api/auth/session', methods=['GET'])
def get_session():
    """Get current session (return 200 even if not authenticated for nicer UX)"""
    if 'company_id' not in session:
        return jsonify({'authenticated': False}), 200
    return jsonify({
        'authenticated': True,
        'company': {
            'id': session['company_id'],
            'name': session['company_name']
        }
    })

# ============================================
# Protected API Routes (require authentication)
# ============================================

def require_auth():
    """Check if user is authenticated"""
    if 'company_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    return None

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get stats for logged-in company"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    company_id = session['company_id']
    conn = get_db()
    
    total_users = conn.execute(
        'SELECT COUNT(DISTINCT user_id) as count FROM rewards WHERE company_id = ?',
        (company_id,)
    ).fetchone()['count']
    
    total_scans = conn.execute(
        'SELECT COALESCE(SUM(score), 0) as total FROM rewards WHERE company_id = ?',
        (company_id,)
    ).fetchone()['total']
    
    close_to_reward = conn.execute(
        'SELECT COUNT(*) as count FROM rewards WHERE company_id = ? AND score >= target_score * 0.8',
        (company_id,)
    ).fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'total_users': total_users,
        'total_scans': total_scans,
        'close_to_reward': close_to_reward
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users with rewards at logged-in company"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    company_id = session['company_id']
    conn = get_db()
    
    query = '''
        SELECT 
            u.id,
            u.email,
            u.phone,
            u.full_name,
            r.score,
            r.target_score,
            r.last_scan_at,
            r.created_at
        FROM rewards r
        JOIN users u ON r.user_id = u.id
        WHERE r.company_id = ?
        ORDER BY r.score DESC, r.last_scan_at DESC
    '''
    
    users = conn.execute(query, (company_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(u) for u in users])

# REMOVED: Duplicate of /api/rewards/increment - use that instead for admin scans

@app.route('/api/rewards/reset', methods=['POST'])
def reset_reward():
    """After redemption: subtract target_score from score (never below 0)"""
    auth_error = require_auth()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    company_id = session.get('company_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    now = datetime.now().isoformat()
    conn = get_db()
    conn.row_factory = sqlite3.Row

    # Fetch current score and target
    row = conn.execute(
        'SELECT id, score, target_score FROM rewards WHERE user_id=? AND company_id=?',
        (user_id, company_id)
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'reward not found for user/company'}), 404

    # Normalize types defensively
    try:
        score = int(row['score'] or 0)
    except Exception:
        print("CANNOT READ SCORE")
        score = 0
    try:
        target = int(row['target_score'] or 0)
    except Exception:
        print("CANNOT READ TARGET SCORE")
        target = 0

    # Fallback if target is missing/invalid
    # print(target)
    if target <= 0:
        target = 10  # sane default
    # print(target)

    new_score = max(score - target, 0)

    # Update
    conn.execute(
        'UPDATE rewards SET score=?, updated_at=? WHERE id=?',
        (new_score, now, row['id'])
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'score': new_score, 'target_score': target})

@app.route('/api/rewards/increment', methods=['POST'])
def increment_reward():
    """
    Increment a user's reward score by `amount` (default 1).
    Creates the rewards row if it doesn't exist for this company.
    Body: { "user_id": <int>, "amount": <int, optional, default 1> }
    """
    auth_error = require_auth()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    try:
        amount = int(data.get('amount', 1))
    except Exception:
        amount = 1

    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    if amount == 0:
        return jsonify({'error': 'amount must be non-zero'}), 400

    company_id = session['company_id']
    now_iso = datetime.now().isoformat()

    conn = get_db()
    conn.row_factory = sqlite3.Row

    # Ensure user exists (optional; remove if you allow free-form user_id)
    user_row = conn.execute('SELECT id FROM users WHERE id=?', (user_id,)).fetchone()
    if not user_row:
        conn.close()
        return jsonify({'error': 'user not found'}), 404

    # Read current values (if any) for return payload
    before = conn.execute(
        'SELECT id, score, target_score FROM rewards WHERE user_id=? AND company_id=?',
        (user_id, company_id)
    ).fetchone()
    prev_score = int(before['score']) if before else 0
    target = int(before['target_score']) if (before and before['target_score'] is not None) else 10

    # Upsert + increment
    # If the row doesn't exist, insert with score=<amount>; otherwise add <amount>
    conn.execute(
        '''
        INSERT INTO rewards (user_id, company_id, score, target_score, last_scan_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, company_id) DO UPDATE SET
            score = score + excluded.score,
            last_scan_at = excluded.last_scan_at,
            updated_at = excluded.updated_at
        ''',
        (user_id, company_id, amount, target, now_iso, now_iso)
    )

    # Fetch updated values
    after = conn.execute(
        'SELECT score, target_score FROM rewards WHERE user_id=? AND company_id=?',
        (user_id, company_id)
    ).fetchone()
    conn.commit()
    conn.close()

    new_score = int(after['score'])
    target = int(after['target_score'] or 10)
    reward_earned = new_score >= target

    return jsonify({
        'success': True,
        'user_id': user_id,
        'company_id': company_id,
        'amount': amount,
        'previous_score': prev_score,
        'new_score': new_score,
        'target_score': target,
        'reward_earned': reward_earned
    })

# ============================================
# Static file serving
# ============================================

@app.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

@app.route('/dashboard.html')
def serve_dashboard():
    return send_from_directory('templates', 'dashboard.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# ============================================
# Main
# ============================================

if __name__ == '__main__':
    # Initialize DB if it doesn't exist
    if not os.path.exists(DB_PATH):
        init_db()
    print("Starting app")
    app.run(debug=True, host="127.0.0.1", port=5000)
