export interface WishlistItem {
  id: string;
  itemName: string;
  price: number;
  currency: string;
  addedDate: string;
  purchasedDate: string | null;
  status: 'wishlist' | 'purchased';
}

export interface WishlistData {
  wishlistItems: WishlistItem[];
  purchasedItems: WishlistItem[];
}
