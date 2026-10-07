from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.company import Company
from app.models.admin import Admin
from app.schemas.user import UserRegisterRequest


class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email.ilike(email.strip())).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def register_user(db: Session, data: UserRegisterRequest) -> User:
        clean_email = data.email.strip().lower()

        # Check if user already exists with this email
        existing_user = AuthService.get_user_by_email(db, clean_email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists."
            )

        # Check if roll_number already exists for student
        cleaned_roll = None
        if data.role == UserRole.STUDENT and data.roll_number:
            r = data.roll_number.strip()
            if r:
                cleaned_roll = r
                existing_student = db.query(Student).filter(Student.roll_number.ilike(cleaned_roll)).first()
                if existing_student:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Roll number '{cleaned_roll}' is already registered to another student. Please check your roll number or sign in with your registered account."
                    )

        hashed_password = get_password_hash(data.password)
        user = User(
            email=clean_email,
            hashed_password=hashed_password,
            role=data.role,
            is_active=True
        )
        db.add(user)

        try:
            db.flush()  # Flush to get user.id for profile creation

            # Create role-specific profile
            if data.role == UserRole.STUDENT:
                student_name = data.full_name.strip() if data.full_name and data.full_name.strip() else clean_email.split("@")[0].capitalize()
                student = Student(
                    user_id=user.id,
                    full_name=student_name,
                    roll_number=cleaned_roll,
                    department=data.department.strip() if data.department and data.department.strip() else None,
                    graduation_year=data.graduation_year,
                    cgpa=data.cgpa,
                    phone=data.phone.strip() if data.phone and data.phone.strip() else None,
                    is_verified=False,
                    backlogs=0,
                    is_placed=False,
                    skills='[]',
                    projects='[]',
                    certifications='[]',
                )
                db.add(student)

            elif data.role == UserRole.COMPANY:
                company_name = data.company_name.strip() if data.company_name and data.company_name.strip() else "Company " + clean_email.split("@")[0]
                company = Company(
                    user_id=user.id,
                    company_name=company_name,
                    industry=data.industry.strip() if data.industry and data.industry.strip() else None,
                    website=data.website.strip() if data.website and data.website.strip() else None,
                    contact_person=data.contact_person.strip() if data.contact_person and data.contact_person.strip() else None,
                    contact_email=str(data.contact_email).strip().lower() if data.contact_email else clean_email,
                    phone=data.phone.strip() if data.phone and data.phone.strip() else None,
                )
                db.add(company)

            elif data.role == UserRole.ADMIN:
                admin_name = data.full_name.strip() if data.full_name and data.full_name.strip() else "Administrator"
                admin = Admin(
                    user_id=user.id,
                    full_name=admin_name,
                    designation=data.designation.strip() if data.designation and data.designation.strip() else "Placement Officer",
                    phone=data.phone.strip() if data.phone and data.phone.strip() else None,
                )
                db.add(admin)

            db.commit()
            db.refresh(user)
            return user

        except IntegrityError as exc:
            db.rollback()
            err_str = str(exc).lower()
            if "roll_number" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Roll number '{cleaned_roll}' is already registered to another student."
                )
            elif "email" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration failed due to duplicate database record."
                )
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
