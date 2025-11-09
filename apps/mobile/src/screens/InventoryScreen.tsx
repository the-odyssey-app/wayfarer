import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

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
  const [filter, setFilter] = useState<'all' | 'consumable' | 'collectible' | 'equipment'>('all');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const result = await callRpc('get_user_inventory', {});

      if (result.success) {
        setInventory(result.inventory || []);
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

  const handleUseItem = async (item: InventoryItem) => {
    if (item.type !== 'consumable') {
      Alert.alert('Info', 'This item cannot be used');
      return;
    }

    Alert.alert(
      'Use Item',
      `Use ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use',
          onPress: async () => {
            try {
              const result = await callRpc('use_item', { itemId: item.item_id });
              if (result.success) {
                Alert.alert('Success', `${item.name} used!`);
                loadInventory();
              } else {
                Alert.alert('Error', result.error || 'Failed to use item');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to use item');
            }
          },
        },
      ]
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return '#FF6B00';
      case 'epic': return '#9B59B6';
      case 'rare': return '#3498DB';
      case 'uncommon': return '#2ECC71';
      default: return '#95A5A6';
    }
  };

  const filteredInventory = filter === 'all' 
    ? inventory 
    : inventory.filter(item => item.type === filter);

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => item.type === 'consumable' && handleUseItem(item)}
      disabled={item.type !== 'consumable'}
    >
      <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(item.rarity) }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{item.quantity}x</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.itemFooter}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          {item.effect_type && (
            <Text style={styles.effectText}>
              Effect: {item.effect_type.replace('_', ' ')}
            </Text>
          )}
        </View>
      </View>
      {item.type === 'consumable' && (
        <TouchableOpacity
          style={styles.useButton}
          onPress={() => handleUseItem(item)}
        >
          <Text style={styles.useButtonText}>Use</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.subtitle}>{filteredInventory.length} items</Text>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['all', 'consumable', 'collectible', 'equipment'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredInventory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your inventory is empty</Text>
              <Text style={styles.emptySubtext}>Complete quests to earn items!</Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 60,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  rarityIndicator: {
    width: 4,
  },
  itemContent: {
    flex: 1,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quantityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  effectText: {
    fontSize: 12,
    color: '#007AFF',
  },
  useButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

