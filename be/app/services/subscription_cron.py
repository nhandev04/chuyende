import asyncio
import logging
from app.db.database import SessionLocal
from app.api.subscription import expire_outdated_subscriptions

logger = logging.getLogger(__name__)

async def start_subscription_expiration_cron(interval_seconds: int = 3600):
    """
    Background cronjob that periodically scans DB and downgrades expired plans to 'standard'.
    Runs continuously in the background while FastAPI application is running.
    """
    logger.info("⏰ Subscription Expiration Cronjob Service initialized (checking every %d seconds)...", interval_seconds)
    while True:
        try:
            db = SessionLocal()
            try:
                expire_outdated_subscriptions(db)
            finally:
                db.close()
        except Exception as e:
            logger.error("Error in subscription expiration cronjob task: %e", e)

        await asyncio.sleep(interval_seconds)
