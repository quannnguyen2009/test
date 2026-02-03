import sys
import pandas as pd
import json
from sklearn.metrics import (
    accuracy_score, f1_score, mean_absolute_error, mean_squared_error, 
    r2_score, precision_score, recall_score, balanced_accuracy_score,
    cohen_kappa_score, jaccard_score, mean_absolute_percentage_error,
    median_absolute_error, explained_variance_score
)
import numpy as np
import os

def calculate_score(sub_path, gt_path, metric):
    try:
        # Load datasets
        if sub_path.endswith('.csv'):
            sub_df = pd.read_csv(sub_path)
        elif sub_path.endswith('.json'):
            sub_df = pd.read_json(sub_path)
        else:
            sub_df = pd.read_csv(sub_path)

        if gt_path.endswith('.csv'):
            gt_df = pd.read_csv(gt_path)
        elif gt_path.endswith('.json'):
            gt_df = pd.read_json(gt_path)
        else:
            gt_df = pd.read_csv(gt_path)

        def get_data_series(df):
            if df.shape[1] >= 2:
                df = df.set_index(df.columns[0])
                return df[df.columns[0]]
            else:
                return df[df.columns[0]]

        sub_series = get_data_series(sub_df)
        gt_series = get_data_series(gt_df)

        common_ids = gt_series.index.intersection(sub_series.index)
        if len(common_ids) == 0:
            return {"error": "No matching IDs found."}

        y_true = gt_series.loc[common_ids].values
        y_pred = sub_series.loc[common_ids].values

        # Remove NaNs for regression
        regression_metrics = ['mae', 'mse', 'rmse', 'mape', 'r2', 'median_absolute_error', 'explained_variance']
        if metric.lower() in regression_metrics:
            mask = ~pd.isna(y_true) & ~pd.isna(y_pred)
            y_true = y_true[mask]
            y_pred = y_pred[mask]
            if len(y_true) == 0:
                return {"error": "No valid numeric data."}

        score = 0.0
        m = metric.lower()

        # Classification
        if m == 'accuracy':
            score = accuracy_score(y_true, y_pred)
        elif m == 'balanced_accuracy':
            score = balanced_accuracy_score(y_true, y_pred)
        elif m == 'f1_macro':
            score = f1_score(y_true, y_pred, average='macro', zero_division=0)
        elif m == 'f1_micro':
            score = f1_score(y_true, y_pred, average='micro', zero_division=0)
        elif m == 'f1_weighted':
            score = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        elif m == 'precision_macro':
            score = precision_score(y_true, y_pred, average='macro', zero_division=0)
        elif m == 'precision_micro':
            score = precision_score(y_true, y_pred, average='micro', zero_division=0)
        elif m == 'precision_weighted':
            score = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        elif m == 'recall_macro':
            score = recall_score(y_true, y_pred, average='macro', zero_division=0)
        elif m == 'recall_micro':
            score = recall_score(y_true, y_pred, average='micro', zero_division=0)
        elif m == 'recall_weighted':
            score = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        elif m == 'cohen_kappa':
            score = cohen_kappa_score(y_true, y_pred)
        elif m == 'jaccard_macro':
            score = jaccard_score(y_true, y_pred, average='macro', zero_division=0)
            
        # Regression
        elif m == 'mae':
            score = mean_absolute_error(y_true, y_pred)
        elif m == 'mse':
            score = mean_squared_error(y_true, y_pred)
        elif m == 'rmse':
            score = np.sqrt(mean_squared_error(y_true, y_pred))
        elif m == 'r2':
            score = r2_score(y_true, y_pred)
        elif m == 'mape':
            score = mean_absolute_percentage_error(y_true, y_pred)
        elif m == 'median_absolute_error':
            score = median_absolute_error(y_true, y_pred)
        elif m == 'explained_variance':
            score = explained_variance_score(y_true, y_pred)
        else:
            score = accuracy_score(y_true, y_pred)

        return {"score": float(round(score, 6))}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    sub = sys.argv[1]
    gt = sys.argv[2]
    met = sys.argv[3]

    result = calculate_score(sub, gt, met)
    print(json.dumps(result))
