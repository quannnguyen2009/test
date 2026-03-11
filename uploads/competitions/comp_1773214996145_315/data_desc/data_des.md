# 📊 Data Description

This competition uses a dataset of **handwritten digit images** derived from the classic MNIST dataset.  
Each image represents a single digit from **0 to 9**, converted into a numeric feature vector.

---

## 📁 Files

### `train.csv`
The training dataset containing labeled examples.

- **Rows**: One row per image
- **Columns**:
  - `label`: The true digit (0–9)
  - `pixel0` to `pixel783`: Pixel intensity values

Total columns:
\[
1 + 28 \times 28 = 785
\]

---

### `test.csv`
The test dataset used for submission.

- Same structure as `train.csv`
- **Does not include the `label` column**
- Models must predict the digit for each row

---

## 🖼 Image Representation

Each image is a **28 × 28 grayscale image**, flattened row-wise into a vector:

\[
\mathbf{x} = (x_1, x_2, \dots, x_{784}) \in \mathbb{R}^{784}
\]

Where:
- Each \( x_i \) represents a pixel intensity
- Pixel values range from:
\[
x_i \in \{0, 1, 2, \dots, 255\}
\]

---

## 🧾 Labels

The target label represents the digit shown in the image:

\[
y \in \{0, 1, 2, \dots, 9\}
\]

For many models, labels may be converted into a one-hot encoded vector:

\[
\mathbf{y} \in \{0,1\}^{10}
\]

---

## 🔢 Feature Scaling

Pixel intensities may be normalized before training:

\[
x_i^{\text{norm}} = \frac{x_i}{255}
\]

This rescales feature values to the range:

\[
x_i^{\text{norm}} \in [0,1]
\]

---

## 📈 Data Distribution

- Each class (digit) appears multiple times
- The dataset is **approximately balanced** across all digits
- Some digits (e.g. 1 and 7) may appear more frequently due to handwriting patterns

Let \( N_k \) denote the number of samples for digit \( k \).  
Then the empirical class probability is:

\[
P(y = k) = \frac{N_k}{N}
\]

---

## ⚠️ Notes and Considerations

- Images are **centered but not perfectly aligned**
- Some digits may be ambiguous even for humans
- Noise and stroke variations are part of the dataset by design

---

## 🛠 Suggested Preprocessing Steps

- Normalize pixel values
- Optionally reshape vectors back to:
\[
28 \times 28
\]
- Apply data augmentation if using deep learning models

---

## 📌 Summary

| Component | Description |
|---------|-------------|
| Image size | 28 × 28 |
| Channels | 1 (grayscale) |
| Classes | 10 (digits 0–9) |
| Features | 784 pixels |
| Label type | Multiclass |

This dataset is ideal for experimenting with both **classical machine learning** and **deep learning** approaches.