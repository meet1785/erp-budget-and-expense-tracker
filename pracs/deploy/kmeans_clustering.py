import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

X, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.8, random_state=42, n_features=2)

plt.figure(figsize=(15, 10))

plt.subplot(2, 3, 1)
plt.scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.7)
plt.title('Original Data with True Clusters')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.colorbar()

kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
y_pred = kmeans.fit_predict(X)
centers = kmeans.cluster_centers_

plt.subplot(2, 3, 2)
plt.scatter(X[:, 0], X[:, 1], c=y_pred, cmap='viridis', alpha=0.7)
plt.scatter(centers[:, 0], centers[:, 1], c='red', marker='x', s=200, linewidths=3, label='Centroids')
plt.title('K-Means Clustering Results')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.legend()
plt.colorbar()

silhouette_avg = silhouette_score(X, y_pred)
print(f"Silhouette Score: {silhouette_avg:.4f}")

k_range = range(1, 11)
inertias = []
silhouette_scores = []

for k in k_range:
    kmeans_temp = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans_temp.fit(X)
    inertias.append(kmeans_temp.inertia_)
    if k > 1:
        sil_score = silhouette_score(X, kmeans_temp.labels_)
        silhouette_scores.append(sil_score)
    else:
        silhouette_scores.append(0)

plt.subplot(2, 3, 3)
plt.plot(k_range, inertias, 'bo-')
plt.xlabel('Number of Clusters (k)')
plt.ylabel('Inertia')
plt.title('Elbow Method for Optimal k')
plt.grid(True)

plt.subplot(2, 3, 4)
plt.plot(k_range, silhouette_scores, 'ro-')
plt.xlabel('Number of Clusters (k)')
plt.ylabel('Silhouette Score')
plt.title('Silhouette Score vs Number of Clusters')
plt.grid(True)

np.random.seed(42)
n_customers = 1000
age = np.random.normal(40, 15, n_customers)
annual_income = np.random.normal(50000, 20000, n_customers)
spending_score = np.random.uniform(1, 100, n_customers)
purchase_frequency = np.random.poisson(12, n_customers)

customer_data = pd.DataFrame({'Age': age, 'Annual_Income': annual_income, 'Spending_Score': spending_score, 'Purchase_Frequency': purchase_frequency})
customer_data = customer_data[(customer_data['Age'] > 18) & (customer_data['Age'] < 80)]
customer_data = customer_data[customer_data['Annual_Income'] > 20000]
customer_data = customer_data[customer_data['Purchase_Frequency'] > 0]

customer_scaled = StandardScaler().fit_transform(customer_data)

k_range_customer = range(2, 9)
silhouette_customer = []

for k in k_range_customer:
    kmeans_temp = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans_temp.fit(customer_scaled)
    silhouette_customer.append(silhouette_score(customer_scaled, kmeans_temp.labels_))

optimal_k_customer = k_range_customer[np.argmax(silhouette_customer)]
kmeans_customer = KMeans(n_clusters=optimal_k_customer, random_state=42, n_init=10)
customer_clusters = kmeans_customer.fit_predict(customer_scaled)
customer_data['Cluster'] = customer_clusters

plt.subplot(2, 3, 6)
scatter = plt.scatter(customer_data['Annual_Income'], customer_data['Spending_Score'], c=customer_clusters, cmap='viridis', alpha=0.7)
plt.xlabel('Annual Income')
plt.ylabel('Spending Score')
plt.title('Customer Segmentation')
plt.colorbar(scatter)

plt.tight_layout()
plt.savefig('kmeans_clustering_analysis.png', dpi=300, bbox_inches='tight')
print('Saved: kmeans_clustering_analysis.png')
