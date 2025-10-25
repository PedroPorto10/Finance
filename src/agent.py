import os

from agno.agent import Agent
from agno.models.groq import Groq

from dotenv import load_dotenv

load_dotenv()

class UserAgent(Agent):

    def __init__(self):
        self.current = 0
        self.available_models = [
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "qwen/qwen3-32b",
            "deepseek-r1-distill-llama-70b",
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile",
            "meta-llama/llama-4-maverick-17b-128e-instruct",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "meta-llama/llama-guard-4-12b",
            "meta-llama/llama-prompt-guard-2-22m",
            "meta-llama/llama-prompt-guard-2-86m"
        ]

        super().__init__(
            role=os.getenv('AGENT_ROLE', '')
        )

        self.switch_model()

    def switch_model(self):
        self.current = 0 if self.current + 1 >= len(self.available_models) else self.current + 1

        self.model_id = self.available_models[self.current]
        self.model = Groq(id=self.model_id, api_key=os.getenv('GROQ_API_KEY', ''), temperature=0.2)

        print(f'[INFO] O modelo foi trocado para {self.model_id}')


    def run_prompt(self, prompt):
        try:
            response = self.run(f"{prompt}")
            return str(response.content)
        except Exception as e:
            print(f"[ERRO] {e} -> tentando próximo modelo...")
            self.switch_model()
            return self.run_prompt(prompt)