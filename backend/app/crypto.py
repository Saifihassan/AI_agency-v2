import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken


def _secret_source() -> str:
    for key in ("BYOK_SECRET", "SECRET_KEY", "SUPABASE_DB_URL", "DATABASE_URL"):
        value = os.getenv(key)
        if value:
            return value
    return "agencyos-local-dev"


def _fernet() -> Fernet:
    digest = hashlib.sha256(_secret_source().encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_secret(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str) -> str | None:
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError):
        return None
