import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WishlistItem } from '../types/wishlist';
import { formatIndianCurrency } from '../utils/currencyFormatter';

interface PurchasedItemCardProps {
  item: WishlistItem;
}

const PurchasedItemCard: React.FC<PurchasedItemCardProps> = ({ item }) => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.itemName}>Item name: {item.itemName}</Text>
        <Text style={styles.date}>Added date: {new Date(item.addedDate).toLocaleDateString('en-GB')}</Text>
      </View>
      <Text style={styles.price}>{formatIndianCurrency(item.price)}</Text>
      <Text style={styles.purchasedDate}>
        Purchased date: {item.purchasedDate ? new Date(item.purchasedDate).toLocaleDateString('en-GB') : 'N/A'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: '#666666',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  purchasedDate: {
    color: '#666666',
  },
});

export default PurchasedItemCard;
