from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ingestion import IngestionRunResponse, LatestIngestionRunResponse
from app.services.ingestion_status_service import get_latest_ingestion_run, list_ingestion_runs

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


@router.get("/runs", response_model=list[IngestionRunResponse])
def ingestion_runs(db: Session = Depends(get_db)) -> list[IngestionRunResponse]:
    return list_ingestion_runs(db)


@router.get("/runs/latest", response_model=LatestIngestionRunResponse)
def latest_ingestion_run(db: Session = Depends(get_db)) -> LatestIngestionRunResponse:
    latest = get_latest_ingestion_run(db)
    if latest is None:
        raise HTTPException(status_code=404, detail="No ingestion runs found.")
    return latest
