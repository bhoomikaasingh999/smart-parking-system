import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor

def generate_mock_data(samples=5000):
    np.random.seed(42)
    
    hour_of_day = np.random.randint(0, 24, size=samples)
    day_of_week = np.random.randint(0, 7, size=samples) 
    
  
    base_occupancy = np.random.uniform(10, 40, size=samples)
    peak_hour_bonus = np.where((hour_of_day >= 9) & (hour_of_day <= 18), np.random.uniform(30, 50, size=samples), 0)
    weekend_bonus = np.where(day_of_week >= 5, np.random.uniform(10, 20, size=samples), 0)
    
    current_occupancy_percentage = np.clip(base_occupancy + peak_hour_bonus + weekend_bonus, 0, 100)
    
    
    base_price = 50
    demand_multiplier = (current_occupancy_percentage / 100) * 40  
    time_multiplier = np.where((hour_of_day >= 17) & (hour_of_day <= 21), 10, 0) 
    
    price = base_price + demand_multiplier + time_multiplier
    price = np.clip(price, 50, 100) 
    
    return pd.DataFrame({
        'hour_of_day': hour_of_day,
        'day_of_week': day_of_week,
        'current_occupancy_percentage': current_occupancy_percentage,
        'price': price
    })

print(" Mock data generation pipeline starting...")
df = generate_mock_data()

X = df[['hour_of_day', 'day_of_week', 'current_occupancy_percentage']]
y = df['price']

print("Training RandomForestRegressor model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

joblib.dump(model, 'pricing_model.pkl')
print("Model trained successfully")
