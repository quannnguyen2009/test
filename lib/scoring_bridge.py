import sys
import pandas as pd
import numpy as np
import json
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score, log_loss,
    mean_absolute_error, mean_squared_error
)

def calculate_score(sub_path, gt_path, metric):
    try:
        # Read CSV files
        sub_df = pd.read_csv(sub_path)
        gt_df = pd.read_csv(gt_path)

        # Align on the first column (ID) and extract the target column(s)
        gt_df = gt_df.set_index(gt_df.columns[0])
        sub_df = sub_df.set_index(sub_df.columns[0])
        
        # Ensure they have the same index
        common_idx = gt_df.index.intersection(sub_df.index)
        if len(common_idx) == 0:
            return {"error": "No common IDs found between submission and ground truth."}
            
        y_true = gt_df.loc[common_idx, gt_df.columns[0]].values
        y_pred = sub_df.loc[common_idx, gt_df.columns[0]].values

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
            score = accuracy_score(y_true, y_pred)
            
        return {"score": float(round(score, 6))}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
        
    sub_path = sys.argv[1]
    gt_path = sys.argv[2]
    metric = sys.argv[3]
    
    result = calculate_score(sub_path, gt_path, metric)
    print(json.dumps(result))
