import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_staff_portal_pin_rejects_empty_and_whitespace_values():
    for pin in ("", "   "):
        with pytest.raises(ValidationError):
            Settings(staff_portal_pin=pin)


def test_staff_portal_pin_is_required(monkeypatch):
    monkeypatch.delenv("STAFF_PORTAL_PIN", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_staff_portal_pin_is_trimmed():
    settings = Settings(staff_portal_pin="  local-pin  ")
    assert settings.staff_portal_pin == "local-pin"
