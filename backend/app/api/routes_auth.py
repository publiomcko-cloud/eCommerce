from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AuthTokenResponse, AuthUserResponse, LoginRequest, RegisterRequest, RoleCheckResponse
from app.services.auth_service import (
    AuthContext,
    authenticate_user,
    get_current_auth_context,
    register_user,
    require_roles,
    serialize_auth_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def auth_register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    try:
        return register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/login", response_model=AuthTokenResponse)
def auth_login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    try:
        return authenticate_user(db, payload)
    except ValueError as exc:
        detail = str(exc)
        status_code = status.HTTP_403_FORBIDDEN if "Inactive users" in detail else status.HTTP_401_UNAUTHORIZED
        raise HTTPException(status_code=status_code, detail=detail) from exc


@router.get("/me", response_model=AuthUserResponse)
def auth_me(
    context: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
) -> AuthUserResponse:
    return serialize_auth_user(db, context.user, context.customer)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def auth_logout(_: AuthContext = Depends(get_current_auth_context)) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/admin/check", response_model=RoleCheckResponse)
def auth_admin_check(_: AuthContext = Depends(require_roles("admin"))) -> RoleCheckResponse:
    return RoleCheckResponse(status="ok", role="admin")
