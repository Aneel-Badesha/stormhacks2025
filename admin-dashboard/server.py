#!/usr/bin/env python3
"""
Simple Flask server for SQLite-based loyalty rewards POC
"""
import sqlite3
import json
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = 'rewards.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dicts
    return conn

def init_db():
    """Initialize database with schema"""
    conn = get_db()
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("Database initialized")

# ============================================
# API Routes
# ============================================

@app.route('/')
def index():
    """Serve index.html"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files"""
    return send_from_directory('.', path)

@app.route('/api/companies', methods=['GET'])
def get_companies():
    """Get all companies"""
    conn = get_db()
    companies = conn.execute('SELECT * FROM companies ORDER BY name').fetchall()
    conn.close()
    return jsonify([dict(c) for c in companies])

@app.route('/api/companies/<int:company_id>/stats', methods=['GET'])
def get_company_stats(company_id):
    """Get stats for a specific company"""
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
        'SELECT COUNT(*) as count FROM rewards WHERE company_id = ? AND score >= 8',
        (company_id,)
    ).fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'total_users': total_users,
        'total_scans': total_scans,
        'close_to_reward': close_to_reward
    })

@app.route('/api/companies/<int:company_id>/users', methods=['GET'])
def get_company_users(company_id):
    """Get all users with rewards at this company"""
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

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    conn = get_db()
    users = conn.execute('SELECT * FROM users ORDER BY full_name').fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/users/<int:user_id>/rewards', methods=['GET'])
def get_user_rewards(user_id):
    """Get all rewards for a specific user"""
    conn = get_db()
    
    query = '''
        SELECT 
            r.*,
            c.name as company_name,
            c.description as company_description
        FROM rewards r
        JOIN companies c ON r.company_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.score DESC
    '''
    
    rewards = conn.execute(query, (user_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(r) for r in rewards])

@app.route('/api/rewards', methods=['POST'])
def add_scan():
    """Add a scan (increment score)"""
    data = request.json
    user_id = data.get('user_id')
    company_id = data.get('company_id')
    
    if not user_id or not company_id:
        return jsonify({'error': 'user_id and company_id required'}), 400
    
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
    data = request.json
    user_id = data.get('user_id')
    company_id = data.get('company_id')
    
    if not user_id or not company_id:
        return jsonify({'error': 'user_id and company_id required'}), 400
    
    conn = get_db()
    conn.execute(
        'UPDATE rewards SET score = 0, updated_at = ? WHERE user_id = ? AND company_id = ?',
        (datetime.now().isoformat(), user_id, company_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ============================================
# Main
# ============================================

if __name__ == '__main__':
    import os
    
    # Initialize DB if it doesn't exist
    if not os.path.exists(DB_PATH):
        print("Creating database...")
        init_db()
    
    print("Starting server on http://localhost:5000")
    print("Admin dashboard: http://localhost:5000/")
    app.run(debug=True, port=5000)
