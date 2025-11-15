import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNakama } from '../contexts/NakamaContext';
import { UseItemModal } from '../components/UseItemModal';
import { ItemUsedNotification } from '../components/ItemUsedNotification';

interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  name: string;
  description: string;
  icon_url?: string;
  type: string;
  rarity: string;
  effect_type?: string;
  effect_duration_minutes?: number;
}

interface InventoryScreenProps {
  onClose?: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onClose }) => {
  const { callRpc, isConnected } = useNakama();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'consumable' | 'collectible' | 'equipment'>('collectible');
  const [currentCapacity, setCurrentCapacity] = useState(50);
  const [maxCapacity] = useState(300);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [usedItemName, setUsedItemName] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const result = await callRpc('get_user_inventory', {});

      if (result.success) {
        const items = result.inventory || [];
        setInventory(items);
        // Calculate total quantity for capacity
        const totalQuantity = items.reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0);
        setCurrentCapacity(totalQuantity);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const handleUseItem = (item: InventoryItem) => {
    if (item.type !== 'consumable') {
      Alert.alert('Info', 'This item cannot be used');
      return;
    }

    setSelectedItem(item);
    setShowUseModal(true);
  };

  const handleConfirmUse = async () => {
    if (!selectedItem) return;

    try {
      const result = await callRpc('use_item', { itemId: selectedItem.item_id });
      if (result.success) {
        setShowUseModal(false);
        setUsedItemName(selectedItem.name);
        setShowNotification(true);
        loadInventory();
        setSelectedItem(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to use item');
        setShowUseModal(false);
        setSelectedItem(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to use item');
      setShowUseModal(false);
      setSelectedItem(null);
    }
  };

  const handleCancelUse = () => {
    setShowUseModal(false);
    setSelectedItem(null);
  };

  const getItemIcon = (item: InventoryItem) => {
    const name = item.name.toLowerCase();
    if (name.includes('speed') || name.includes('boost')) {
      return { icon: 'flash', color: '#17B2B2' }; // Teal
    } else if (name.includes('fog') || name.includes('screen')) {
      return { icon: 'cloud', color: '#FF9500' }; // Orange
    } else if (name.includes('warp') || name.includes('pass')) {
      return { icon: 'help-circle', color: '#34C759' }; // Green
    } else if (name.includes('blocker') || name.includes('shield')) {
      return { icon: 'shield', color: '#FF69B4' }; // Pink
    } else if (name.includes('xp') || name.includes('glow')) {
      return { icon: 'help-circle', color: '#9B59B6' }; // Purple
    } else if (name.includes('hint') || name.includes('orb')) {
      return { icon: 'bulb', color: '#17B2B2' }; // Teal
    }
    return { icon: 'cube', color: '#95A5A6' }; // Default grey
  };

  const filteredInventory = filter === 'all' 
    ? inventory 
    : inventory.filter(item => item.type === filter);

  const renderItemCard = (item: InventoryItem, index: number) => {
    const { icon, color } = getItemIcon(item);
    const isThirdColumn = (index + 1) % 3 === 0;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, isThirdColumn && styles.itemCardLast]}
        onPress={() => item.type === 'consumable' && handleUseItem(item)}
      >
        <View style={[styles.itemIconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={32} color="#fff" />
        </View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Items</Text>
        <View style={styles.headerRight}>
          <Text style={styles.capacityText}>{currentCapacity}/{maxCapacity}</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        {(['collectible', 'consumable', 'equipment'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={styles.tab}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </Text>
            {filter === f && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Item Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17B2B2" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredInventory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your inventory is empty</Text>
              <Text style={styles.emptySubtext}>Complete quests to earn items!</Text>
            </View>
          ) : (
            filteredInventory.map((item, index) => renderItemCard(item, index))
          )}
        </ScrollView>
      )}

      {/* Use Item Modal */}
      <UseItemModal
        visible={showUseModal}
        item={selectedItem}
        onCancel={handleCancelUse}
        onConfirm={handleConfirmUse}
      />

      {/* Item Used Notification */}
      <ItemUsedNotification
        visible={showNotification}
        itemName={usedItemName}
        onHide={() => setShowNotification(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capacityText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 24,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#17B2B2',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'flex-start',
  },
  itemCard: {
    width: '31%',
    marginRight: '3.5%',
    marginBottom: 16,
    aspectRatio: 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCardLast: {
    marginRight: 0,
  },
  itemIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

