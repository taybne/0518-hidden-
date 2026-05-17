#!/usr/bin/env python
"""Script to delete accounts by email and nickname"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db, User, PrivateMessage

def delete_account_by_email(email):
    """Delete account by email"""
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            user_id = user.id
            print(f"Found user: {user.nickname} ({user.email})")
            
            # Delete all messages associated with this user
            PrivateMessage.query.filter(
                (PrivateMessage.sender_id == user_id) | (PrivateMessage.receiver_id == user_id)
            ).delete(synchronize_session=False)
            print(f"Deleted {PrivateMessage.query.count()} messages")
            
            # Delete the user
            db.session.delete(user)
            db.session.commit()
            print(f"✅ Account deleted: {user.nickname} ({email})")
            return True
        else:
            print(f"❌ Account not found: {email}")
            return False

def delete_account_by_nickname(nickname):
    """Delete account by nickname"""
    with app.app_context():
        user = User.query.filter_by(nickname=nickname).first()
        if user:
            user_id = user.id
            print(f"Found user: {user.nickname} ({user.email})")
            
            # Delete all messages associated with this user
            PrivateMessage.query.filter(
                (PrivateMessage.sender_id == user_id) | (PrivateMessage.receiver_id == user_id)
            ).delete(synchronize_session=False)
            print(f"Deleted messages")
            
            # Delete the user
            db.session.delete(user)
            db.session.commit()
            print(f"✅ Account deleted: {user.nickname} ({user.email})")
            return True
        else:
            print(f"❌ Account not found: {nickname}")
            return False

if __name__ == '__main__':
    print("🗑️  Deleting accounts...\n")
    
    # Delete by email
    delete_account_by_email('faustovataisia@yandex.ru')
    print()
    
    print("✅ Done!")
