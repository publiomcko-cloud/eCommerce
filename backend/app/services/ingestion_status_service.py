from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.data_quality_issue import DataQualityIssue
from app.models.ingestion_run import IngestionRun
from app.schemas.ingestion import (
    IngestionRunResponse,
    IssueTypeCount,
    LatestIngestionRunResponse,
    QualitySummary,
)


def serialize_ingestion_run(run: IngestionRun) -> IngestionRunResponse:
    return IngestionRunResponse(
        id=str(run.id),
        job_name=run.job_name,
        source_name=run.source_name,
        status=run.status,
        started_at=run.started_at,
        finished_at=run.finished_at,
        records_read=run.records_read,
        records_inserted=run.records_inserted,
        records_rejected=run.records_rejected,
        error_message=run.error_message,
        created_at=run.created_at,
    )


def list_ingestion_runs(session: Session) -> list[IngestionRunResponse]:
    runs = session.scalars(
        select(IngestionRun).order_by(IngestionRun.started_at.desc(), IngestionRun.created_at.desc())
    ).all()
    return [serialize_ingestion_run(run) for run in runs]


def build_quality_summary(session: Session, run_id: str) -> QualitySummary:
    issue_rows = session.execute(
        select(DataQualityIssue.issue_type, func.count(DataQualityIssue.id))
        .where(DataQualityIssue.ingestion_run_id == run_id)
        .group_by(DataQualityIssue.issue_type)
        .order_by(DataQualityIssue.issue_type.asc())
    ).all()
    issue_types = [IssueTypeCount(issue_type=issue_type, count=count) for issue_type, count in issue_rows]
    total_issues = sum(item.count for item in issue_types)
    return QualitySummary(total_issues=total_issues, issue_types=issue_types)


def get_latest_ingestion_run(session: Session) -> LatestIngestionRunResponse | None:
    run = session.scalar(
        select(IngestionRun).order_by(IngestionRun.started_at.desc(), IngestionRun.created_at.desc())
    )
    if run is None:
        return None

    base = serialize_ingestion_run(run)
    return LatestIngestionRunResponse(
        **base.model_dump(),
        quality_summary=build_quality_summary(session, str(run.id)),
    )
