import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAddItem: (itemName: string, price: number) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose, onAddItem }) => {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');

  const handleAddItem = () => {
    if (itemName.trim().length < 2) {
      Alert.alert('Invalid Input', 'Item name must be at least 2 characters long.');
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Invalid Input', 'Price must be a positive number.');
      return;
    }
    onAddItem(itemName, priceValue);
    setItemName('');
    setPrice('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add New Item</Text>
          <TextInput
            style={styles.input}
            placeholder="Item Name"
            value={itemName}
            onChangeText={setItemName}
          />
          <TextInput
            style={styles.input}
            placeholder="Price (₹)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleAddItem}>
              <Text style={styles.addButtonText}>Add to Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#666666',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666666',
  },
  addButton: {
    backgroundColor: '#6C9FF8',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
  },
});

export default AddItemModal;
