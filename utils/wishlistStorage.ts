"""import AsyncStorage from '@react-native-async-storage/async-storage';
import { WishlistData, WishlistItem } from '../types/wishlist';

const WISHLIST_DATA_KEY = 'WISHLIST_DATA';

// Get all wishlist data
export const getWishlistData = async (): Promise<WishlistData> => {
  try {
    const jsonValue = await AsyncStorage.getItem(WISHLIST_DATA_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : { wishlistItems: [], purchasedItems: [] };
  } catch (e) {
    console.error('Failed to fetch wishlist data.', e);
    return { wishlistItems: [], purchasedItems: [] };
  }
};

// Save wishlist data
export const saveWishlistData = async (data: WishlistData): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(WISHLIST_DATA_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save wishlist data.', e);
  }
};

// Add new item to wishlist
export const addWishlistItem = async (itemName: string, price: number): Promise<WishlistData> => {
  const currentData = await getWishlistData();
  const newItem: WishlistItem = {
    id: new Date().toISOString(), // Using ISO string for unique ID
    itemName,
    price,
    currency: 'INR',
    addedDate: new Date().toISOString(),
    purchasedDate: null,
    status: 'wishlist',
  };
  const newData: WishlistData = {
    ...currentData,
    wishlistItems: [newItem, ...currentData.wishlistItems],
  };
  await saveWishlistData(newData);
  return newData;
};

// Move item to purchased
export const moveItemToPurchased = async (itemId: string): Promise<WishlistData> => {
  const currentData = await getWishlistData();
  const itemToMove = currentData.wishlistItems.find(item => item.id === itemId);

  if (!itemToMove) return currentData;

  const updatedItem: WishlistItem = {
    ...itemToMove,
    status: 'purchased',
    purchasedDate: new Date().toISOString(),
  };

  const newWishlistItems = currentData.wishlistItems.filter(item => item.id !== itemId);
  const newPurchasedItems = [updatedItem, ...currentData.purchasedItems];

  const newData: WishlistData = {
    wishlistItems: newWishlistItems,
    purchasedItems: newPurchasedItems,
  };

  await saveWishlistData(newData);
  return newData;
};

// Delete item
export const deleteWishlistItem = async (itemId: string): Promise<WishlistData> => {
  const currentData = await getWishlistData();
  const newWishlistItems = currentData.wishlistItems.filter(item => item.id !== itemId);
  const newPurchasedItems = currentData.purchasedItems.filter(item => item.id !== itemId);

  const newData: WishlistData = {
    wishlistItems: newWishlistItems,
    purchasedItems: newPurchasedItems,
  };

  await saveWishlistData(newData);
  return newData;
};

// Calculate totals
export const calculateTotals = (data: WishlistData): { needToBuy: number; alreadyBought: number } => {
  const needToBuy = data.wishlistItems.reduce((acc, item) => acc + item.price, 0);
  const alreadyBought = data.purchasedItems.reduce((acc, item) => acc + item.price, 0);
  return { needToBuy, alreadyBought };
};
""