from flask import Flask
from flask import request

app = Flask(__name__)

@app.get("/ai/<int:user_id>")
def get_ai_info(user_id):
    print(user_id)
    return f"{request}"