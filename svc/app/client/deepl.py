import deepl

from app.core.config import settings
from app.core.exceptions import TRANSLATE_SERVICE_ERROR


class DeeplClient:
    def __init__(self, auth_key: str):
        self.client = deepl.Translator(auth_key)

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        try:
            result = self.client.translate_text(
                text=text,
                source_lang=source_lang,
                target_lang=target_lang,
            )
        except deepl.exceptions.DeepLException:
            raise TRANSLATE_SERVICE_ERROR

        return result.text  # type: ignore


deepl_client = DeeplClient(settings.DEEPL_AUTH_KEY)
