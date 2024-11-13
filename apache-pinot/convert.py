import pandas as pd
from datetime import datetime

def fix_timestamps(file_path):
    # Read the CSV file
    df = pd.read_csv(file_path)
    
    # Convert timestamps to milliseconds (multiply by 1000)
    df['call_start_time'] = df['call_start_time'] * 1000
    df['call_end_time'] = df['call_end_time'] * 1000
    
    # Save the converted data back to CSV
    df.to_csv('fixed_call_data.csv', index=False)

# Usage
fix_timestamps('converted_call_data.csv')