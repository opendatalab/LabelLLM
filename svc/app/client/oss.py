import oss2

from app.core.config import settings


class OSSClient:
    def __init__(
        self, ak: str, sk: str, endpoint: str, internal_endpoint: str, bucket: str
    ):
        self._auth = oss2.Auth(ak, sk)
        self.client = oss2.Bucket(self._auth, endpoint, bucket)
        self.internal_client = oss2.Bucket(self._auth, internal_endpoint, bucket)


oss = OSSClient(
    settings.OSS_ACCESS_KEY_ID,
    settings.OSS_ACCESS_KEY_SECRET,
    settings.OSS_ENDPOINT,
    settings.OSS_INTERNAL_ENDPOINT,
    settings.OSS_BUCKET,
)
