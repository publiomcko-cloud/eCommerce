from datetime import datetime

from pydantic import BaseModel


class IssueTypeCount(BaseModel):
    issue_type: str
    count: int


class QualitySummary(BaseModel):
    total_issues: int
    issue_types: list[IssueTypeCount]


class IngestionRunResponse(BaseModel):
    id: str
    job_name: str
    source_name: str
    status: str
    started_at: datetime
    finished_at: datetime | None
    records_read: int
    records_inserted: int
    records_rejected: int
    error_message: str | None
    created_at: datetime


class LatestIngestionRunResponse(IngestionRunResponse):
    quality_summary: QualitySummary
