from sqlalchemy.orm import Session

from app.models.company import Company
from app.schemas.company import CompanyUpdate

############################################### COMPANY CURD #############


def create_company(db: Session, company_crt_schma: dict):
    company_model = Company(**company_crt_schma)
    db.add(company_model)
    db.commit()
    db.refresh(company_model)
    return company_model


def get_company(
    db: Session, limit: int, offset: int, search: str | None = None, short: str = "id"
):
    quary = db.query(Company)
    if search:
        quary = quary.filter(Company.name.ilike(f"%{search}%"))

    if short:
        short_fields = {
            "name": Company.name,
            "created_at": Company.created_at,
            "updated_at": Company.updated_at,
        }

        quary = (
            quary.order_by(short_fields.get(short, Company.id))
            .offset(offset)
            .limit(limit)
        )

    return quary.all()


def get_company_by_id(db: Session, Company_id: int):
    return db.query(Company).filter(Company.id == Company_id).first()


def update_company(new_Name: CompanyUpdate, Company_id: int, db: Session):
    selected_company = db.query(Company).filter(Company.id == Company_id).first()
    selected_company.name = new_Name.name
    db.commit()
    db.refresh(selected_company)
    return selected_company


def delete_company(db: Session, company_id: int):
    selected_company = db.query(Company).filter(Company.id == company_id).first()
    db.delete(selected_company)
    db.commit()
    return {selected_company.name: "Succesfully Deleted"}
