from minio import Minio

from app.core.config import settings


class MinioClient:
    def __init__(
        self, ak: str, sk: str, endpoint: str, internal_endpoint: str, bucket: str
    ):
        self.client = Minio(internal_endpoint, access_key=ak, secret_key=sk, secure=False)
        self.bucket = bucket
        self.endpoint = endpoint
        self.internal_endpoint = internal_endpoint

minio = MinioClient(
    settings.MINIO_ACCESS_KEY_ID,
    settings.MINIO_ACCESS_KEY_SECRET,
    settings.MINIO_ENDPOINT,
    settings.MINIO_INTERNAL_ENDPOINT,
    settings.MINIO_BUCKET,
)

