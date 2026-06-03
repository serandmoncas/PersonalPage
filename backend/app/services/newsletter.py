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
    db.commit()
    db.refresh(subscriber)
    return subscriber
