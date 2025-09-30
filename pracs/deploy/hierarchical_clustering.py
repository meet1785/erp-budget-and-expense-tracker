import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering
from sklearn.datasets import make_blobs
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.cluster.hierarchy import dendrogram, linkage

X, y_true = make_blobs(n_samples=150, centers=4, cluster_std=1.0, random_state=42, n_features=2)

plt.figure(figsize=(18, 12))

plt.subplot(3, 4, 1)
plt.scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.7)
plt.title('Original Data with True Clusters')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.colorbar()

linkage_methods = ['ward', 'complete', 'average', 'single']
n_clusters = 4

for i, method in enumerate(linkage_methods):
    agg_clustering = AgglomerativeClustering(n_clusters=n_clusters, linkage=method)
    y_pred = agg_clustering.fit_predict(X)
    sil_score = silhouette_score(X, y_pred)
    print(f"{method} - Silhouette: {sil_score:.4f}")
    
    plt.subplot(3, 4, i + 2)
    plt.scatter(X[:, 0], X[:, 1], c=y_pred, cmap='viridis', alpha=0.7)
    plt.title(f'{method.capitalize()} Linkage\nSil: {sil_score:.3f}')
    plt.xlabel('Feature 1')
    plt.ylabel('Feature 2')

X_small, y_small = make_blobs(n_samples=50, centers=3, cluster_std=0.8, random_state=42, n_features=2)
linkage_matrix = linkage(X_small, method='ward')

plt.subplot(3, 4, 6)
dendrogram(linkage_matrix, truncate_mode='level', p=5)
plt.title('Dendrogram (Ward Linkage)')
plt.xlabel('Sample Index or (Cluster Size)')
plt.ylabel('Distance')

np.random.seed(42)
n_customers = 200
age = np.random.normal(40, 12, n_customers)
income = np.random.normal(50000, 15000, n_customers)
spending = np.random.uniform(20, 100, n_customers)
loyalty_years = np.random.exponential(3, n_customers)

customer_data = pd.DataFrame({'Age': age, 'Income': income, 'Spending_Score': spending, 'Loyalty_Years': loyalty_years})
customer_data = customer_data[(customer_data['Age'] > 18) & (customer_data['Age'] < 70) & (customer_data['Income'] > 20000)]

scaler = StandardScaler()
customer_scaled = scaler.fit_transform(customer_data)

k_range_customer = range(2, 8)
sil_scores_customer = []

for k in k_range_customer:
    agg_customer = AgglomerativeClustering(n_clusters=k, linkage='ward')
    labels = agg_customer.fit_predict(customer_scaled)
    sil_score = silhouette_score(customer_scaled, labels)
    sil_scores_customer.append(sil_score)

optimal_k_customer = k_range_customer[np.argmax(sil_scores_customer)]
agg_customer_final = AgglomerativeClustering(n_clusters=optimal_k_customer, linkage='ward')
customer_clusters = agg_customer_final.fit_predict(customer_scaled)
customer_data['Cluster'] = customer_clusters

plt.subplot(3, 4, 10)
scatter = plt.scatter(customer_data['Income'], customer_data['Spending_Score'], c=customer_clusters, cmap='viridis', alpha=0.7)
plt.xlabel('Income')
plt.ylabel('Spending Score')
plt.title('Customer Segments')
plt.colorbar(scatter)

plt.tight_layout()
plt.savefig('hierarchical_clustering_analysis.png', dpi=300, bbox_inches='tight')
print('Saved: hierarchical_clustering_analysis.png')

plt.figure(figsize=(15, 8))
linkage_full = linkage(customer_scaled, method='ward')

plt.subplot(1, 2, 1)
dendrogram(linkage_full, truncate_mode='level', p=6)
plt.title('Complete Customer Dendrogram (Ward Linkage)')
plt.xlabel('Customer Index or (Cluster Size)')
plt.ylabel('Distance')

plt.subplot(1, 2, 2)
dendrogram(linkage_full, orientation='left', truncate_mode='level', p=6)
plt.title('Horizontal Dendrogram')
plt.xlabel('Distance')
plt.ylabel('Customer Index or (Cluster Size)')

plt.tight_layout()
plt.savefig('hierarchical_dendrograms.png', dpi=300, bbox_inches='tight')
print('Saved: hierarchical_dendrograms.png')
