from datetime import date


def diff_in_days(date_a: date | None, date_b: date) -> int:
    if not date_a:
        return 0
    
    diff = (date_b - date_a).days
    
    if diff < 0:
        return 0
    
    return diff
