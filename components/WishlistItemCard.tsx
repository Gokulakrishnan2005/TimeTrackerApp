import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WishlistItem } from '../types/wishlist';
import { formatIndianCurrency } from '../utils/currencyFormatter';

interface WishlistItemCardProps {
  item: WishlistItem;
  onDelete: (id: string) => void;
  onMoveToPurchased: (id: string) => void;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item, onDelete, onMoveToPurchased }) => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.itemName}>Item name: {item.itemName}</Text>
        <Text style={styles.date}>Added date: {new Date(item.addedDate).toLocaleDateString('en-GB')}</Text>
      </View>
      <Text style={styles.price}>{formatIndianCurrency(item.price)}</Text>
      <Text style={styles.purchasedDate}>Purchased date: N/A</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => onDelete(item.id)}>
          <Text style={styles.buttonText}>delete this one</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.moveButton]} onPress={() => onMoveToPurchased(item.id)}>
          <Text style={styles.buttonText}>move to bought list</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 99,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  moveButton: {
    backgroundColor: '#6C9FF8', // Fallback color
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default WishlistItemCard;
