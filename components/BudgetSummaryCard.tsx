import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatIndianCurrency } from '../utils/currencyFormatter';

interface BudgetSummaryCardProps {
  title: string;
  amount: number;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({ title, amount }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>{formatIndianCurrency(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default BudgetSummaryCard;
