from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.subscriber import Subscriber


def subscribe(db: Session, email: str) -> Subscriber:
    existing = db.query(Subscriber).filter(Subscriber.email == email).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing
    subscriber = Subscriber(email=email)
    db.add(subscriber)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent duplicate — another request inserted first
        db.rollback()
        return db.query(Subscriber).filter(Subscriber.email == email).first()
    db.refresh(subscriber)
    return subscriber
