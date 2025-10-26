import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WishlistData } from '../types/wishlist';
import { getWishlistData, addWishlistItem, deleteWishlistItem, moveItemToPurchased, calculateTotals } from '../utils/wishlistStorage';
import BudgetSummaryCard from '../components/BudgetSummaryCard';
import WishlistItemCard from '../components/WishlistItemCard';
import PurchasedItemCard from '../components/PurchasedItemCard';
import AddItemModal from '../components/AddItemModal';

const WishlistScreen = () => {
  const [wishlistData, setWishlistData] = useState<WishlistData>({ wishlistItems: [], purchasedItems: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [totals, setTotals] = useState({ needToBuy: 0, alreadyBought: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getWishlistData();
    setWishlistData(data);
    setTotals(calculateTotals(data));
    setLoading(false);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, []);

  const handleAddItem = async (itemName: string, price: number) => {
    const newData = await addWishlistItem(itemName, price);
    setWishlistData(newData);
    setTotals(calculateTotals(newData));
  };

  const handleDeleteItem = async (itemId: string) => {
    const newData = await deleteWishlistItem(itemId);
    setWishlistData(newData);
    setTotals(calculateTotals(newData));
  };

  const handleMoveToPurchased = async (itemId: string) => {
    const newData = await moveItemToPurchased(itemId);
    setWishlistData(newData);
    setTotals(calculateTotals(newData));
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.summaryContainer}>
          <BudgetSummaryCard title="need money to buy things" amount={totals.needToBuy} />
          <View style={{ width: 8 }} />
          <BudgetSummaryCard title="The items i bought" amount={totals.alreadyBought} />
        </View>

        <Text style={styles.sectionHeader}>Wishlist want to buy</Text>
        {wishlistData.wishlistItems.length === 0 ? (
          <Text style={styles.emptyText}>Your wishlist is empty.</Text>
        ) : (
          wishlistData.wishlistItems.map(item => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
              onMoveToPurchased={handleMoveToPurchased}
            />
          ))
        )}

        <Text style={styles.sectionHeader}>Things i bought</Text>
        {wishlistData.purchasedItems.length === 0 ? (
          <Text style={styles.emptyText}>You haven't purchased anything yet.</Text>
        ) : (
          wishlistData.purchasedItems.map(item => (
            <PurchasedItemCard key={item.id} item={item} />
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddItem={handleAddItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80, // For FAB
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C9FF8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    marginVertical: 20,
  },
});

export default WishlistScreen;
