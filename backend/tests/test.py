
from pydantic import BaseModel
from typing import Optional
import json

class User(BaseModel):
    name: str
    age: int
    evaltion: Optional[str]

class Info(BaseModel):
    user: User
    target: Optional[str]
    jdsk: int

info = Info(user=User(name="后点击开始", age=30, evaltion="good"), target="example", jdsk=123)

# 使用.dict()以及exclude来排除特定字段
info_dict = info.dict(exclude={'user': {'evaltion'}})

# 将结果转换成JSON字符串
info_json = json.dumps(info_dict, ensure_ascii=False)

print(info_json)


