from typing import List, AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import settings

class LLMService:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-pro",
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=0.7
            )
        else:
            print("Warning: GOOGLE_API_KEY not set. LLM service will not work properly.")
            self.llm = None

    async def generate_response(self, messages: List[dict]) -> str:
        if not self.llm:
            return "I'm sorry, I'm not configured properly (missing API key)."

        langchain_messages = []
        for msg in messages:
            if msg['role'] == 'user':
                langchain_messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                langchain_messages.append(AIMessage(content=msg['content']))

        try:
            response = await self.llm.ainvoke(langchain_messages)
            return response.content
        except Exception as e:
            return f"Error generating response: {str(e)}"

llm_service = LLMService()
