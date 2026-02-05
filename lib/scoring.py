import sys
import pandas as pd
import json
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score, log_loss,
    mean_absolute_error, mean_squared_error
)
import numpy as np
import os

def calculate_score(sub_path, gt_path, metric):
    try:
        # Load datasets
        # Load datasets
        def load_df(path):
            p = path.lower()
            if p.endswith('.csv') or p.endswith('.csv.gz') or p.endswith('.gz'):
                return pd.read_csv(path)
            elif p.endswith('.json') or p.endswith('.json.gz'):
                return pd.read_json(path)
            return pd.read_csv(path)

        sub_df = load_df(sub_path)
        gt_df = load_df(gt_path)


        # Align on the first column (ID) and extract the target column(s)
        gt_df = gt_df.set_index(gt_df.columns[0])
        sub_df = sub_df.set_index(sub_df.columns[0])
        
        y_true = gt_df[gt_df.columns[0]].values
        y_pred = sub_df[gt_df.columns[0]].values

        score = 0.0
        m = metric.lower()

        if m == 'accuracy':
            score = accuracy_score(y_true, y_pred)
        elif m == 'f1':
            score = f1_score(y_true, y_pred, average='weighted')
        elif m == 'roc_auc':
            score = roc_auc_score(y_true, y_pred)
        elif m == 'cross_entropy':
            score = log_loss(y_true, y_pred)
        elif m == 'mae':
            score = mean_absolute_error(y_true, y_pred)
        elif m == 'mse':
            score = mean_squared_error(y_true, y_pred)
        elif m == 'rmse':
            score = np.sqrt(mean_squared_error(y_true, y_pred))
        else:
            # Default to accuracy if unknown
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
