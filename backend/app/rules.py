SEATBELT_UNFASTENED = "unfastened"
IDLE_THRESHOLD_MIN = 5

SEVERITY_CRITICAL = "critical"
SEVERITY_WARNING = "warning"
SEVERITY_CLEAR = "clear"

def check_seatbelt(telemetry_row: dict) -> dict:
    if telemetry_row.get("seatbelt_status") == SEATBELT_UNFASTENED:
        return {"triggered": True, "severity": SEVERITY_CRITICAL, "message": "Seatbelt is unfastened"}
    return {"triggered": False, "severity": SEVERITY_CLEAR, "message": "Seatbelt fastened"}

def check_proximity(telemetry_row: dict) -> dict:
    # Handle truthy value or actual boolean True
    if telemetry_row.get("proximity_alert") in [True, "true", "True", 1, "1"]:
        return {"triggered": True, "severity": SEVERITY_CRITICAL, "message": "Proximity hazard detected"}
    return {"triggered": False, "severity": SEVERITY_CLEAR, "message": "No proximity hazards"}

def evaluate_safety(telemetry_row: dict) -> dict:
    seatbelt = check_seatbelt(telemetry_row)
    proximity = check_proximity(telemetry_row)
    
    triggers = []
    if seatbelt["triggered"]:
        triggers.append(seatbelt["message"])
    if proximity["triggered"]:
        triggers.append(proximity["message"])
        
    if triggers:
        return {
            "triggered": True, 
            "severity": SEVERITY_CRITICAL, 
            "message": " | ".join(triggers)
        }
    
    return {"triggered": False, "severity": SEVERITY_CLEAR, "message": "All clear"}
