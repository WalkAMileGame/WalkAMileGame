from nanoid import generate
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from backend.app.models import AccessCode


def generate_new_access_code(valid_for_months):
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

    part1 = generate(alphabet=alphabet, size=4)
    part2 = generate(alphabet=alphabet, size=4)
    part3 = generate(alphabet=alphabet, size=4)
    part4 = generate(alphabet=alphabet, size=4)

    code = f"{part1}-{part2}-{part3}-{part4}"
    creation_time = datetime.now(timezone.utc)
    expiration_time = creation_time + relativedelta(months=abs(valid_for_months))

    code = AccessCode(code=code, creationTime=creation_time, expirationTime=expiration_time)
    return code

def is_code_expired(expiration_time):
    now = datetime.now(timezone.utc)

    if expiration_time.tzinfo is None:
        expiration_time = expiration_time.replace(tzinfo=timezone.utc)
    
    if now > expiration_time:
        return True
    return False

def activate_code(incoming_code, user_email):
    code = AccessCode(code=incoming_code["code"],
                      creationTime=incoming_code["creationTime"],
                      expirationTime=incoming_code["expirationTime"])
    
    code.activationTime = datetime.now(timezone.utc)
    code.isUsed = True
    code.usedByUser = user_email
    return code
