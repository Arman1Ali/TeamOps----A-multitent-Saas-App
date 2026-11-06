"""Password hashing.

This module belongs to the BACKEND SECURITY layer (app/core).

Plain passwords are never stored. Each one is turned into an Argon2 hash before
it reaches the database, and the hash is what login compares against.

`pwdlib` picks the backend for us; argon2-cffi is installed (see
requirements.txt), so PasswordHash.recommended() resolves to Argon2id.
"""

from pwdlib import PasswordHash
from pwdlib.exceptions import PwdlibError

# One shared hasher for the whole application.
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Turn a plain password into the string we actually store."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """True when `password` matches the stored hash.

    Returns False instead of raising when the stored value is not a recognisable
    hash at all - which really happens, because rows created by hand during
    development hold plain text like "string". Letting that raise would turn a
    login attempt into a 500 with a stack trace.
    """
    try:
        return password_hash.verify(password, hashed_password)
    except PwdlibError:
        # The family pwdlib puts every "this hash string makes no sense" error
        # under, so a bad stored value lands in the same place as a wrong
        # password instead of escaping as a server error.
        return False
