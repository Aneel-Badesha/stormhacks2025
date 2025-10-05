#!/usr/bin/env python3
"""
Flask server for SQLite-based loyalty rewards with authentication (email-only)
"""
import os
import sqlite3
import bcrypt
import secrets
import random
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

# CORS configuration for mobile app and web admin
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5000",
            "http://localhost:5001",
            "http://127.0.0.1:5000",
            "http://localhost:8081",  # Expo dev server default port
            "http://localhost:19000", # Expo dev server alternative port
            "http://localhost:19006", # Expo web
            "exp://localhost:8081",   # Expo mobile app
            "exp://localhost:19000",  # Expo mobile app alternative
            "*"  # Allow all origins for development (remove in production)
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
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

# Mobile Auth - Works with Supabase
# Users authenticate via Supabase, then we link them by email in our DB

@app.route('/api/mobile/auth/sync-user', methods=['POST'])
def sync_user():
    """Sync/create user from Supabase auth in our local DB"""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    full_name = (data.get('full_name') or '').strip()
    
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    conn = get_db()
    
    try:
        # Check if user already exists
        existing = conn.execute('SELECT id, email, phone, full_name FROM users WHERE email = ?', (email,)).fetchone()
        
        if existing:
            # User exists, just return their info
            user_id = existing['id']
            user_data = {
                'id': existing['id'],
                'email': existing['email'],
                'phone': existing['phone'],
                'full_name': existing['full_name']
            }
        else:
            # Create new user
            cursor = conn.execute(
                'INSERT INTO users (email, phone, full_name) VALUES (?, ?, ?)',
                (email, phone, full_name)
            )
            user_id = cursor.lastrowid
            conn.commit()
            user_data = {
                'id': user_id,
                'email': email,
                'phone': phone,
                'full_name': full_name
            }
    except sqlite3.IntegrityError:
        # Race condition: user was created between check and insert
        # Just fetch the existing user
        existing = conn.execute('SELECT id, email, phone, full_name FROM users WHERE email = ?', (email,)).fetchone()
        user_id = existing['id']
        user_data = {
            'id': existing['id'],
            'email': existing['email'],
            'phone': existing['phone'],
            'full_name': existing['full_name']
        }
    finally:
        conn.close()
    
    # Set session
    session.clear()
    session['user_id'] = user_id
    session['user_email'] = email
    session.permanent = True
    
    return jsonify({
        'success': True,
        'user': user_data
    })
def mobile_register():
    """Register a new user"""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    phone = (data.get('phone') or '').strip()
    full_name = (data.get('full_name') or '').strip()
    
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    conn = get_db()
    
    # Check if user already exists
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'User already exists'}), 409
    
    # Hash the password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create new user
    cursor = conn.execute(
        'INSERT INTO users (email, phone, full_name, password_hash) VALUES (?, ?, ?, ?)',
        (email, phone, full_name, password_hash)
    )
    user_id = cursor.lastrowid
    conn.commit()
    
    # Get the created user
    user = conn.execute(
        'SELECT id, email, phone, full_name FROM users WHERE id = ?',
        (user_id,)
    ).fetchone()
    conn.close()
    
    # Set session
    session.clear()
    session['user_id'] = user_id
    session['user_email'] = email
    session.permanent = True
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'phone': user['phone'],
            'full_name': user['full_name']
        }
    }), 201

# 
@app.route('/api/mobile/auth/login', methods=['POST'])
def mobile_login():
    """Login existing user with email and password"""
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    if not password:
        return jsonify({'error': 'Password required'}), 400
    
    conn = get_db()
    user = conn.execute(
        'SELECT id, email, phone, full_name, password_hash FROM users WHERE email = ?',
        (email,)
    ).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check password
    if not user['password_hash']:
        return jsonify({'error': 'Please register with a password'}), 401
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Set mobile session
    session.clear()
    session['user_id'] = user['id']
    session['user_email'] = user['email']
    session.permanent = True
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'phone': user['phone'],
            'full_name': user['full_name']
        }
    })

@app.route('/api/mobile/auth/logout', methods=['POST'])
def mobile_logout():
    """Logout mobile user"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/mobile/auth/session', methods=['GET'])
def mobile_get_session():
    """Get current mobile session"""
    if 'user_id' not in session:
        return jsonify({'authenticated': False})
    
    conn = get_db()
    user = conn.execute(
        'SELECT id, email, phone, full_name FROM users WHERE id = ?',
        (session['user_id'],)
    ).fetchone()
    conn.close()
    
    if not user:
        session.clear()
        return jsonify({'authenticated': False})
    
    return jsonify({
        'authenticated': True,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'phone': user['phone'],
            'full_name': user['full_name']
        }
    })

@app.route('/api/mobile/user/cards', methods=['GET'])
def mobile_user_cards():
    """Get current user's loyalty cards"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    conn = get_db()
    cards = conn.execute('''
        SELECT 
            r.id,
            r.score,
            r.target_score,
            r.visits,
            r.rewards_earned,
            r.total_saved,
            r.cash_per_redeem,
            r.card_number,
            r.last_scan_at,
            r.created_at,
            c.id as company_id,
            c.name as company_name,
            c.description as company_description,
            c.program_description,
            c.category,
            c.color
        FROM rewards r
        JOIN companies c ON r.company_id = c.id
        WHERE r.user_id = ? AND c.is_active = 1
        ORDER BY r.updated_at DESC
    ''', (user_id,)).fetchall()
    conn.close()
    
    cards_data = []
    for card in cards:
        # Format memberSince from created_at
        member_since = ''
        if card['created_at']:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(card['created_at'].replace('Z', '+00:00'))
                member_since = dt.strftime('%b %Y')
            except:
                member_since = card['created_at'][:7]  # fallback to YYYY-MM
        
        cards_data.append({
            'id': card['id'],
            'name': card['company_name'],
            'punches': card['score'],  # score == punches
            'maxPunches': card['target_score'],  # target_score == maxPunches
            'color': card['color'] or '#6366F1',
            'visits': card['visits'] or 0,
            'rewards': card['rewards_earned'] or 0,
            'saved': f"${card['total_saved']:.0f}" if card['total_saved'] else '$0',
            'cash_per_redeem': card['cash_per_redeem'] or 5.0,
            'memberSince': member_since,
            'cardId': card['card_number'] or '',
            'category': card['category'] or '',
            'progress': (card['score'] / card['target_score']) * 100 if card['target_score'] > 0 else 0,
            'last_scan_at': card['last_scan_at'],
            'created_at': card['created_at'],
            'company': {
                'id': card['company_id'],
                'name': card['company_name'],
                'description': card['company_description'],
                'programDescription': card['program_description'],
                'category': card['category'],
                'color': card['color']
            }
        })
    
    return jsonify({'cards': cards_data})

@app.route('/api/mobile/user/cards/<int:card_id>', methods=['GET'])
def mobile_user_card_by_id(card_id):
    """Get a specific user's loyalty card by card ID"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    conn = get_db()
    card = conn.execute('''
        SELECT 
            r.id,
            r.score,
            r.target_score,
            r.visits,
            r.rewards_earned,
            r.total_saved,
            r.cash_per_redeem,
            r.card_number,
            r.last_scan_at,
            r.created_at,
            c.id as company_id,
            c.name as company_name,
            c.description as company_description,
            c.program_description,
            c.category,
            c.color
        FROM rewards r
        JOIN companies c ON r.company_id = c.id
        WHERE r.id = ? AND r.user_id = ? AND c.is_active = 1
    ''', (card_id, user_id)).fetchone()
    conn.close()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    # Format memberSince from created_at
    member_since = ''
    if card['created_at']:
        try:
            dt = datetime.fromisoformat(card['created_at'].replace('Z', '+00:00'))
            member_since = dt.strftime('%b %Y')
        except:
            member_since = card['created_at'][:7]
    
    card_data = {
        'id': card['id'],
        'name': card['company_name'],
        'punches': card['score'],
        'maxPunches': card['target_score'],
        'color': card['color'] or '#6366F1',
        'visits': card['visits'] or 0,
        'rewards': card['rewards_earned'] or 0,
        'saved': f"${card['total_saved']:.0f}" if card['total_saved'] else '$0',
        'cash_per_redeem': card['cash_per_redeem'] or 5.0,
        'memberSince': member_since,
        'cardId': card['card_number'] or '',
        'category': card['category'] or '',
        'progress': (card['score'] / card['target_score']) * 100 if card['target_score'] > 0 else 0,
        'last_scan_at': card['last_scan_at'],
        'created_at': card['created_at'],
        'company': {
            'id': card['company_id'],
            'name': card['company_name'],
            'description': card['company_description'],
            'programDescription': card['program_description'],
            'category': card['category'],
            'color': card['color']
        }
    }
    
    return jsonify({'card': card_data})

@app.route('/api/mobile/user/cards/<int:card_id>', methods=['PUT'])
def update_user_card(card_id):
    """Update a specific user's loyalty card score"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    score_increment = data.get('score_increment', 0)
    
    if not isinstance(score_increment, (int, float)):
        return jsonify({'error': 'score_increment must be a number'}), 400
    
    conn = get_db()
    
    # Verify card exists and belongs to user
    card = conn.execute('''
        SELECT r.id, r.score, r.target_score, r.company_id
        FROM rewards r
        JOIN companies c ON r.company_id = c.id
        WHERE r.id = ? AND r.user_id = ? AND c.is_active = 1
    ''', (card_id, user_id)).fetchone()
    
    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    
    # Update score
    new_score = card['score'] + score_increment
    now_iso = datetime.now().isoformat()
    
    conn.execute('''
        UPDATE rewards 
        SET score = ?, updated_at = ?
        WHERE id = ?
    ''', (new_score, now_iso, card_id))
    conn.commit()
    
    # Fetch updated card
    updated_card = conn.execute('''
        SELECT 
            r.id,
            r.score,
            r.target_score,
            r.visits,
            r.rewards_earned,
            r.total_saved,
            r.cash_per_redeem,
            r.card_number,
            r.last_scan_at,
            r.created_at,
            c.id as company_id,
            c.name as company_name,
            c.description as company_description,
            c.program_description,
            c.category,
            c.color
        FROM rewards r
        JOIN companies c ON r.company_id = c.id
        WHERE r.id = ?
    ''', (card_id,)).fetchone()
    conn.close()
    
    # Format memberSince from created_at
    member_since = ''
    if updated_card['created_at']:
        try:
            dt = datetime.fromisoformat(updated_card['created_at'].replace('Z', '+00:00'))
            member_since = dt.strftime('%b %Y')
        except:
            member_since = updated_card['created_at'][:7]
    
    card_data = {
        'id': updated_card['id'],
        'name': updated_card['company_name'],
        'punches': updated_card['score'],
        'maxPunches': updated_card['target_score'],
        'color': updated_card['color'] or '#6366F1',
        'visits': updated_card['visits'] or 0,
        'rewards': updated_card['rewards_earned'] or 0,
        'saved': f"${updated_card['total_saved']:.0f}" if updated_card['total_saved'] else '$0',
        'cash_per_redeem': updated_card['cash_per_redeem'] or 5.0,
        'memberSince': member_since,
        'cardId': updated_card['card_number'] or '',
        'category': updated_card['category'] or '',
        'progress': (updated_card['score'] / updated_card['target_score']) * 100 if updated_card['target_score'] > 0 else 0,
        'last_scan_at': updated_card['last_scan_at'],
        'created_at': updated_card['created_at'],
        'company': {
            'id': updated_card['company_id'],
            'name': updated_card['company_name'],
            'description': updated_card['company_description'],
            'programDescription': updated_card['program_description'],
            'category': updated_card['category'],
            'color': updated_card['color']
        }
    }
    
    return jsonify({'card': card_data, 'message': f'Score updated by {score_increment}'})

@app.route('/api/mobile/user/cards', methods=['POST'])
def create_user_card():
    """Create a new loyalty card for the user (join a program)"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    company_id = data.get('company_id')
    
    if not company_id:
        return jsonify({'error': 'company_id required'}), 400
    
    conn = get_db()
    
    # Verify company exists and is active
    company = conn.execute('''
        SELECT id, name, default_target_score, color, category, description, program_description
        FROM companies 
        WHERE id = ? AND is_active = 1
    ''', (company_id,)).fetchone()
    
    if not company:
        conn.close()
        return jsonify({'error': 'Company not found or inactive'}), 404
    
    # Check if user already has a card for this company
    existing = conn.execute('''
        SELECT id FROM rewards 
        WHERE user_id = ? AND company_id = ?
    ''', (user_id, company_id)).fetchone()
    
    if existing:
        conn.close()
        return jsonify({'error': 'Card already exists'}), 409
    
    # Create new card
    now_iso = datetime.now().isoformat()
    target_score = company['default_target_score'] or 10
    card_number = f"****{random.randint(1000, 9999)}"
    
    cursor = conn.execute('''
        INSERT INTO rewards (
            user_id, company_id, score, target_score, 
            visits, rewards_earned, total_saved, cash_per_redeem,
            card_number, last_scan_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id, company_id, 0, target_score,
        0, 0, 0.0, 5.0,
        card_number, now_iso
    ))
    card_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Format response
    member_since = datetime.now().strftime('%b %Y')
    
    card_data = {
        'id': card_id,
        'name': company['name'],
        'punches': 0,
        'maxPunches': target_score,
        'color': company['color'] or '#6366F1',
        'visits': 0,
        'rewards': 0,
        'saved': '$0',
        'cash_per_redeem': 5.0,
        'memberSince': member_since,
        'cardId': card_number,
        'category': company['category'] or '',
        'progress': 0,
        'company': {
            'id': company['id'],
            'name': company['name'],
            'description': company['description'],
            'programDescription': company['program_description'],
            'category': company['category'],
            'color': company['color']
        }
    }
    
    return jsonify({'card': card_data, 'message': 'Card added successfully'}), 201

@app.route('/api/mobile/user/cards/<int:card_id>', methods=['DELETE'])
def delete_user_card(card_id):
    """Delete a user's loyalty card"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    conn = get_db()
    
    # Verify card exists and belongs to user
    card = conn.execute('''
        SELECT id FROM rewards 
        WHERE id = ? AND user_id = ?
    ''', (card_id, user_id)).fetchone()
    
    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    
    # Delete the card
    conn.execute('DELETE FROM rewards WHERE id = ?', (card_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Card deleted successfully'})

@app.route('/api/mobile/companies', methods=['GET'])
def mobile_companies():
    """Get all active companies"""
    conn = get_db()
    companies = conn.execute(
        'SELECT id, name, description, program_description, category, color, default_target_score FROM companies WHERE is_active = 1'
    ).fetchall()
    conn.close()
    
    companies_data = [{
        'id': str(c['id']),  # Convert to string for consistency with frontend
        'name': c['name'],
        'category': c['category'] or '',
        'color': c['color'] or '#6366F1',
        'maxPunches': c['default_target_score'] or 10,
        'companyDescription': c['description'] or '',
        'programDescription': c['program_description'] or ''
    } for c in companies]
    
    return jsonify({'companies': companies_data})

# Alias for programs (same as companies)
@app.route('/api/mobile/programs', methods=['GET'])
def mobile_programs():
    """Alias for mobile_companies - programs and companies are the same thing"""
    return mobile_companies()

@app.route('/api/mobile/scan', methods=['POST'])
def mobile_scan():
    """
    PRIMARY NFC SCAN ENDPOINT
    Called when user scans NFC tag at a business
    """
    data = request.get_json(silent=True) or {}
    print(f"DEBUG: Scan request data: {data}")
    print(f"DEBUG: Current session: {dict(session)}")
    
    user_id = data.get('user_id')
    company_id = data.get('company_id')
    
    # If company_id is not provided, try to get it from session (for admin dashboard)
    if not company_id and 'company_id' in session:
        company_id = session['company_id']
        print(f"DEBUG: Using company_id from session: {company_id}")
    
    print(f"DEBUG: user_id={user_id}, company_id={company_id}")
    
    if not user_id:
        print("DEBUG: Missing user_id")
        return jsonify({'error': 'user_id required'}), 400
    if not company_id:
        print("DEBUG: Missing company_id")
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
        
        # Check if already at max - don't increment past target
        if previous_score >= target_score:
            conn.close()
            return jsonify({
                'error': 'Card is full',
                'message': f'Your card is already at maximum ({target_score}/{target_score}). Please redeem your reward first.',
                'current_score': previous_score,
                'target_score': target_score
            }), 400
        
        new_score = min(previous_score + 1, target_score)  # Cap at target_score
        
        # Also increment visits counter
        conn.execute(
            'UPDATE rewards SET score = ?, visits = visits + 1, last_scan_at = ?, updated_at = ? WHERE id = ?',
            (new_score, now_iso, now_iso, existing['id'])
        )
    else:
        previous_score = 0
        new_score = 1
        target_score = 10
        
        conn.execute(
            'INSERT INTO rewards (user_id, company_id, score, target_score, visits, last_scan_at) '
            'VALUES (?, ?, ?, ?, ?, ?)',
            (user_id, company_id, new_score, target_score, 1, now_iso)
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

@app.route('/api/mobile/redeem', methods=['POST'])
def mobile_redeem():
    """Redeem a reward - resets score to 0 and increments rewards_earned"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    card_id = data.get('card_id')
    
    if not card_id:
        return jsonify({'error': 'card_id required'}), 400
    
    conn = get_db()
    
    # Get the reward card
    card = conn.execute(
        'SELECT id, user_id, score, target_score, cash_per_redeem, rewards_earned, total_saved FROM rewards WHERE id = ?',
        (card_id,)
    ).fetchone()
    
    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    
    # Verify ownership
    if card['user_id'] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if card is full
    if card['score'] < card['target_score']:
        conn.close()
        return jsonify({'error': 'Card not full', 'message': 'You need to complete your punch card before redeeming'}), 400
    
    # Reset score, increment rewards_earned, and update total_saved
    cash_value = card['cash_per_redeem'] or 5.0
    new_rewards_earned = (card['rewards_earned'] or 0) + 1
    new_total_saved = (card['total_saved'] or 0) + cash_value
    now_iso = datetime.now().isoformat()
    
    conn.execute(
        'UPDATE rewards SET score = 0, rewards_earned = ?, total_saved = ?, updated_at = ? WHERE id = ?',
        (new_rewards_earned, new_total_saved, now_iso, card_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Reward redeemed successfully!',
        'cash_value': cash_value,
        'new_rewards_earned': new_rewards_earned,
        'new_total_saved': new_total_saved
    })

# Legacy alias for backward compatibility - Admin Dashboard Scan
@app.route('/api/rewards/scan', methods=['POST'])
def admin_scan():
    """Admin dashboard scan endpoint - requires admin authentication"""
    # Check admin authentication
    if 'company_id' not in session:
        print("DEBUG: Admin scan - no session found")
        return jsonify({'error': 'Unauthorized'}), 401
    
    company_id = session['company_id']
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    
    print(f"DEBUG: Admin scan - user_id={user_id}, company_id={company_id}")
    
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    
    # Use the same logic as mobile_scan but with admin session
    conn = get_db()
    
    # Check if user exists
    user = conn.execute('SELECT id FROM users WHERE id = ?', (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Check if company exists
    company = conn.execute('SELECT id, name FROM companies WHERE id = ?', (company_id,)).fetchone()
    if not company:
        conn.close()
        return jsonify({'error': 'Company not found'}), 404
    
    # Check if user already has a reward record for this company
    now_iso = datetime.now().isoformat()
    existing = conn.execute(
        'SELECT id, score, target_score FROM rewards WHERE user_id = ? AND company_id = ?',
        (user_id, company_id)
    ).fetchone()
    
    if existing:
        previous_score = existing['score']
        new_score = previous_score + 1
        target_score = existing['target_score']
        
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
    app.run(debug=True, host="0.0.0.0", port=5001)
