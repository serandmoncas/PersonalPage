import pytest
from app.services.newsletter import subscribe
from app.models.subscriber import Subscriber


def test_subscribe_creates_subscriber(db):
    result = subscribe(db, "user@example.com")
    assert result.email == "user@example.com"
    assert result.is_active is True


def test_subscribe_duplicate_is_idempotent(db):
    first = subscribe(db, "user@example.com")
    second = subscribe(db, "user@example.com")
    assert first.id == second.id
    count = db.query(Subscriber).filter_by(email="user@example.com").count()
    assert count == 1


def test_subscribe_reactivates_inactive_subscriber(db):
    sub = subscribe(db, "user@example.com")
    sub.is_active = False
    db.commit()

    result = subscribe(db, "user@example.com")
    assert result.id == sub.id
    assert result.is_active is True
