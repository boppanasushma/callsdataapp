import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_call_data(num_records=1000):
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate sample data
    current_date = datetime.now()
    data = {
        'row_id': range(1, num_records + 1),
        'call_id': [f'CALL_{i:06d}' for i in range(1, num_records + 1)],
        'agent_id': [f'AGT_{random.randint(1, 50):03d}' for _ in range(num_records)],
        'call_start_time': [
            current_date - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            ) for _ in range(num_records)
        ]
    }
    
    # Generate end times and duration
    data['call_end_time'] = [
        start + timedelta(minutes=random.randint(1, 60))
        for start in data['call_start_time']
    ]
    
    data['duration'] = [
        (end - start).total_seconds() / 60
        for start, end in zip(data['call_start_time'], data['call_end_time'])
    ]
    
    data['department_id'] = [random.randint(1, 5) for _ in range(num_records)]
    data['company_id'] = [random.randint(1, 10) for _ in range(num_records)]
    data['call_status'] = np.random.choice(['completed', 'abandoned', 'transferred'], num_records)
    data['call_outcome'] = np.random.choice(['resolved', 'escalated', 'follow_up'], num_records)
    
    df = pd.DataFrame(data)
    df.to_csv('call_data.csv', index=False)
    return df

if __name__ == "__main__":
    generate_call_data()