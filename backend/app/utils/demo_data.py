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

def generate_saas_churn_demo_df(num_rows: int = 450) -> pd.DataFrame:
    random.seed(84)
    plans = [
        ("Starter", 99.0, 299.0, 3, 15),
        ("Growth", 499.0, 999.0, 10, 45),
        ("Enterprise", 1499.0, 3500.0, 35, 120),
        ("Dedicated Scale", 4000.0, 8500.0, 80, 250)
    ]
    freqs = ["Daily", "Weekly", "Bi-Weekly", "Monthly"]
    payments = ["Credit Card", "ACH Wire", "Annual Invoice"]
    
    start_date = datetime(2022, 6, 1)
    rows = []
    
    for i in range(1, num_rows + 1):
        acc_id = f"ACC-{4000 + i}"
        days_offset = random.randint(0, 500)
        signup_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        plan_name, min_mrr, max_mrr, min_seats, max_seats = random.choice(plans)
        mrr = round(random.uniform(min_mrr, max_mrr), 2)
        seats = random.randint(min_seats, max_seats)
        usage = random.choice(freqs)
        tickets = random.randint(0, 10)
        nps = random.randint(4, 10)
        payment = random.choice(payments)
        
        # Churn risk formula
        risk = 0.10
        if tickets > 4:
            risk += 0.35
        if nps < 7:
            risk += 0.25
        if plan_name == "Starter":
            risk += 0.15
        risk = round(min(0.95, max(0.03, risk + random.uniform(-0.05, 0.05))), 2)
        
        status = "Active"
        if risk > 0.65:
            status = "At-Risk"
        if risk > 0.85 and random.random() > 0.3:
            status = "Churned"
            
        rows.append({
            "Account_ID": acc_id,
            "Signup_Date": signup_date,
            "Subscription_Plan": plan_name,
            "MRR": mrr,
            "Active_Seats": seats,
            "Usage_Frequency": usage,
            "Support_Tickets": tickets,
            "NPS_Score": nps,
            "Payment_Method": payment,
            "Churn_Risk_Score": risk,
            "Account_Status": status
        })
        
    df = pd.DataFrame(rows)
    # Realistic missing values in NPS_Score
    for idx in [8, 22, 64, 110, 180]:
        if idx < len(df):
            df.loc[idx, "NPS_Score"] = None
    return df

def generate_clinical_demo_df(num_rows: int = 350) -> pd.DataFrame:
    random.seed(126)
    cohorts = ["Cohort A (Dosage 50mg)", "Cohort B (Dosage 100mg)", "Placebo Control"]
    genders = ["Female", "Male", "Other"]
    adverse_events = ["None", "None", "None", "Mild Fatigue", "Headache", "Nausea"]
    
    start_date = datetime(2023, 2, 1)
    rows = []
    
    for i in range(1, num_rows + 1):
        pat_id = f"PAT-{7000 + i}"
        days_offset = random.randint(0, 240)
        admit_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        age = random.randint(22, 82)
        gender = random.choice(genders)
        cohort = random.choice(cohorts)
        systolic = round(random.gauss(132, 16))
        diastolic = round(random.gauss(82, 10))
        cholesterol = round(random.gauss(195, 30))
        bmi = round(random.uniform(19.5, 35.5), 1)
        
        if "100mg" in cohort:
            efficacy = round(min(99.5, max(45.0, random.gauss(84.0, 10.0))), 1)
            adverse = random.choice(adverse_events)
        elif "50mg" in cohort:
            efficacy = round(min(95.0, max(30.0, random.gauss(62.0, 12.0))), 1)
            adverse = random.choice(adverse_events)
        else:
            efficacy = round(min(65.0, max(10.0, random.gauss(26.0, 12.0))), 1)
            adverse = "None"
            
        outcome = "Stable Control"
        if efficacy >= 75.0:
            outcome = "Significant Improvement"
        elif efficacy >= 50.0:
            outcome = "Moderate Response"
            
        rows.append({
            "Patient_ID": pat_id,
            "Admission_Date": admit_date,
            "Age": age,
            "Gender": gender,
            "Treatment_Cohort": cohort,
            "Systolic_BP": systolic,
            "Diastolic_BP": diastolic,
            "Cholesterol_mg_dL": cholesterol,
            "BMI": bmi,
            "Efficacy_Score": efficacy,
            "Adverse_Event": adverse,
            "Outcome_Status": outcome
        })
        
    df = pd.DataFrame(rows)
    for idx in [15, 78]:
        if idx < len(df):
            df.loc[idx, "BMI"] = None
    return df

def ensure_demo_dataset_file(target_path: str) -> str:
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    if not os.path.exists(target_path):
        df = generate_sales_demo_df()
        df.to_csv(target_path, index=False)
    return target_path
