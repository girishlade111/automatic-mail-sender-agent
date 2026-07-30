"""Email validation service.

Validates email addresses by checking format (regex) and optionally
verifying DNS MX records using dnspython.
"""

import re
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# RFC 5322 simplified email regex
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)


def validate_email_address(email: str) -> Tuple[bool, str]:
    """Validate an email address by checking format and DNS MX records.

    Returns:
        Tuple of (is_valid, error_message). If valid, error_message is empty string.
    """
    if not email or not email.strip():
        return False, "Email address is empty"

    email = email.strip().lower()

    # Check format
    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format"

    # Check length
    if len(email) > 320:
        return False, "Email address exceeds maximum length"

    # Extract domain
    parts = email.split("@")
    if len(parts) != 2:
        return False, "Invalid email format: missing @ symbol"

    local_part, domain = parts

    if not local_part:
        return False, "Empty local part"

    if not domain:
        return False, "Empty domain"

    if len(local_part) > 64:
        return False, "Local part exceeds maximum length"

    # Check DNS MX records
    try:
        import dns.resolver

        try:
            mx_records = dns.resolver.resolve(domain, "MX")
            if not mx_records:
                return False, f"No MX records found for domain: {domain}"
        except dns.resolver.NXDOMAIN:
            return False, f"Domain does not exist: {domain}"
        except dns.resolver.NoAnswer:
            # Some domains use A records instead of MX records
            try:
                dns.resolver.resolve(domain, "A")
            except Exception:
                return False, f"Domain has no mail server: {domain}"
        except dns.resolver.NoNameservers:
            return False, f"No nameservers found for domain: {domain}"
        except dns.resolver.Timeout:
            # If DNS times out, we allow the email (soft fail)
            logger.warning("DNS timeout when validating domain: %s", domain)
            return True, ""
        except Exception as e:
            # On any other DNS error, log but allow
            logger.warning("DNS validation error for %s: %s", domain, str(e))
            return True, ""

    except ImportError:
        # dnspython not installed, skip MX check
        logger.warning("dnspython not installed, skipping MX record validation")

    return True, ""
