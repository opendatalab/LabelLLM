import asyncio
from concurrent import futures
import httpx
from googleapiclient.discovery import build

from loguru import logger
from app.core.config import settings
from app.core.exceptions import TRANSLATE_SERVICE_ERROR


class GoogleClient:
    def __init__(self, auth_key: str):
        self.service = build(
            "translate", "v2", developerKey=auth_key
        )

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        try:
            result = self.service.translations().list(source=source_lang, target=target_lang, q=[text]).execute()
        except Exception as e:
            logger.error(e)
            raise TRANSLATE_SERVICE_ERROR

        return result["translations"][0]["translatedText"]
    
    @classmethod
    async def async_translate(cls, text: str, source_lang: str, target_lang: str):
        google_client = GoogleClient(settings.GOOGLE_AUTH_KEY)
        with futures.ThreadPoolExecutor() as pool:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(pool, google_client.translate, text, source_lang, target_lang)
        return result

    @classmethod
    async def async_translate_by_proxy(cls, text: str, source_lang: str, target_lang: str):
        try:
            headers = {
                "Authorization": settings.GOOGLE_PROXY_AUTH
            }
            data = {
                "text": text,
                "source": source_lang,
                "target": target_lang,
                "auth_key": settings.GOOGLE_AUTH_KEY
            }
            response = await httpx.AsyncClient().post(settings.GOOGLE_PROXY_URL, headers=headers, json=data)
            result = response.json()
        except Exception as e:
            logger.error(e)
            raise TRANSLATE_SERVICE_ERROR
        print(result)
        return result["text"]