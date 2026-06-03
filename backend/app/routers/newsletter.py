from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.subscriber import SubscribeRequest, SubscriberResponse
from app.services import newsletter as newsletter_svc

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post(
    "/subscribe",
    response_model=SubscriberResponse,
    status_code=status.HTTP_201_CREATED,
)
def subscribe(payload: SubscribeRequest, db: Session = Depends(get_db)):
    return newsletter_svc.subscribe(db, payload.email)
