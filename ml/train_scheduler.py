# ==============================
# CogniTask ML Scheduler Module
# ==============================
# Predicts the best hour to schedule a task

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# ==============================
# STEP 1: LOAD DATA
# ==============================
def load_data(file_path="data/cognitive_load_dataset.xlsx"):
    df = pd.read_excel(file_path, sheet_name="Weekly_Task_Log")

    required_cols = [
        "Category",
        "Priority",
        "Duration_mins",
        "Day",
        "Hour_of_Day",
    ]

    df = df[required_cols].dropna()
    return df


# ==============================
# STEP 2: TRAIN MODEL
# ==============================
def train_scheduler_model(file_path="data/cognitive_load_dataset.xlsx"):
    df = load_data(file_path)

    X = df[["Category", "Priority", "Duration_mins", "Day"]]
    y = df["Hour_of_Day"]

    categorical_features = ["Category", "Priority", "Day"]
    numerical_features = ["Duration_mins"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numerical_features),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=200,
                    max_depth=10,
                    random_state=42,
                ),
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))

    joblib.dump(model, "ml/cognitask_scheduler_model.pkl")
    print("✅ Model saved at ml/cognitask_scheduler_model.pkl")

    return model


# ==============================
# STEP 3: LOAD MODEL
# ==============================
def load_model(model_path="ml/cognitask_scheduler_model.pkl"):
    return joblib.load(model_path)


# ==============================
# STEP 4: PREDICT BEST SLOT
# ==============================
def suggest_best_slot(model, category, priority, duration_mins, day):
    sample = pd.DataFrame(
        {
            "Category": [category],
            "Priority": [priority],
            "Duration_mins": [duration_mins],
            "Day": [day],
        }
    )

    predicted_hour = model.predict(sample)[0]
    return int(predicted_hour)


# ==============================
# STEP 5: RUN FILE
# ==============================
if __name__ == "__main__":
    model = train_scheduler_model()

    best_hour = suggest_best_slot(
        model,
        category="Deep Work",
        priority="High",
        duration_mins=90,
        day="Monday",
    )

    print(f"✨ Suggested slot: {best_hour}:00")
