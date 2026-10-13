from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AlertRule, Event
from app.schemas import AlertRuleCreate, AlertRuleOut, AlertRuleUpdate

router = APIRouter(prefix="/api/alert-rules", tags=["alert rules"])


def _get_or_404(db: Session, rule_id: int) -> AlertRule:
    rule = db.get(AlertRule, rule_id)
    if rule is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alert rule not found")
    return rule


@router.get("", response_model=list[AlertRuleOut])
def list_rules(db: Session = Depends(get_db)):
    return db.scalars(select(AlertRule).order_by(AlertRule.id)).all()


@router.post("", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
def create_rule(body: AlertRuleCreate, db: Session = Depends(get_db)):
    rule = AlertRule(**body.model_dump())
    db.add(rule)
    db.commit()
    return rule


@router.patch("/{rule_id}", response_model=AlertRuleOut)
def update_rule(rule_id: int, body: AlertRuleUpdate, db: Session = Depends(get_db)):
    rule = _get_or_404(db, rule_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = _get_or_404(db, rule_id)
    # keep the history, just detach it from the deleted rule
    db.execute(update(Event).where(Event.rule_id == rule_id).values(rule_id=None))
    db.delete(rule)
    db.commit()
