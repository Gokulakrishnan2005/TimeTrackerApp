import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AddTransactionModal from '../components/AddTransactionModal';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const AddQuickAction: React.FC = () => {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState<boolean>(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    // Open whenever this tab gains focus
    if (isFocused) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isFocused]);

  const handleClose = () => {
    setVisible(false);
    // Return to Finance tab for continuity
    navigation.navigate('Finance');
  };

  const handleAdded = () => {
    // After a successful add, return to Finance tab
    navigation.navigate('Finance');
  };

  return (
    <View style={{ flex: 1 }}>
      <AddTransactionModal
        visible={visible}
        onClose={handleClose}
        onTransactionAdded={handleAdded}
        defaultType={undefined}
      />
    </View>
  );
};

export default AddQuickAction;
