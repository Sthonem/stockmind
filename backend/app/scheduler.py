import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_daily_sync():
    logger.info("Starting daily price sync...")
    async with AsyncSessionLocal() as db:
        try:
            from sqlalchemy import select

            from app.models.portfolio import Portfolio, Position
            from app.services.alerts import check_portfolio_alerts
            from app.services.price_sync import sync_all_positions
            from app.services.risk_history import save_risk_scores_for_portfolio
            from app.services.sentiment_history import save_sentiment_snapshot

            sync_results = await sync_all_positions(db)
            logger.info(f"Price sync complete: {sync_results}")

            portfolios_result = await db.execute(select(Portfolio))
            portfolios = portfolios_result.scalars().all()
            for portfolio in portfolios:
                await save_risk_scores_for_portfolio(portfolio.id, db)
                logger.info(f"Risk scores saved for portfolio {portfolio.id}")

            try:
                for portfolio in portfolios:
                    await check_portfolio_alerts(
                        portfolio_id=portfolio.id,
                        db=db,
                        risk_threshold=70.0,
                        send_notifications=True,
                    )
                    logger.info(f"Alert check complete for portfolio {portfolio.id}")
            except Exception as e:
                logger.error(f"Alert check failed: {e}")

            positions_result = await db.execute(select(Position))
            seen_tickers = set()
            for pos in positions_result.scalars().all():
                if pos.ticker not in seen_tickers:
                    await save_sentiment_snapshot(pos.ticker, db)
                    seen_tickers.add(pos.ticker)
                    logger.info(f"Sentiment saved for {pos.ticker}")

            try:
                from app.services.daily_summary import generate_daily_summary

                summary = generate_daily_summary()
                logger.info(f"Daily summary generated: {summary['date']}")
            except Exception as e:
                logger.error(f"Daily summary generation failed: {e}")

        except Exception as e:
            logger.error(f"Daily sync failed: {e}")


async def check_watchlist_alerts_job():
    from app.services.watchlist import check_watchlist_alerts

    async with AsyncSessionLocal() as db:
        try:
            triggered = await check_watchlist_alerts(db, send_notifications=True)
            logger.info(f"Watchlist check: {len(triggered)} alerts triggered")
        except Exception as e:
            logger.error(f"Watchlist check failed: {e}")


async def run_earnings_alerts_job():
    from app.services.earnings_alert import run_earnings_alert_check

    await run_earnings_alert_check()


def start_scheduler():
    from app.services.daily_notification import run_all_daily_notifications

    scheduler.add_job(
        run_daily_sync,
        trigger=CronTrigger(hour=16, minute=30, timezone="America/New_York"),
        id="daily_price_sync",
        replace_existing=True,
    )
    scheduler.add_job(
        run_all_daily_notifications,
        trigger=CronTrigger(hour=9, minute=0, timezone="America/New_York"),
        id="daily_notifications",
        replace_existing=True,
    )
    scheduler.add_job(
        check_watchlist_alerts_job,
        trigger=CronTrigger(hour=16, minute=45, timezone="America/New_York"),
        id="watchlist_alerts",
        replace_existing=True,
    )
    scheduler.add_job(
        run_earnings_alerts_job,
        trigger=CronTrigger(hour=8, minute=30, timezone="America/New_York"),
        id="earnings_alerts",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — daily sync at 16:30 ET")
    logger.info("Notification scheduler added — daily at 09:00 ET")
    logger.info("Watchlist alert scheduler added — daily at 16:45 ET")
    logger.info("Earnings alert scheduler added — daily at 08:30 ET")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
