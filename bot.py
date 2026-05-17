#!/usr/bin/env python
"""Telegram Bot for TAG App verification"""

import os
import sys
import random
from datetime import datetime, timedelta
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv

# Add miniapp to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'miniapp'))

from app import app, db, User

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    await update.message.reply_text('Привет! Я бот для верификации аккаунта TAG. Используйте /verify ваш_никнейм для получения кода верификации.')

async def verify(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle verification command."""
    username = update.effective_user.username
    chat_id = update.effective_chat.id

    if not context.args:
        await update.message.reply_text('Пожалуйста, укажите ваш никнейм: /verify ваш_никнейм')
        return

    nickname = context.args[0]

    with app.app_context():
        user = User.query.filter_by(nickname=nickname).first()
        if not user:
            await update.message.reply_text(f'Пользователь с никнеймом "{nickname}" не найден. Сначала зарегистрируйтесь на сайте.')
            return

        if user.telegram_username != username:
            await update.message.reply_text(f'Ваш Telegram username ({username}) не совпадает с указанным при регистрации ({user.telegram_username}).')
            return

        if user.is_confirmed:
            await update.message.reply_text('Ваш аккаунт уже подтвержден.')
            return

        # Generate verification code
        code = str(random.randint(1000, 9999))
        user.verification_code = code
        user.verification_expires = datetime.utcnow() + timedelta(minutes=10)
        user.telegram_id = str(chat_id)  # Save chat_id for future use
        db.session.commit()

        await update.message.reply_text(f'Ваш код верификации: {code}\n\nВведите этот код на сайте для подтверждения регистрации.')

def main() -> None:
    """Start the bot."""
    if not TELEGRAM_BOT_TOKEN:
        print("TELEGRAM_BOT_TOKEN not set in environment variables")
        return

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("verify", verify))

    application.run_polling()

if __name__ == '__main__':
    main()