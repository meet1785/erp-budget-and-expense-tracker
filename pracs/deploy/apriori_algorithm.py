import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from itertools import combinations

transactions = [
    ['Milk', 'Eggs', 'Bread', 'Cheese'],
    ['Milk', 'Eggs'],
    ['Milk', 'Bread'],
    ['Eggs', 'Bread', 'Butter'],
    ['Milk', 'Eggs', 'Bread', 'Butter', 'Cheese'],
    ['Milk', 'Eggs', 'Butter'],
    ['Eggs', 'Bread'],
    ['Milk', 'Bread', 'Butter'],
    ['Milk', 'Eggs', 'Cheese'],
    ['Bread', 'Butter']
]

class SimpleApriori:
    def __init__(self, transactions, min_support=0.3):
        self.transactions = transactions
        self.min_support = min_support
        self.n_transactions = len(transactions)
        self.min_support_count = int(min_support * self.n_transactions)
        
    def get_item_support(self, itemset):
        count = 0
        for transaction in self.transactions:
            if set(itemset).issubset(set(transaction)):
                count += 1
        return count / self.n_transactions
    
    def get_frequent_1_itemsets(self):
        item_counts = {}
        for transaction in self.transactions:
            for item in transaction:
                item_counts[item] = item_counts.get(item, 0) + 1
        
        frequent_items = {}
        for item, count in item_counts.items():
            support = count / self.n_transactions
            if support >= self.min_support:
                frequent_items[frozenset([item])] = support
        
        return frequent_items
    
    def generate_candidates(self, frequent_itemsets, k):
        candidates = set()
        frequent_list = list(frequent_itemsets.keys())
        
        for i in range(len(frequent_list)):
            for j in range(i + 1, len(frequent_list)):
                union = frequent_list[i] | frequent_list[j]
                if len(union) == k:
                    candidates.add(union)
        
        return candidates
    
    def run_apriori(self):
        all_frequent_itemsets = {}
        frequent_1 = self.get_frequent_1_itemsets()
        all_frequent_itemsets.update(frequent_1)
        
        current_frequent = frequent_1
        k = 2
        
        while current_frequent:
            candidates = self.generate_candidates(current_frequent, k)
            frequent_k = {}
            for candidate in candidates:
                support = self.get_item_support(candidate)
                if support >= self.min_support:
                    frequent_k[candidate] = support
            
            if frequent_k:
                all_frequent_itemsets.update(frequent_k)
            
            current_frequent = frequent_k
            k += 1
        
        return all_frequent_itemsets
    
    def generate_association_rules(self, frequent_itemsets, min_confidence=0.6):
        rules = []
        
        for itemset, support in frequent_itemsets.items():
            if len(itemset) > 1:
                items = list(itemset)
                
                for i in range(1, len(items)):
                    for antecedent in combinations(items, i):
                        antecedent = frozenset(antecedent)
                        consequent = itemset - antecedent
                        
                        antecedent_support = frequent_itemsets.get(antecedent, 0)
                        if antecedent_support > 0:
                            confidence = support / antecedent_support
                            
                            if confidence >= min_confidence:
                                consequent_support = self.get_item_support(consequent)
                                lift = confidence / consequent_support if consequent_support > 0 else 0
                                
                                rules.append({
                                    'antecedent': set(antecedent),
                                    'consequent': set(consequent),
                                    'support': support,
                                    'confidence': confidence,
                                    'lift': lift
                                })
        
        rules.sort(key=lambda x: x['confidence'], reverse=True)
        return rules

apriori = SimpleApriori(transactions, min_support=0.3)
frequent_itemsets = apriori.run_apriori()
association_rules = apriori.generate_association_rules(frequent_itemsets, min_confidence=0.6)

print(f"Found {len(frequent_itemsets)} frequent itemsets")
print(f"Generated {len(association_rules)} association rules")

np.random.seed(42)
products = {'dairy': ['Milk', 'Cheese', 'Yogurt', 'Butter'], 'bakery': ['Bread', 'Croissant', 'Muffin'], 'meat': ['Chicken', 'Beef', 'Pork'], 'produce': ['Apples', 'Bananas', 'Carrots', 'Lettuce'], 'beverages': ['Coffee', 'Tea', 'Juice'], 'snacks': ['Chips', 'Cookies', 'Crackers']}

all_products = []
for category, items in products.items():
    all_products.extend(items)

large_transactions = []
for i in range(1000):
    transaction = []
    n_categories = np.random.choice([1, 2, 3, 4], p=[0.2, 0.4, 0.3, 0.1])
    selected_categories = np.random.choice(list(products.keys()), n_categories, replace=False)
    
    for category in selected_categories:
        n_items = np.random.choice([1, 2, 3], p=[0.5, 0.3, 0.2])
        selected_items = np.random.choice(products[category], min(n_items, len(products[category])), replace=False)
        transaction.extend(selected_items)
    
    large_transactions.append(transaction)

large_transactions = [t for t in large_transactions if len(t) > 0]

large_apriori = SimpleApriori(large_transactions, min_support=0.1)
large_frequent_itemsets = large_apriori.run_apriori()
large_rules = large_apriori.generate_association_rules(large_frequent_itemsets, min_confidence=0.5)

def create_binary_matrix(transactions, items):
    matrix = []
    for transaction in transactions:
        row = [1 if item in transaction else 0 for item in items]
        matrix.append(row)
    return np.array(matrix)

items_for_viz = sorted(all_products)
binary_matrix = create_binary_matrix(large_transactions[:100], items_for_viz)

plt.figure(figsize=(15, 10))

plt.subplot(2, 2, 1)
plt.imshow(binary_matrix.T, cmap='Blues', aspect='auto')
plt.xlabel('Transaction ID')
plt.ylabel('Items')
plt.title('Transaction Matrix (First 100 Transactions)')
plt.yticks(range(len(items_for_viz)), items_for_viz, fontsize=8)

item_frequencies = {}
for transaction in large_transactions:
    for item in transaction:
        item_frequencies[item] = item_frequencies.get(item, 0) + 1

sorted_items = sorted(item_frequencies.items(), key=lambda x: x[1], reverse=True)

plt.subplot(2, 2, 2)
items, frequencies = zip(*sorted_items[:15])
plt.bar(range(len(items)), frequencies)
plt.xlabel('Items')
plt.ylabel('Frequency')
plt.title('Top 15 Most Frequent Items')
plt.xticks(range(len(items)), items, rotation=45, ha='right')

supports = list(large_frequent_itemsets.values())
plt.subplot(2, 2, 3)
plt.hist(supports, bins=20, alpha=0.7, edgecolor='black')
plt.xlabel('Support')
plt.ylabel('Frequency')
plt.title('Distribution of Support Values')

if large_rules:
    confidences = [rule['confidence'] for rule in large_rules]
    plt.subplot(2, 2, 4)
    plt.hist(confidences, bins=20, alpha=0.7, edgecolor='black')
    plt.xlabel('Confidence')
    plt.ylabel('Frequency')
    plt.title('Distribution of Rule Confidences')

plt.tight_layout()
plt.savefig('apriori_analysis.png', dpi=300, bbox_inches='tight')
print('Saved: apriori_analysis.png')

if large_frequent_itemsets:
    itemsets_data = []
    for itemset, support in large_frequent_itemsets.items():
        itemsets_data.append({'itemset': ', '.join(sorted(itemset)), 'size': len(itemset), 'support': support})
    
    itemsets_df = pd.DataFrame(itemsets_data)
    itemsets_df.to_csv('frequent_itemsets.csv', index=False)
    print("Saved: frequent_itemsets.csv")

if large_rules:
    rules_data = []
    for rule in large_rules:
        rules_data.append({'antecedent': ', '.join(sorted(rule['antecedent'])), 'consequent': ', '.join(sorted(rule['consequent'])), 'support': rule['support'], 'confidence': rule['confidence'], 'lift': rule['lift']})
    
    rules_df = pd.DataFrame(rules_data)
    rules_df.to_csv('association_rules.csv', index=False)
    print("Saved: association_rules.csv")
