"""Contact scoring utility.

Auto-scores contacts based on data completeness:
+1 for each non-null field among: name, company, role, industry, city, website, linkedin.
"""

from app.models import Contact


SCORED_FIELDS = ["name", "company", "role", "industry", "city", "website", "linkedin"]


def calculate_contact_score(contact: Contact) -> int:
    """Return a completeness score based on how many profile fields are filled."""
    score = 0
    for field in SCORED_FIELDS:
        value = getattr(contact, field, None)
        if value and str(value).strip():
            score += 1
    return score


def apply_auto_score(contact: Contact) -> None:
    """Calculate and set the score on a contact instance (does NOT commit)."""
    contact.score = calculate_contact_score(contact)
