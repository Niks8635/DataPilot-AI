import os
import random
from datetime import datetime, timedelta
import pandas as pd

def generate_sales_demo_df(num_rows: int = 600) -> pd.DataFrame:
    random.seed(42)
    
    categories = {
        "Technology": ["Pro Laptop 15", "Wireless Noise-Canceling Headphones", "Ultra-Wide Monitor 34", "Smartwatch Series 5", "Mechanical Keyboard"],
        "Office Supplies": ["Ergonomic Desk Chair", "Adjustable Standing Desk", "High-Yield Toner Cartridge", "Heavy-Duty Paper Shredder", "Desk Organizer Set"],
        "Electronics": ["4K Streaming Device", "Portable Bluetooth Speaker", "USB-C Multi-Port Dock", "Fast Wireless Charger", "External SSD 1TB"],
        "Furniture": ["Executive Leather Chair", "Modular Bookshelf", "Filing Cabinet with Lock", "Conference Table 8ft", "Ergonomic Footrest"]
    }
    
    regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"]
    customers = [
        "Apex Global Corp", "Vertex Industries", "Starlight Systems", "Nexus Logistics",
        "Horizon Media", "Pinnacle Capital", "BlueWave Solutions", "Solstice Health",
        "Quantum Dynamics", "Vanguard Retail", "Eclipse Networks", "Aurora BioTech"
    ]
    
    unit_price_ranges = {
        "Technology": (120.0, 1850.0),
        "Office Supplies": (25.0, 450.0),
        "Electronics": (35.0, 320.0),
        "Furniture": (80.0, 950.0)
    }
    
    start_date = datetime(2023, 1, 15)
    
    rows = []
    for i in range(1, num_rows + 1):
        order_id = f"ORD-{2023000 + i}"
        days_offset = random.randint(0, 365)
        order_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        category = random.choice(list(categories.keys()))
        product = random.choice(categories[category])
        customer = random.choice(customers)
        region = random.choice(regions)
        quantity = random.randint(1, 15)
        
        price_min, price_max = unit_price_ranges[category]
        unit_price = round(random.uniform(price_min, price_max), 2)
        revenue = round(quantity * unit_price, 2)
        cost_margin = random.uniform(0.55, 0.82)
        cost = round(revenue * cost_margin, 2)
        profit = round(revenue - cost, 2)
        
        rows.append({
            "Order_ID": order_id,
            "Order_Date": order_date,
            "Customer": customer,
            "Product": product,
            "Category": category,
            "Region": region,
            "Quantity": quantity,
            "Unit_Price": unit_price,
            "Revenue": revenue,
            "Cost": cost,
            "Profit": profit
        })
        
    df = pd.DataFrame(rows)
    
    # Intentionally insert a few realistic duplicates and missing values to demonstrate data quality and cleaning
    # 5 duplicate rows
    duplicate_rows = df.iloc[:5].copy()
    df = pd.concat([df, duplicate_rows], ignore_index=True)
    
    # A few missing values in Region, Quantity, and Profit
    for idx in [12, 45, 88, 120]:
        if idx < len(df):
            df.loc[idx, "Region"] = None
    for idx in [23, 67, 105]:
        if idx < len(df):
            df.loc[idx, "Quantity"] = None
    for idx in [34, 150]:
        if idx < len(df):
            df.loc[idx, "Profit"] = None
            
    return df

def ensure_demo_dataset_file(target_path: str) -> str:
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    if not os.path.exists(target_path):
        df = generate_sales_demo_df()
        df.to_csv(target_path, index=False)
    return target_path
