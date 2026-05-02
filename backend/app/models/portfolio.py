from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="My Portfolio")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    positions = relationship(
        "Position",
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)
    shares = Column(Float, nullable=False)
    avg_buy_price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    portfolio = relationship("Portfolio", back_populates="positions")
    price_history = relationship(
        "PriceHistory",
        back_populates="position",
        cascade="all, delete-orphan",
    )
    risk_scores = relationship(
        "RiskScore",
        back_populates="position",
        cascade="all, delete-orphan",
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

    position = relationship("Position", back_populates="price_history")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)
    score = Column(Float, nullable=False)
    rsi_signal = Column(Float)
    macd_signal = Column(Float)
    bb_signal = Column(Float)
    sentiment_signal = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    position = relationship("Position", back_populates="risk_scores")


class SentimentHistory(Base):
    __tablename__ = "sentiment_history"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    overall_score = Column(Float, nullable=False)
    overall_sentiment = Column(String, nullable=False)
    positive_count = Column(Integer, default=0)
    negative_count = Column(Integer, default=0)
    neutral_count = Column(Integer, default=0)
    article_count = Column(Integer, default=0)
    dominant_category = Column(String, nullable=True)
    urgent_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    target_price = Column(Float, nullable=True)
    alert_above = Column(Float, nullable=True)
    alert_below = Column(Float, nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    alerts = relationship(
        "WatchlistAlert",
        back_populates="watchlist_item",
        cascade="all, delete-orphan",
    )


class WatchlistAlert(Base):
    __tablename__ = "watchlist_alerts"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlist.id"), nullable=False)
    ticker = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    threshold = Column(Float, nullable=False)
    triggered_price = Column(Float, nullable=True)
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    notification_sent = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    watchlist_item = relationship("Watchlist", back_populates="alerts")
