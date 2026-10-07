from typing import Optional

from pydantic import BaseModel


class WilayahResponse(BaseModel):
    id_wilayah: int
    dusun: str
    rt: str
    rw: str
    nama_ketua_rt: Optional[str] = None

    class Config:
        from_attributes = True
