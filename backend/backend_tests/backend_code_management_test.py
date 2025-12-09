"""Tests for code_management.py functions"""

import re
from backend.app.code_management import generate_new_access_code, is_code_expired, activate_code
from backend.app.models import AccessCode
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta


def test_access_code_structure():
    code = generate_new_access_code(valid_for_months=30)

    assert len(code.code) == 19

    pattern = r"^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}(-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}){3}$"
    assert re.match(pattern, code.code)


@patch('backend.app.code_management.generate')
def test_access_code_logic(mock_generate):
    mock_generate.return_value = "AAAA"

    code = generate_new_access_code(valid_for_months=30)

    assert code.code == "AAAA-AAAA-AAAA-AAAA"
    assert mock_generate.call_count == 4


def test_generate_new_access_code_6_months():
    now = datetime.now(timezone.utc)
    code = generate_new_access_code(valid_for_months=6)

    pattern = r"^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}(-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}){3}$"
    assert re.match(pattern, code.code)

    assert abs(now - code.creationTime) < timedelta(seconds=2)

    expected_expiration_time = now + relativedelta(months=6)
    assert abs(
        expected_expiration_time -
        code.expirationTime) < timedelta(
        seconds=2)

    assert code.activationTime is None
    assert code.isUsed == False
    assert code.usedByUser is None


def test_check_expired_code():
    now = datetime.now(timezone.utc)
    mock_code = AccessCode(
        code="AAAA-AAAA-AAAA-AAAA",
        creationTime=now - relativedelta(months=8),
        expirationTime=now - relativedelta(months=1),
        activationTime=now - relativedelta(months=7),
        isUsed=True,
        usedByUser="test@testly.com"
    )

    is_expired = is_code_expired(mock_code.expirationTime)

    assert is_expired


def test_check_still_active_code():
    now = datetime.now(timezone.utc)
    mock_code = AccessCode(
        code="AAAA-AAAA-AAAA-AAAA",
        creationTime=now - relativedelta(months=2),
        expirationTime=now + relativedelta(months=4),
        activationTime=now - relativedelta(months=1),
        isUsed=True,
        usedByUser="test@testly.com"
    )

    is_expired = is_code_expired(mock_code.expirationTime)

    assert is_expired == False


def test_no_timezone_on_expiration_time():
    now = datetime.now()
    mock_code = AccessCode(
        code="AAAA-AAAA-AAAA-AAAA",
        creationTime=now - relativedelta(months=2),
        expirationTime=now + relativedelta(months=4),
        activationTime=now - relativedelta(months=1),
        isUsed=True,
        usedByUser="test@testly.com"
    )

    is_expired = is_code_expired(mock_code.expirationTime)

    assert is_expired == False


def test_activating_unused_code():
    now = datetime.now(timezone.utc)
    mock_code = AccessCode(
        code="AAAA-AAAA-AAAA-AAAA",
        creationTime=now - relativedelta(months=2),
        expirationTime=now + relativedelta(months=4)
    )

    activated_code = activate_code(mock_code.model_dump(), "test@testly.com")

    expeted_code = AccessCode(
        code="AAAA-AAAA-AAAA-AAAA",
        creationTime=now - relativedelta(months=2),
        expirationTime=now + relativedelta(months=4),
        activationTime=now,
        isUsed=True,
        usedByUser="test@testly.com"
    )

    assert activated_code.code, expeted_code.code

    assert abs(
        activated_code.creationTime -
        expeted_code.creationTime) < timedelta(
        seconds=2)

    assert abs(
        activated_code.expirationTime -
        expeted_code.expirationTime) < timedelta(
        seconds=2)

    assert abs(
        activated_code.activationTime -
        expeted_code.activationTime) < timedelta(
        seconds=2)

    assert activated_code.isUsed == True
    assert activated_code.usedByUser == "test@testly.com"
