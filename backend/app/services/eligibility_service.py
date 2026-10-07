import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.student import Student
from app.models.eligibility import EligibilityCriteria
from app.models.job import Job
from app.models.drive import PlacementDrive


class EligibilityResult(BaseModel):
    is_eligible: bool
    reasons: List[str] = []
    matched_criteria: Optional[Dict[str, Any]] = None


class EligibilityService:
    @staticmethod
    def _normalize_branch_tokens(branch: str) -> List[str]:
        if not branch:
            return []
        b = branch.lower().strip()
        tokens = [b]
        # Common abbreviation aliases in campus placement systems
        if "computer" in b or "cse" in b:
            tokens.extend(["cse", "cs", "computer science", "computer science & engineering", "computer science and engineering"])
        if "information" in b or " it" in b or b == "it":
            tokens.extend(["it", "information technology"])
        if "electronics" in b or "ece" in b or "communication" in b:
            tokens.extend(["ece", "electronics", "electronics & communication", "electronics and communication"])
        if "electrical" in b or "eee" in b:
            tokens.extend(["eee", "electrical", "electrical & electronics"])
        if "mechanical" in b or "mech" in b:
            tokens.extend(["mech", "mechanical", "mechanical engineering"])
        if "civil" in b:
            tokens.extend(["civil", "civil engineering"])
        return tokens

    @staticmethod
    def matches_branch(student_branch: Optional[str], eligible_branches: List[str]) -> bool:
        if not eligible_branches:
            return True
        if not student_branch:
            return False

        student_tokens = EligibilityService._normalize_branch_tokens(student_branch)
        for allowed in eligible_branches:
            allowed_tokens = EligibilityService._normalize_branch_tokens(allowed)
            # Check direct match or token intersection
            if any(st == at or st in at or at in st for st in student_tokens for at in allowed_tokens):
                return True
        return False

    @staticmethod
    def check_eligibility(
        student: Student,
        criteria: Optional[EligibilityCriteria]
    ) -> EligibilityResult:
        """
        Check if a student qualifies under the given database EligibilityCriteria.
        Returns is_eligible flag and human-readable failure reasons.
        """
        if not criteria:
            # If no specific criteria is set, student is eligible by default
            return EligibilityResult(is_eligible=True, reasons=[])

        reasons: List[str] = []

        # 1. CGPA Check
        student_cgpa = float(student.cgpa) if student.cgpa is not None else 0.0
        if student_cgpa < float(criteria.min_cgpa):
            reasons.append(
                f"CGPA {student_cgpa:.2f} is below the minimum required cutoff of {criteria.min_cgpa:.2f}"
            )

        # 2. Backlogs Check
        student_backlogs = int(student.backlogs) if student.backlogs is not None else 0
        if student_backlogs > int(criteria.max_backlogs):
            reasons.append(
                f"Active backlogs ({student_backlogs}) exceed maximum allowed limit of {criteria.max_backlogs}"
            )

        # 3. Eligible Branches Check
        eligible_branches: List[str] = []
        if isinstance(criteria.eligible_branches, str):
            try:
                eligible_branches = json.loads(criteria.eligible_branches)
            except Exception:
                eligible_branches = [b.strip() for b in criteria.eligible_branches.split(",") if b.strip()]
        elif isinstance(criteria.eligible_branches, list):
            eligible_branches = criteria.eligible_branches

        if eligible_branches and not EligibilityService.matches_branch(student.department, eligible_branches):
            reasons.append(
                f"Department/Branch '{student.department or 'Unassigned'}' is not among eligible branches: {', '.join(eligible_branches)}"
            )

        # 4. Eligible Batch (Graduation Year) Check
        if criteria.eligible_batch:
            student_batch = student.graduation_year
            if student_batch and int(student_batch) != int(criteria.eligible_batch):
                reasons.append(
                    f"Graduation batch class of {student_batch} does not match required batch of {criteria.eligible_batch}"
                )

        is_eligible = len(reasons) == 0
        matched_info = {
            "min_cgpa": criteria.min_cgpa,
            "max_backlogs": criteria.max_backlogs,
            "eligible_branches": eligible_branches,
            "eligible_batch": criteria.eligible_batch,
        }

        return EligibilityResult(
            is_eligible=is_eligible,
            reasons=reasons,
            matched_criteria=matched_info,
        )

    @staticmethod
    def get_job_criteria(job: Job) -> Optional[EligibilityCriteria]:
        """Fetch either the job's direct criteria or inherit from its placement drive."""
        if job.eligibility_criteria:
            return job.eligibility_criteria
        if job.drive and job.drive.eligibility_criteria:
            return job.drive.eligibility_criteria
        if job.company and job.company.placement_drives:
            for d in job.company.placement_drives:
                if d.is_active and d.eligibility_criteria:
                    return d.eligibility_criteria
        return None

    @staticmethod
    def check_job_eligibility(student: Student, job: Job) -> EligibilityResult:
        criteria = EligibilityService.get_job_criteria(job)
        return EligibilityService.check_eligibility(student, criteria)
