from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

if "sqlite" in settings.async_database_url:
    connect_args = {"check_same_thread": False}
elif settings.is_postgres:
    # asyncpg requires ssl passed as a connect_arg, not a URL query param
    connect_args = {"ssl": True}
else:
    connect_args = {}

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


from app.models import portfolio  # noqa: F401, E402


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
