"""Generate a large synthetic cognitive load dataset with clearer patterns."""
import random
import pandas as pd

random.seed(42)

categories = ["Deep Work", "Light Work", "Meetings", "Creative", "Admin", "Exercise", "Study", "Communication"]
priorities = ["High", "Medium", "Low"]
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Strong, clear patterns for each priority+category combo
# High priority → morning peak (8-11)
# Medium priority → midday (11-15)  
# Low priority → afternoon/evening (15-20)
hour_distributions = {
    ("High", "Deep Work"):     [8, 8, 9, 9, 9, 10, 10, 10, 11, 11],
    ("High", "Study"):         [8, 8, 9, 9, 9, 10, 10, 10, 11, 11],
    ("High", "Creative"):      [9, 9, 9, 10, 10, 10, 10, 11, 11, 11],
    ("High", "Meetings"):      [9, 9, 10, 10, 10, 10, 11, 11, 11, 14],
    ("High", "Admin"):         [8, 9, 9, 9, 10, 10, 10, 10, 11, 11],
    ("High", "Exercise"):      [8, 8, 8, 8, 9, 9, 17, 17, 18, 18],
    ("High", "Communication"): [9, 9, 10, 10, 10, 10, 11, 11, 11, 14],
    ("High", "Light Work"):    [8, 9, 9, 10, 10, 10, 11, 11, 11, 11],
    
    ("Medium", "Deep Work"):     [11, 11, 12, 12, 13, 13, 14, 14, 14, 15],
    ("Medium", "Study"):         [11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    ("Medium", "Creative"):      [11, 12, 12, 13, 13, 14, 14, 14, 15, 15],
    ("Medium", "Meetings"):      [11, 12, 12, 13, 13, 14, 14, 14, 15, 15],
    ("Medium", "Admin"):         [11, 12, 12, 13, 13, 13, 14, 14, 14, 15],
    ("Medium", "Exercise"):      [12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
    ("Medium", "Communication"): [11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    ("Medium", "Light Work"):    [11, 12, 12, 13, 13, 14, 14, 14, 15, 15],
    
    ("Low", "Deep Work"):     [15, 15, 16, 16, 16, 17, 17, 17, 18, 18],
    ("Low", "Study"):         [15, 16, 16, 16, 17, 17, 17, 18, 18, 19],
    ("Low", "Creative"):      [15, 16, 16, 16, 17, 17, 17, 18, 18, 19],
    ("Low", "Meetings"):      [14, 15, 15, 16, 16, 16, 17, 17, 17, 18],
    ("Low", "Admin"):         [15, 15, 16, 16, 16, 17, 17, 17, 18, 18],
    ("Low", "Exercise"):      [17, 17, 18, 18, 18, 19, 19, 19, 20, 20],
    ("Low", "Communication"): [15, 16, 16, 16, 17, 17, 17, 18, 18, 19],
    ("Low", "Light Work"):    [15, 16, 16, 17, 17, 17, 18, 18, 19, 19],
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
for _ in range(8000):
    cat = random.choice(categories)
    pri = random.choice(priorities)
    day = random.choice(days)
    
    key = (pri, cat)
    dist = hour_distributions[key]
    hour = random.choice(dist)
    
    # Minimal noise — only ±1 with low probability
    if random.random() < 0.15:
        hour = max(8, min(22, hour + random.choice([-1, 1])))
    
    dur_min, dur_max = duration_ranges[cat]
    duration = random.randint(dur_min, dur_max)
    
    rows.append({
        "Category": cat,
        "Priority": pri,
        "Duration_mins": duration,
        "Day": day,
        "Hour_of_Day": hour,
    })

df = pd.DataFrame(rows)
df.to_excel("data/cognitive_load_dataset.xlsx", sheet_name="Weekly_Task_Log", index=False)
print(f"✅ Generated {len(df)} rows")
print(f"\nHour distribution by priority:")
for p in priorities:
    subset = df[df["Priority"] == p]["Hour_of_Day"]
    print(f"  {p}: mean={subset.mean():.1f}, mode={subset.mode().values[0]}")
