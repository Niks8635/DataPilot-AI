import ast
import re
import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from typing import Dict, Any, Tuple, Optional, List
import pandas as pd
import numpy as np
from app.ai.provider import llm_provider
from app.core.config import settings

FORBIDDEN_NODES = (
    ast.Import,
    ast.ImportFrom,
    ast.Delete,
    ast.Global,
    ast.Nonlocal,
    ast.AsyncFunctionDef,
    ast.AsyncFor,
    ast.AsyncWith,
)

FORBIDDEN_NAMES = {
    "open", "eval", "exec", "compile", "__import__", "globals", "locals",
    "vars", "dir", "getattr", "setattr", "delattr", "hasattr",
    "os", "sys", "subprocess", "shutil", "socket", "urllib", "requests", "http",
    "input", "breakpoint", "memoryview", "classmethod", "staticmethod"
}

def validate_code_safety(code_str: str) -> Tuple[bool, Optional[str]]:
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        return False, f"Syntax Error in analytical code: {str(e)}"

    for node in ast.walk(tree):
        if isinstance(node, FORBIDDEN_NODES):
            return False, f"Forbidden language construct: {type(node).__name__}"
            
        if isinstance(node, ast.Name) and node.id in FORBIDDEN_NAMES:
            return False, f"Forbidden identifier or module access: '{node.id}'"
            
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            return False, f"Private/dunder attribute access is forbidden: '{node.attr}'"
            
    return True, None

def execute_sandboxed_pandas(df: pd.DataFrame, code_str: str, timeout_seconds: int = 5) -> Tuple[Any, Optional[str]]:
    is_safe, error_msg = validate_code_safety(code_str)
    if not is_safe:
        return None, error_msg

    df_copy = df.copy()
    safe_globals = {
        "__builtins__": {
            "len": len, "range": range, "min": min, "max": max, "sum": sum,
            "round": round, "abs": abs, "int": int, "float": float, "str": str,
            "bool": bool, "list": list, "dict": dict, "set": set, "tuple": tuple,
            "sorted": sorted, "enumerate": enumerate, "zip": zip
        },
        "pd": pd,
        "np": np,
        "df": df_copy,
        "result": None
    }
    safe_locals = {}

    def run():
        exec(code_str, safe_globals, safe_locals)
        res = safe_locals.get("result")
        if res is None:
            res = safe_globals.get("result")
        return res

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(run)
        try:
            res = future.result(timeout=timeout_seconds)
            return res, None
        except TimeoutError:
            return None, f"Execution timed out ({timeout_seconds}s limit exceeded)"
        except Exception as e:
            return None, f"Runtime error during data operation: {str(e)}"

def resolve_contextual_references(question: str, history: Optional[List[Dict[str, Any]]], df: pd.DataFrame) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Resolves conversational pronouns and references ("it", "them", "the first one", "that category")
    by inspecting preceding conversational turns.
    """
    if not history:
        return question, None
        
    q_lower = question.lower()
    pronouns = ["the first one", "the top one", "that one", "that category", "that region", "that product", "its", "it", "them", "those"]
    has_pronoun = any(p in q_lower for p in pronouns)
    
    if not has_pronoun:
        return question, None
        
    last_assistant_turn = None
    last_user_turn = None
    for msg in reversed(history):
        if msg.get("role") == "assistant" and not last_assistant_turn:
            last_assistant_turn = msg
        elif msg.get("role") == "user" and not last_user_turn:
            last_user_turn = msg
            
    context_info = {}
    resolved_q = question
    
    if last_assistant_turn and last_assistant_turn.get("result_data"):
        data = last_assistant_turn["result_data"]
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            first_row = data[0]
            first_key = list(first_row.keys())[0]
            first_val = first_row[first_key]
            
            context_info["referenced_entity"] = {
                "column": first_key,
                "value": first_val
            }
            
            if "the first one" in q_lower or "the top one" in q_lower or "that one" in q_lower:
                resolved_q = re.sub(r"(the first one|the top one|that one)", f"'{first_val}' (where {first_key} == '{first_val}')", question, flags=re.IGNORECASE)
            elif "that category" in q_lower or "that region" in q_lower or "that product" in q_lower:
                resolved_q = re.sub(r"(that category|that region|that product)", f"'{first_val}'", question, flags=re.IGNORECASE)
            elif "its" in q_lower or "it" in q_lower:
                resolved_q = f"{question} for {first_key} '{first_val}'"
                
    return resolved_q, context_info

def check_missing_columns(question: str, df: pd.DataFrame) -> Optional[Dict[str, Any]]:
    """
    Detects if the user is inquiring about metrics or concepts completely absent from the dataset.
    """
    q_lower = question.lower()
    cols_lower = [c.lower() for c in df.columns]
    
    # Common business concepts
    concept_map = {
        "churn": ["churn", "retention", "attrition", "cancelled", "cancellation"],
        "profit margin": ["margin", "profit_margin", "profitability"],
        "bounce rate": ["bounce", "exit_rate"],
        "conversion rate": ["conversion", "converted", "funnel"],
        "employee satisfaction": ["satisfaction", "survey", "esat", "nps"],
        "inventory turnover": ["turnover", "inventory_turn", "stockout"]
    }
    
    for concept, keywords in concept_map.items():
        if any(kw in q_lower for kw in keywords):
            # Check if any matching column exists
            found = any(any(kw in c for kw in keywords) for c in cols_lower)
            if not found:
                # Concept is missing
                available_metrics = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])][:5]
                available_dims = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])][:5]
                return {
                    "missing_concept": concept,
                    "available_metrics": available_metrics,
                    "available_dimensions": available_dims,
                    "explanation": (
                        f"The current dataset does not include attributes for **{concept}**. "
                        f"Available numerical metrics: {', '.join([f'`{m}`' for m in available_metrics])}. "
                        f"Available dimensions: {', '.join([f'`{d}`' for d in available_dims])}."
                    )
                }
    return None

def process_ask_data_query(
    df: pd.DataFrame, 
    question: str, 
    history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    question_lower = question.lower().strip()
    columns_list = list(df.columns)
    
    # 1. Resolve Pronouns & Context Memory
    resolved_question, context_info = resolve_contextual_references(question, history, df)
    
    # 2. Check for Missing Concepts
    missing_info = check_missing_columns(resolved_question, df)
    if missing_info:
        available_m = missing_info["available_metrics"]
        return {
            "question": question,
            "answer_text": missing_info["explanation"],
            "confidence_score": 0.5,
            "analysis_steps": [
                {"step_number": 1, "description": "Concept & Schema Match", "operation": "VALIDATION_FAILED"},
                {"step_number": 2, "description": f"Missing concept: '{missing_info['missing_concept']}'", "operation": "SCHEMA_MISMATCH"}
            ],
            "executed_code": "# Concept not found in dataset schema\n# Query could not be executed without requested metric",
            "tabular_result": None,
            "result_columns": None,
            "chart_config": None,
            "queried_columns": [],
            "filter_explanation": f"Dataset does not contain {missing_info['missing_concept']}.",
            "calculation_details": {"error": "Missing column/attribute"},
            "suggestions": [
                f"What is the total {available_m[0]}?" if available_m else "Show preview of rows",
                f"Top 5 categories by {available_m[0]}" if available_m else "Show column types",
                "Show summary statistics"
            ]
        }

    # 3. Formulate Analysis Plan Steps
    plan_steps = [
        {"step_number": 1, "description": f"Parse intent with conversational context ({'Resolved pronoun reference' if context_info else 'Standalone query'})", "operation": "INTENT_ANALYSIS"},
        {"step_number": 2, "description": f"Target relevant schema columns from {len(columns_list)} available attributes", "operation": "SCHEMA_MATCH"},
        {"step_number": 3, "description": "Synthesize and validate sandboxed analytical logic", "operation": "CODE_SYNTHESIS"},
        {"step_number": 4, "description": "Execute in isolated runtime and generate visualization", "operation": "SANDBOX_EXECUTE"}
    ]
    
    # 4. Try LLM synthesis with conversational history
    llm_code = synthesize_code_with_llm(df, resolved_question, history)
    
    result_val = None
    exec_code = None
    error_msg = None
    queried_cols = []
    
    if llm_code:
        exec_code = llm_code
        result_val, error_msg = execute_sandboxed_pandas(df, exec_code, timeout_seconds=settings.SANDBOX_TIMEOUT_SECONDS)
        
    # 5. Deterministic fallback parser
    if result_val is None:
        exec_code, result_val, error_msg, queried_cols = fallback_analytical_parser(df, resolved_question, context_info)
        
    if not queried_cols and exec_code:
        queried_cols = [c for c in columns_list if c in exec_code]
    queried_cols = [str(c) for c in list(dict.fromkeys(queried_cols))]
        
    if result_val is None:
        return {
            "question": question,
            "answer_text": f"I couldn't complete that calculation. {error_msg or 'Please specify valid column names.'}",
            "confidence_score": 0.4,
            "analysis_steps": plan_steps,
            "executed_code": exec_code,
            "tabular_result": None,
            "result_columns": None,
            "chart_config": None,
            "queried_columns": queried_cols,
            "filter_explanation": "Execution failed or syntax invalid.",
            "calculation_details": {"error": error_msg},
            "suggestions": [
                f"Show total {columns_list[0]}" if columns_list else "Show row count",
                f"Top 5 {columns_list[1]} by {columns_list[0]}" if len(columns_list) >= 2 else "What are the columns?"
            ]
        }
        
    # 6. Format tabular result, chart config, and calculation transparency
    tabular_data, res_columns, chart_config, explanation = format_analytical_output(result_val, question, df)
    
    filter_exp = "No row-level filters applied (full population queried)."
    if context_info:
        ent = context_info["referenced_entity"]
        filter_exp = f"Filtered rows where `{ent['column']} == '{ent['value']}'` based on previous conversational turn."
    elif "head(" in str(exec_code):
        filter_exp = "Limited output to top rows based on sorting order."
        
    calc_details = {
        "logic": "Aggregated using pandas runtime",
        "queried_columns": queried_cols,
        "records_evaluated": len(df),
        "filter_applied": filter_exp
    }
    
    return {
        "question": question,
        "answer_text": explanation,
        "confidence_score": 0.95,
        "analysis_steps": plan_steps,
        "executed_code": exec_code,
        "tabular_result": tabular_data,
        "result_columns": res_columns,
        "chart_config": chart_config,
        "queried_columns": queried_cols,
        "filter_explanation": filter_exp,
        "calculation_details": calc_details,
        "suggestions": generate_followup_suggestions(df, question, tabular_data)
    }

def synthesize_code_with_llm(
    df: pd.DataFrame, 
    question: str, 
    history: Optional[List[Dict[str, Any]]] = None
) -> Optional[str]:
    system_prompt = (
        "You are an expert Python data analyst. Given a pandas DataFrame `df` and a user question, "
        "write safe pandas Python code to compute the exact answer and assign the final result to `result`.\n"
        "RULES:\n"
        "1. Write ONLY the executable code lines. No markdown, no explanations, no `import` statements.\n"
        "2. Store the final Series, DataFrame, or scalar into a variable named `result`.\n"
        "3. Allowed libraries: only operations on `df`, `pd`, and `np`.\n"
        "4. Exact available columns: " + ", ".join([f"'{c}'" for c in df.columns])
    )
    
    sample_head = df.head(3).to_dict(orient="records")
    history_context = ""
    if history:
        history_context = f"\nRecent Conversation History:\n" + "\n".join([
            f"{m['role'].upper()}: {m['content']}" for m in history[-3:]
        ]) + "\n"
        
    user_prompt = f"{history_context}Question: '{question}'\nSample data: {json.dumps(sample_head, default=str)}"
    
    code = llm_provider.generate_completion(system_prompt, user_prompt, max_tokens=300)
    if code:
        code = re.sub(r"^```python\s*", "", code.strip(), flags=re.MULTILINE)
        code = re.sub(r"^```\s*$", "", code.strip(), flags=re.MULTILINE)
        return code.strip()
    return None

def fallback_analytical_parser(
    df: pd.DataFrame, 
    question: str, 
    context_info: Optional[Dict[str, Any]] = None
) -> Tuple[Optional[str], Any, Optional[str], List[str]]:
    q = question.lower()
    cols = list(df.columns)
    
    num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(df[c]) and not pd.api.types.is_bool_dtype(df[c])]
    cat_cols = [c for c in cols if c not in num_cols]
    
    # Check if context entity filter applies
    filter_code = ""
    working_df = df
    queried = []
    if context_info and "referenced_entity" in context_info:
        ent = context_info["referenced_entity"]
        ent_col = ent["column"]
        ent_val = ent["value"]
        if ent_col in df.columns:
            working_df = df[df[ent_col].astype(str) == str(ent_val)]
            filter_code = f"filtered_df = df[df['{ent_col}'].astype(str) == '{ent_val}']\n"
            queried.append(ent_col)

    target_df_name = "filtered_df" if filter_code else "df"
    
    top_match = re.search(r"top\s+(\d+)", q)
    limit = int(top_match.group(1)) if top_match else 5
    
    is_sum = any(w in q for w in ["total", "sum", "overall", "entire"])
    is_avg = any(w in q for w in ["average", "avg", "mean"])
    is_compare = any(w in q for w in ["by", "compare", "breakdown", "per", "across", "top", "highest", "lowest", "monthly", "trend"])
    
    # 1. Total or Average of a single column
    if (is_sum or is_avg or "what is" in q) and not is_compare:
        target_num = None
        for c in num_cols:
            if c.lower() in q:
                target_num = c
                break
        if not target_num and num_cols:
            target_num = num_cols[0]
            
        if target_num:
            queried.append(target_num)
            clean_queried = [str(c) for c in list(dict.fromkeys(queried))]
            if is_avg:
                code = f"{filter_code}result = float({target_df_name}['{target_num}'].mean())"
                val = float(working_df[target_num].mean()) if len(working_df) > 0 else 0.0
                return code, val, None, clean_queried
            else:
                code = f"{filter_code}result = float({target_df_name}['{target_num}'].sum())"
                val = float(working_df[target_num].sum()) if len(working_df) > 0 else 0.0
                return code, val, None, clean_queried

    # 2. Group by comparison: Category + Numerical or Date + Numerical
    target_cat = None
    target_num = None
    
    for c in cat_cols:
        if c.lower() in q:
            target_cat = c
            break
    for c in num_cols:
        if c.lower() in q:
            target_num = c
            break
            
    if not target_cat and cat_cols:
        target_cat = cat_cols[0]
    if not target_num and num_cols:
        target_num = num_cols[0]
        
    if target_cat and target_num:
        queried.extend([target_cat, target_num])
        clean_queried = [str(c) for c in list(dict.fromkeys(queried))]
        ascending = "lowest" in q or "bottom" in q
        agg_func = "mean" if is_avg else "sum"
        code = (
            f"{filter_code}result = {target_df_name}.groupby('{target_cat}')['{target_num}']"
            f".agg('{agg_func}')"
            f".sort_values(ascending={ascending}).head({limit}).reset_index()"
        )
        res = working_df.groupby(target_cat)[target_num].agg(agg_func).sort_values(ascending=ascending).head(limit).reset_index()
        return code, res, None, clean_queried
        
    # 3. Value counts of category
    if target_cat:
        queried.append(target_cat)
        clean_queried = [str(c) for c in list(dict.fromkeys(queried))]
        code = f"{filter_code}result = {target_df_name}['{target_cat}'].value_counts().head({limit}).reset_index()"
        res = working_df[target_cat].value_counts().head(limit).reset_index()
        return code, res, None, clean_queried
        
    # 4. General fallback
    code = f"{filter_code}result = {target_df_name}.head({limit})"
    clean_queried = [str(c) for c in list(dict.fromkeys(cols[:4]))]
    return code, working_df.head(limit), None, clean_queried

def format_analytical_output(res: Any, question: str, orig_df: pd.DataFrame) -> Tuple[Optional[List[Dict[str, Any]]], Optional[List[str]], Optional[Dict[str, Any]], str]:
    if isinstance(res, (int, float, np.number)):
        val_f = float(res)
        formatted = f"${val_f:,.2f}" if any(k in question.lower() for k in ["revenue", "sales", "profit", "price", "cost"]) else f"{val_f:,.2f}"
        explanation = f"The computed result for **'{question}'** is **{formatted}**."
        return None, None, None, explanation

    if isinstance(res, pd.Series):
        res = res.reset_index()

    if isinstance(res, pd.DataFrame):
        clean_res = res.copy()
        clean_res = clean_res.where(pd.notnull(clean_res), None)
        columns = list(clean_res.columns)
        records = clean_res.to_dict(orient="records")
        
        chart_config = None
        if len(columns) == 2:
            x_col, y_col = columns[0], columns[1]
            if pd.api.types.is_numeric_dtype(res[y_col]):
                chart_config = {
                    "chart_id": f"query_chart_{x_col}",
                    "chart_type": "bar",
                    "title": f"{y_col.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}",
                    "subtitle": f"Generated for query: '{question}'",
                    "x_axis_title": x_col.replace('_', ' ').title(),
                    "y_axis_title": y_col.replace('_', ' ').title(),
                    "x_data": [str(r[x_col]) for r in records],
                    "y_data": [round(float(r[y_col]), 2) if r[y_col] is not None else 0 for r in records],
                    "series": [{"name": y_col, "data": [round(float(r[y_col]), 2) if r[y_col] is not None else 0 for r in records]}]
                }
                
        explanation = f"Found **{len(records)}** records matching your query. Here is the breakdown:"
        return records, columns, chart_config, explanation

    return None, None, None, str(res)

def generate_followup_suggestions(df: pd.DataFrame, question: str, tabular_data: Optional[List[Dict[str, Any]]] = None) -> List[str]:
    cols = list(df.columns)
    num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(df[c])]
    cat_cols = [c for c in cols if c not in num_cols]
    
    suggestions = []
    
    # Context-aware follow-ups based on the tabular data returned
    if tabular_data and len(tabular_data) > 0:
        first_row = tabular_data[0]
        first_key = list(first_row.keys())[0]
        first_val = first_row[first_key]
        suggestions.append(f"Now show monthly trend for '{first_val}'")
        suggestions.append(f"What percentage does '{first_val}' contribute?")
        
    if cat_cols and num_cols:
        suggestions.append(f"Compare {cat_cols[0]} by {num_cols[0]}")
    if len(num_cols) >= 2:
        suggestions.append(f"Show correlation between {num_cols[0]} and {num_cols[1]}")
    suggestions.append("Forecast next month's volume")
    
    return suggestions[:3]
