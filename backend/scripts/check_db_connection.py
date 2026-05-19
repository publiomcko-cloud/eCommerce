import sys
from pathlib import Path

from sqlalchemy import text

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.db.session import engine


def main() -> None:
    settings = get_settings()

    with engine.connect() as connection:
        current_database = connection.execute(text("select current_database()")).scalar_one()
        current_user = connection.execute(text("select current_user")).scalar_one()
        healthcheck = connection.execute(text("select 1")).scalar_one()

    print("database_url=", settings.database_url)
    print("current_database=", current_database)
    print("current_user=", current_user)
    print("healthcheck=", healthcheck)


if __name__ == "__main__":
    main()
