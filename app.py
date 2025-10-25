from flask import Flask, request, jsonify
from dotenv import load_dotenv
from src.agent import UserAgent

import jwt
import datetime
import os

app = Flask(__name__)
app.config['TOKEN_JWT'] = os.getenv('TOKEN_JWT')

agent = UserAgent()

@app.get("/ai/<int:user_id>")
def get_ai_info(user_id):
    response = agent.run_prompt('Gere um insight para mim, tenho 5000 de renda mensal e gasto 4000. o que eu devo fazer? quero aumentar minha renda')

    return f"{response}"

@app.post("/auth/login")
def login():
    data = request.get_json()

    user = data.get('user')
    password = data.get('password')

    print('user:', user, 'password:', password)

    token = jwt.encode({
        'user': user,
        'exp': datetime.datetime.now() + datetime.timedelta(hours=1)
    }, app.config['TOKEN_JWT'], algorithm='HS256')

    return jsonify({'access_token': token})