#!/usr/bin/env python3
"""
Flask server for SQLite-based loyalty rewards with authentication
"""
import sqlite3
import bcrypt
import secrets
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # For session management
CORS(app, supports_credentials=True)

DB_PATH = 'rewards.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema"""
    conn = get_db()
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("✅ Database initialized")

# ============================================
# Authentication Routes
# ============================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Company login endpoint"""
    data = request.json
    login_email = data.get('company', '').strip().lower()
    password = data.get('password', '')

    if not login_email or not password:
        return jsonify({'error': 'Company login and password required'}), 400

    conn = get_db()
    
    # Find company by login_email (case-insensitive)
    company = conn.execute(
        'SELECT * FROM companies WHERE LOWER(login_email) = ?',
        (login_email,)
    ).fetchone()
    
    conn.close()

    if not company:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Verify password
    stored_hash = company['password_hash'].encode('utf-8')
    if not bcrypt.checkpw(password.encode('utf-8'), stored_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Create session
    session['company_id'] = company['id']
    session['company_name'] = company['name']
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=7)

    return jsonify({
        'success': True,
        'company': {
            'id': company['id'],
            'name': company['name'],
            'description': company['description']
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/session', methods=['GET'])
def get_session():
    """Get current session"""
    if 'company_id' not in session:
        return jsonify({'authenticated': False}), 401
    
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
    
    # Total users with rewards at this company
    total_users = conn.execute(
        'SELECT COUNT(DISTINCT user_id) as count FROM rewards WHERE company_id = ?',
        (company_id,)
    ).fetchone()['count']
    
    # Total scans (sum of all scores)
    total_scans = conn.execute(
        'SELECT COALESCE(SUM(score), 0) as total FROM rewards WHERE company_id = ?',
        (company_id,)
    ).fetchone()['total']
    
    # Users close to reward (score >= 8)
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

@app.route('/api/rewards/scan', methods=['POST'])
def add_scan():
    """Add a scan (increment score)"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    data = request.json
    user_id = data.get('user_id')
    company_id = session['company_id']
    
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    conn = get_db()
    
    # Check if reward exists
    existing = conn.execute(
        'SELECT id, score, target_score FROM rewards WHERE user_id = ? AND company_id = ?',
        (user_id, company_id)
    ).fetchone()
    
    if existing:
        # Increment score
        new_score = existing['score'] + 1
        conn.execute(
            'UPDATE rewards SET score = ?, last_scan_at = ?, updated_at = ? WHERE id = ?',
            (new_score, datetime.now().isoformat(), datetime.now().isoformat(), existing['id'])
        )
        reward_earned = new_score >= existing['target_score']
    else:
        # Create new reward
        conn.execute(
            'INSERT INTO rewards (user_id, company_id, score, last_scan_at) VALUES (?, ?, 1, ?)',
            (user_id, company_id, datetime.now().isoformat())
        )
        reward_earned = False
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'reward_earned': reward_earned})

@app.route('/api/rewards/reset', methods=['POST'])
def reset_reward():
    """Reset a user's reward score (after redemption)"""
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    data = request.json
    user_id = data.get('user_id')
    company_id = session['company_id']
    
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    conn = get_db()
    conn.execute(
        'UPDATE rewards SET score = 0, updated_at = ? WHERE user_id = ? AND company_id = ?',
        (datetime.now().isoformat(), user_id, company_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ============================================
# Static file serving
# ============================================

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# ============================================
# Main
# ============================================

if __name__ == '__main__':
    import os
    
    # Initialize DB if it doesn't exist
    if not os.path.exists(DB_PATH):
        print("📦 Creating database...")
        init_db()
    
    print("🚀 Starting server on http://localhost:5000")
    print("📊 Login page: http://localhost:5000/")
    print("🔐 Default credentials:")
    print("   - Company: coffee (or 'Coffee Shop')")
    print("   - Password: password")
    app.run(debug=True, port=5000)
