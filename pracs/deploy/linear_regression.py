import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.datasets import make_regression
import matplotlib.pyplot as plt
import seaborn as sns

plt.style.use('default')
sns.set_palette("husl")

X, y = make_regression(n_samples=1000, n_features=1, noise=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

lr_model = LinearRegression()
lr_model.fit(X_train, y_train)
y_pred = lr_model.predict(X_test)

mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"MSE: {mse:.4f} | RMSE: {rmse:.4f} | MAE: {mae:.4f} | R²: {r2:.4f}")

plt.figure(figsize=(12, 8))
plt.subplot(2, 2, 1)
plt.scatter(X_test, y_test, alpha=0.6, label='Actual')
plt.scatter(X_test, y_pred, alpha=0.6, label='Predicted')
plt.plot(X_test, y_pred, 'r-', linewidth=2, label='Regression Line')
plt.xlabel('Feature')
plt.ylabel('Target')
plt.title('Linear Regression: Actual vs Predicted')
plt.legend()

plt.subplot(2, 2, 2)
residuals = y_test - y_pred
plt.scatter(y_pred, residuals, alpha=0.6)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predicted Values')
plt.ylabel('Residuals')
plt.title('Residuals Plot')

plt.subplot(2, 2, 3)
plt.scatter(y_test, y_pred, alpha=0.6)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', linewidth=2)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('Actual vs Predicted Values')

plt.subplot(2, 2, 4)
plt.hist(residuals, bins=30, alpha=0.7, edgecolor='black')
plt.xlabel('Residuals')
plt.ylabel('Frequency')
plt.title('Distribution of Residuals')

plt.tight_layout()
plt.savefig('linear_regression_analysis.png', dpi=300, bbox_inches='tight')
print('Saved: linear_regression_analysis.png')

X_multi, y_multi = make_regression(n_samples=1000, n_features=3, noise=15, random_state=42)
X_train_multi, X_test_multi, y_train_multi, y_test_multi = train_test_split(X_multi, y_multi, test_size=0.3, random_state=42)

lr_multi = LinearRegression()
lr_multi.fit(X_train_multi, y_train_multi)
y_pred_multi = lr_multi.predict(X_test_multi)

mse_multi = mean_squared_error(y_test_multi, y_pred_multi)
r2_multi = r2_score(y_test_multi, y_pred_multi)

print(f"Multi-feature MSE: {mse_multi:.4f} | R²: {r2_multi:.4f}")

np.random.seed(42)
n_samples = 500
area = np.random.normal(2000, 500, n_samples)
bedrooms = np.random.randint(1, 6, n_samples)
age = np.random.uniform(0, 50, n_samples)
location_score = np.random.uniform(1, 10, n_samples)
price = (area * 150 + bedrooms * 10000 - age * 1000 + location_score * 5000 + np.random.normal(0, 20000, n_samples))

housing_data = pd.DataFrame({'Area_SqFt': area, 'Bedrooms': bedrooms, 'Age_Years': age, 'Location_Score': location_score, 'Price': price})

X_housing = housing_data[['Area_SqFt', 'Bedrooms', 'Age_Years', 'Location_Score']]
y_housing = housing_data['Price']
X_train_house, X_test_house, y_train_house, y_test_house = train_test_split(X_housing, y_housing, test_size=0.3, random_state=42)

lr_housing = LinearRegression()
lr_housing.fit(X_train_house, y_train_house)
y_pred_house = lr_housing.predict(X_test_house)

r2_house = r2_score(y_test_house, y_pred_house)
print(f"Housing R²: {r2_house:.4f}")

plt.figure(figsize=(10, 8))
correlation_data = housing_data.corr()
sns.heatmap(correlation_data, annot=True, cmap='coolwarm', center=0, square=True, linewidths=0.5)
plt.title('Housing Data Correlation Matrix')
plt.tight_layout()
plt.savefig('housing_correlation_matrix.png', dpi=300, bbox_inches='tight')
print('Saved: housing_correlation_matrix.png')
