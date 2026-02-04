from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score, log_loss,
    mean_absolute_error, mean_squared_error
)

app = Flask(__name__)
CORS(app)

def calculate_score(sub_url, gt_url, metric):
    try:
        # pandas can read directly from URLs
        sub_df = pd.read_csv(sub_url)
        gt_df = pd.read_csv(gt_url)

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
            score = accuracy_score(y_true, y_pred)
            
        return {"score": float(round(score, 6))}

    except Exception as e:
        return {"error": str(e)}

@app.route('/api/score', methods=['POST'])
def score():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    sub_url = data.get('sub_url')
    gt_url = data.get('gt_url')
    metric = data.get('metric', 'accuracy')

    if not sub_url or not gt_url:
        return jsonify({"error": "Missing sub_url or gt_url"}), 400

    result = calculate_score(sub_url, gt_url, metric)
    return jsonify(result)

# Vercel requirements
if __name__ == "__main__":
    app.run()
