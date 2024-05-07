from app.crud.base import CRUDBase
from app.models.file import File, FileCreate, FileUpdate


class CRUDFile(CRUDBase[File, FileCreate, FileUpdate]):
    ...


file = CRUDFile(File)
