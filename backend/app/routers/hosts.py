from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import HostOut
from app.services.hosts import list_hosts

router = APIRouter(prefix="/api/hosts", tags=["hosts"])


@router.get("", response_model=list[HostOut])
def get_hosts(db: Session = Depends(get_db)):
    return list_hosts(db)
