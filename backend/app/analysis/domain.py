from typing import Dict, Any, List
import pandas as pd

DOMAIN_DEFINITIONS = {
    "Sales & E-commerce": {
        "keywords": [
            "order", "customer", "product", "sales", "revenue", "price", "sku", 
            "discount", "quantity", "cart", "shipping", "store", "merchant", 
            "buyer", "transaction", "subtotal", "tax", "item", "unit_price"
        ],
        "recommended_metrics": ["Total Revenue", "Average Order Value", "Total Units Sold", "Profit Margin"],
        "recommended_dimensions": ["Product Category", "Customer Segment", "Sales Region", "Channel"],
        "description": "Commercial transaction and sales data tracking customers, products, volumes, and revenue."
    },
    "Financial & Accounting": {
        "keywords": [
            "balance", "expense", "debit", "credit", "asset", "liability", 
            "margin", "cash", "profit", "ebitda", "equity", "payroll", 
            "invoice", "receivable", "payable", "dividend", "budget", "fiscal", "cost"
        ],
        "recommended_metrics": ["Net Profit", "Operating Cash Flow", "Total Assets", "Expense Ratio"],
        "recommended_dimensions": ["Cost Center", "Fiscal Quarter", "Account Type", "Entity"],
        "description": "Financial accounting records monitoring revenue, expenditures, cash flows, and balance metrics."
    },
    "HR & People Analytics": {
        "keywords": [
            "employee", "salary", "tenure", "department", "attrition", 
            "turnover", "performance", "hire", "job", "bonus", "headcount", 
            "manager", "compensation", "rating", "recruitment", "role", "education"
        ],
        "recommended_metrics": ["Headcount", "Attrition Rate", "Average Salary", "Performance Score"],
        "recommended_dimensions": ["Department", "Job Level", "Tenure Group", "Office Location"],
        "description": "Human resources workforce dataset tracking employee demographics, performance, and retention."
    },
    "Marketing & Web Analytics": {
        "keywords": [
            "campaign", "clicks", "impressions", "ctr", "bounce", 
            "conversion", "lead", "visitor", "session", "channel", "ad", 
            "roi", "cac", "cpc", "subscriber", "reach", "source", "medium", "traffic"
        ],
        "recommended_metrics": ["Conversion Rate", "Click-Through Rate (CTR)", "Cost Per Acquisition", "Total Impressions"],
        "recommended_dimensions": ["Marketing Channel", "Campaign Name", "Traffic Source", "Device Type"],
        "description": "Marketing performance and user acquisition telemetry tracking traffic, funnel conversion, and CAC."
    },
    "Operations & Logistics": {
        "keywords": [
            "shipment", "inventory", "warehouse", "transit", "carrier", 
            "supplier", "stock", "delivery", "freight", "logistics", 
            "fulfillment", "dispatch", "tracking", "lead_time", "origin", "destination"
        ],
        "recommended_metrics": ["On-Time Delivery Rate", "Inventory Turnover", "Average Transit Time", "Order Lead Time"],
        "recommended_dimensions": ["Fulfillment Center", "Carrier Partner", "Route", "Supply Vendor"],
        "description": "Supply chain, inventory storage, and logistics tracking material flow, transit durations, and carriers."
    },
    "Healthcare & Clinical": {
        "keywords": [
            "patient", "diagnosis", "treatment", "admission", "dosage", 
            "hospital", "symptom", "doctor", "physician", "medication", 
            "vitals", "clinical", "bmi", "glucose", "bp", "discharge", "ward"
        ],
        "recommended_metrics": ["Average Length of Stay", "Readmission Rate", "Patient Count", "Treatment Success Rate"],
        "recommended_dimensions": ["Diagnosis Code", "Hospital Department", "Age Group", "Treatment Protocol"],
        "description": "Clinical healthcare information recording patient admissions, diagnostics, treatments, and medical outcomes."
    }
}

def detect_domain(df: pd.DataFrame, col_names: List[str] = None) -> Dict[str, Any]:
    """
    Intelligently identifies the business domain of a dataset by scanning column headers,
    text fields, and semantic patterns.
    """
    if col_names is None:
        col_names = list(df.columns)
        
    lower_cols = [str(c).lower().strip() for c in col_names]
    
    scores = {}
    matched_details = {}
    
    for domain, config in DOMAIN_DEFINITIONS.items():
        score = 0.0
        matches = []
        for kw in config["keywords"]:
            for col in lower_cols:
                if kw in col:
                    score += 1.0
                    matches.append(f"column '{col}' contains '{kw}'")
                    
        # Check text sample contents for high-confidence domain words
        sample_text_matches = 0
        for col in df.select_dtypes(include=["object", "string"]).columns[:5]:
            try:
                sample_vals = " ".join(df[col].dropna().astype(str).head(20).tolist()).lower()
                for kw in config["keywords"]:
                    if kw in sample_vals and kw not in ["tax", "cost", "role"]:
                        score += 0.5
                        sample_text_matches += 1
                        if len(matches) < 8:
                            matches.append(f"data values in '{col}' match '{kw}'")
            except Exception:
                continue
                
        scores[domain] = score
        matched_details[domain] = matches

    best_domain = max(scores, key=scores.get)
    best_score = scores[best_domain]
    
    if best_score < 1.0:
        return {
            "domain": "General Tabular",
            "confidence": 0.65,
            "matched_indicators": ["Standard multi-column tabular structure"],
            "description": "General structured tabular dataset suitable for multi-variable descriptive and statistical exploration.",
            "recommended_metrics": ["Record Count", "Average Numeric Values", "Distribution Spread"],
            "recommended_dimensions": ["Primary Categorical Groups", "Time Slices"]
        }
        
    # Calculate confidence scaled between 0.70 and 0.98
    confidence = min(0.98, round(0.70 + (best_score * 0.04), 2))
    matched_indicators = list(dict.fromkeys(matched_details[best_domain]))[:8]
    
    return {
        "domain": best_domain,
        "confidence": confidence,
        "matched_indicators": matched_indicators,
        "description": DOMAIN_DEFINITIONS[best_domain]["description"],
        "recommended_metrics": DOMAIN_DEFINITIONS[best_domain]["recommended_metrics"],
        "recommended_dimensions": DOMAIN_DEFINITIONS[best_domain]["recommended_dimensions"]
    }
