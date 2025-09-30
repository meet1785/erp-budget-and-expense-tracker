import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.datasets import make_classification, load_iris
import matplotlib.pyplot as plt
import seaborn as sns

X, y = make_classification(n_samples=1000, n_features=4, n_informative=3, n_redundant=1, n_clusters_per_class=1, random_state=42)
feature_names = ['Feature_1', 'Feature_2', 'Feature_3', 'Feature_4']
class_names = ['Class_0', 'Class_1']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

dt_classifier = DecisionTreeClassifier(max_depth=5, min_samples_split=20, min_samples_leaf=10, random_state=42)
dt_classifier.fit(X_train, y_train)
y_pred = dt_classifier.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")
print("\n" + classification_report(y_test, y_pred, target_names=class_names))

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
plt.title('Confusion Matrix - Decision Tree Classifier')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('decision_tree_confusion_matrix.png', dpi=300, bbox_inches='tight')
print('Saved: decision_tree_confusion_matrix.png')

feature_importance = dt_classifier.feature_importances_
plt.figure(figsize=(10, 6))
plt.bar(feature_names, feature_importance)
plt.title('Feature Importance - Decision Tree Classifier')
plt.xlabel('Features')
plt.ylabel('Importance')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('decision_tree_feature_importance.png', dpi=300, bbox_inches='tight')
print('Saved: decision_tree_feature_importance.png')

plt.figure(figsize=(20, 10))
plot_tree(dt_classifier, max_depth=3, feature_names=feature_names, class_names=class_names, filled=True, rounded=True, fontsize=10)
plt.title('Decision Tree Structure (First 3 Levels)')
plt.tight_layout()
plt.savefig('decision_tree_structure.png', dpi=300, bbox_inches='tight')
print('Saved: decision_tree_structure.png')

iris = load_iris()
X_iris = iris.data
y_iris = iris.target
X_train_iris, X_test_iris, y_train_iris, y_test_iris = train_test_split(X_iris, y_iris, test_size=0.3, random_state=42)

dt_iris = DecisionTreeClassifier(max_depth=4, random_state=42)
dt_iris.fit(X_train_iris, y_train_iris)
y_pred_iris = dt_iris.predict(X_test_iris)

accuracy_iris = accuracy_score(y_test_iris, y_pred_iris)
print(f"\nIris Accuracy: {accuracy_iris:.4f}")
