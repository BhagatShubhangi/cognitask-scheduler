"""Generate a large synthetic cognitive load dataset for training."""
import random
import pandas as pd

random.seed(42)

categories = ["Deep Work", "Light Work", "Meetings", "Creative", "Admin", "Exercise", "Study", "Communication"]
priorities = ["High", "Medium", "Low"]
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Realistic patterns: high priority tasks tend to be done in morning peak hours
hour_distributions = {
    "High": {
        "Deep Work": [8, 9, 10, 11, 9, 10, 8, 11, 10, 9],
        "Meetings": [9, 10, 11, 14, 15, 10, 9, 11, 14, 15],
        "Study": [8, 9, 10, 11, 8, 9, 10, 16, 17, 9],
        "Creative": [9, 10, 11, 15, 16, 10, 9, 11, 10, 16],
        "default": [8, 9, 10, 11, 14, 15, 9, 10, 8, 11],
    },
    "Medium": {
        "Deep Work": [10, 11, 14, 15, 16, 11, 14, 15, 10, 16],
        "Admin": [11, 12, 13, 14, 15, 12, 13, 14, 11, 15],
        "Communication": [10, 11, 13, 14, 15, 16, 11, 13, 14, 10],
        "Creative": [11, 14, 15, 16, 17, 14, 15, 16, 11, 17],
        "default": [10, 11, 12, 13, 14, 15, 16, 11, 14, 15],
    },
    "Low": {
        "Light Work": [14, 15, 16, 17, 18, 19, 15, 16, 17, 18],
        "Admin": [13, 14, 15, 16, 17, 18, 14, 15, 16, 17],
        "Exercise": [17, 18, 19, 20, 7, 8, 18, 19, 17, 20],
        "Communication": [15, 16, 17, 18, 19, 16, 17, 18, 15, 19],
        "default": [14, 15, 16, 17, 18, 19, 20, 15, 16, 17],
    },
}

duration_ranges = {
    "Deep Work": (60, 180),
    "Light Work": (15, 60),
    "Meetings": (30, 90),
    "Creative": (45, 150),
    "Admin": (15, 60),
    "Exercise": (30, 90),
    "Study": (45, 120),
    "Communication": (10, 45),
}

rows = []
for _ in range(5000):
    cat = random.choice(categories)
    pri = random.choice(priorities)
    day = random.choice(days)
    
    # Get hour from distribution with some noise
    dist = hour_distributions[pri].get(cat, hour_distributions[pri]["default"])
    base_hour = random.choice(dist)
    # Add small noise
    hour = max(8, min(22, base_hour + random.choice([-1, 0, 0, 0, 1])))
    
    dur_min, dur_max = duration_ranges[cat]
    duration = random.randint(dur_min, dur_max)
    
    # Weekend patterns shift slightly later
    if day in ["Saturday", "Sunday"]:
        hour = max(8, min(22, hour + random.choice([0, 1, 1, 2])))
    
    rows.append({
        "Category": cat,
        "Priority": pri,
        "Duration_mins": duration,
        "Day": day,
        "Hour_of_Day": hour,
    })

df = pd.DataFrame(rows)
df.to_excel("data/cognitive_load_dataset.xlsx", sheet_name="Weekly_Task_Log", index=False)
print(f"✅ Generated {len(df)} rows → data/cognitive_load_dataset.xlsx")
print(df.describe())
print("\nSample:")
print(df.head(10))
