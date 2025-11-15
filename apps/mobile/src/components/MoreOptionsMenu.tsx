import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MoreOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  options: Array<{
    id: string;
    label: string;
    icon: string;
    onPress: () => void;
    destructive?: boolean;
  }>;
}

export const MoreOptionsMenu: React.FC<MoreOptionsMenuProps> = ({
  visible,
  onClose,
  position,
  options,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.menu,
              {
                top: position.y > 0 ? position.y : undefined,
                bottom: position.y <= 0 ? 20 : undefined,
              },
            ]}
          >
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.menuItem,
                  index === 0 && styles.menuItemFirst,
                  index === options.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={option.destructive ? '#FF3B30' : '#333'}
                  style={styles.menuIcon}
                />
                <Text
                  style={[
                    styles.menuText,
                    option.destructive && styles.menuTextDestructive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  menuTextDestructive: {
    color: '#FF3B30',
  },
});

