from flask import Flask

from src.agent import UserAgent

app = Flask(__name__)
agent = UserAgent()

@app.get("/ai/<int:user_id>")
def get_ai_info(user_id):
    response = agent.run_prompt('Gere um insight para mim, tenho 5000 de renda mensal e gasto 4000. o que eu devo fazer? quero aumentar minha renda')

    return f"{response}"