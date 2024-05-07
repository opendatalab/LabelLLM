from typing import Literal

from pydantic import BaseModel


class ToolTranslateResponse(BaseModel):
    text: str


class ToolTranslateRequest(BaseModel):
    text: str
    source: Literal["EN", "ZH"]
    target: Literal["EN-GB", "EN-US", "ZH"]

class ToolGoogleTranslateResponse(BaseModel):
    text: str
    source: Literal["ar", "cs", "hu", "sr", "ru", "ko", "vi", "th", "de", "fr", "ja", "zh", "en"]
    target: Literal["ar", "cs", "hu", "sr", "ru", "ko", "vi", "th", "de", "fr", "ja", "zh", "en"]
