import os
import time
from typing import Optional

import jwt
import requests
from fastapi import HTTPException, Request

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

_jwks_cache = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL = 3600.0


def _fetch_jwks(force: bool = False):
    now = time.time()
    if not force and _jwks_cache["keys"] and now - _jwks_cache["fetched_at"] < _JWKS_TTL:
        return _jwks_cache["keys"]
    resp = requests.get(JWKS_URL, timeout=15)
    resp.raise_for_status()
    keys = resp.json().get("keys", [])
    if not keys:
        raise HTTPException(503, "Auth provider unavailable")
    _jwks_cache["keys"] = keys
    _jwks_cache["fetched_at"] = now
    return keys


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = auth.removeprefix("Bearer ").strip()
    if not token or token.count(".") != 2:
        raise HTTPException(401, "Invalid token format")
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": True},
            algorithms=["RS256", "ES256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.PyJWTError as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")

    header_kid = jwt.get_unverified_header(token).get("kid")
    sub = payload.get("sub")
    if not sub or not header_kid:
        raise HTTPException(401, "Invalid token claims")

    last_error: Optional[Exception] = None
    for attempt in (0, 1):
        keys = _fetch_jwks(force=attempt == 1)
        key = next((k for k in keys if k.get("kid") == header_kid), None)
        if key:
            try:
                jwt.decode(
                    token,
                    key=jwt.PyJWK(key).key,
                    algorithms=[key.get("alg", "RS256")],
                    audience="authenticated",
                    options={"verify_exp": True},
                )
                return {"id": sub, "email": payload.get("email")}
            except jwt.ExpiredSignatureError:
                raise HTTPException(401, "Token expired")
            except jwt.PyJWTError as e:
                last_error = e
                break
        last_error = HTTPException(401, "Unknown signing key")
    raise HTTPException(401, f"Token verification failed: {last_error}")
