from fastapi import APIRouter
import pandas as pd
import joblib

router = APIRouter()
model = joblib.load("ml/cognitask_scheduler_model.pkl")

@router.post("/suggest-slot")
def suggest_slot(task: dict):
    sample = pd.DataFrame({
        "Category": [task["category"]],
        "Priority": [task["priority"]],
        "Duration_mins": [task["duration_mins"]],
        "Day": [task["day"]],
    })

    best_hour = model.predict(sample)[0]
    return {"best_hour": int(best_hour)}