import os
import json
import logging
from typing import Optional, Dict, Any, List
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProvider:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        self.gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        self.anthropic_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY")
        self.provider = settings.AI_PROVIDER.lower()
        
    def generate_completion(self, system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> Optional[str]:
        # 1. Gemini if configured or selected
        if (self.provider == "gemini" or (self.provider == "auto" and self.gemini_key)) and self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{system_prompt}\n\n{user_prompt}"}
                        ]
                    }],
                    "generationConfig": {
                        "maxOutputTokens": max_tokens,
                        "temperature": 0.2
                    }
                }
                resp = requests.post(url, json=payload, timeout=20)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                logger.warning(f"Gemini API request failed: {e}")

        # 2. OpenAI if configured or selected
        if (self.provider == "openai" or (self.provider == "auto" and self.openai_key)) and self.openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": max_tokens
                }
                resp = requests.post(url, headers=headers, json=payload, timeout=20)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.warning(f"OpenAI API request failed: {e}")

        # 3. Anthropic if configured
        if (self.provider == "anthropic" or (self.provider == "auto" and self.anthropic_key)) and self.anthropic_key:
            try:
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "claude-3-haiku-20240307",
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.2
                }
                resp = requests.post(url, headers=headers, json=payload, timeout=20)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["content"][0]["text"]
            except Exception as e:
                logger.warning(f"Anthropic API request failed: {e}")

        return None

llm_provider = LLMProvider()
