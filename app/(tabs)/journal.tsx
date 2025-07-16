import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Droplets, Sparkles, Calendar, TrendingUp, TrendingDown, Minus, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { PlantStorage, SavedPlant } from '@/utils/storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate
} from 'react-native-reanimated';

export default function JournalScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation for plant emojis
  const plantAnimation = useSharedValue(0);

  useEffect(() => {
    plantAnimation.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const loadSavedPlants = async () => {
    try {
      const plants = await PlantStorage.getAllPlants();
      setSavedPlants(plants);
    } catch (error) {
      console.error('Error loading plants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedPlants();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedPlants();
    }, [])
  );

  const filteredPlants = savedPlants.filter(plant =>
    plant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plant.commonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plant.customName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWaterPlant = async (plant: SavedPlant) => {
    try {
      await PlantStorage.updatePlant(plant.id, {
        lastWatered: new Date().toISOString(),
      });
      await loadSavedPlants();
      Alert.alert('💧 Watered!', `${plant.customName || plant.commonName} has been watered.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update watering record');
    }
  };

  const handleFertilizePlant = async (plant: SavedPlant) => {
    try {
      await PlantStorage.updatePlant(plant.id, {
        lastFertilized: new Date().toISOString(),
      });
      await loadSavedPlants();
      Alert.alert('🌱 Fertilized!', `${plant.customName || plant.commonName} has been fertilized.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update fertilizing record');
    }
  };

  const handleDeletePlant = (plant: SavedPlant) => {
    Alert.alert(
      'Remove Plant',
      `Are you sure you want to remove "${plant.customName || plant.commonName}" from your garden?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await PlantStorage.deletePlant(plant.id);
              await loadSavedPlants();
              Alert.alert('🗑️ Removed', 'Plant removed from your garden');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove plant');
            }
          },
        },
      ]
    );
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <TrendingUp size={16} color="#22C55E" />;
    if (score >= 60) return <Minus size={16} color="#F59E0B" />;
    return <TrendingDown size={16} color="#EF4444" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getDaysSince = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatLastAction = (dateString?: string, action: string = 'Never') => {
    if (!dateString) return action;
    const days = getDaysSince(dateString);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Animated style for plant emojis
  const plantAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(plantAnimation.value, [0, 1], [1, 1.1]);
    return {
      transform: [{ scale }],
    };
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.Text style={[styles.loadingEmoji, plantAnimatedStyle]}>🌱</Animated.Text>
          <Text style={styles.loadingText}>Loading your garden...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 My Garden</Text>
        <Text style={styles.subtitle}>
          {savedPlants.length === 0 
            ? 'Your plant care journey starts here' 
            : `${savedPlants.length} plant${savedPlants.length === 1 ? '' : 's'} in your care`
          }
        </Text>
      </View>

      {/* Search Bar */}
      {savedPlants.length > 0 && (
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your plants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      {/* Add Plant Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/camera')}
      >
        <Plus size={20} color="#22C55E" />
        <Text style={styles.addButtonText}>
          {savedPlants.length === 0 ? 'Add Your First Plant' : 'Add New Plant'}
        </Text>
      </TouchableOpacity>

      {/* Plants List or Empty State */}
      <ScrollView 
        style={styles.plantsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {savedPlants.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.Text style={[styles.emptyEmoji, plantAnimatedStyle]}>🪴</Animated.Text>
            <Text style={styles.emptyTitle}>Your Garden Awaits</Text>
            <Text style={styles.emptyText}>
              Start your plant care journey by adding your first plant. Track watering, fertilizing, and watch your garden flourish!
            </Text>
          </View>
        ) : (
          <>
            {filteredPlants.map((plant) => (
              <View key={plant.id} style={styles.plantCard}>
                <TouchableOpacity 
                  style={styles.plantHeader}
                  onPress={() => router.push({
                    pathname: '/plant-details',
                    params: { plantId: plant.id }
                  })}
                >
                  <View style={styles.plantInfo}>
                    <View style={styles.plantNameContainer}>
                      <Animated.Text style={[styles.plantEmoji, plantAnimatedStyle]}>
                        🌿
                      </Animated.Text>
                      <View style={styles.plantNames}>
                        <Text style={styles.plantName}>
                          {plant.customName || plant.commonName}
                        </Text>
                        <Text style={styles.plantScientific}>{plant.name}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.healthScore}>
                      {getHealthIcon(plant.healthScore)}
                      <Text style={[styles.scoreText, { color: getHealthColor(plant.healthScore) }]}>
                        {plant.healthScore}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Care Status */}
                <View style={styles.careStatus}>
                  <View style={styles.careItem}>
                    <Droplets size={16} color="#3B82F6" />
                    <Text style={styles.careLabel}>Watered:</Text>
                    <Text style={[
                      styles.careValue,
                      getDaysSince(plant.lastWatered) && getDaysSince(plant.lastWatered)! > 7 && styles.careValueAlert
                    ]}>
                      {formatLastAction(plant.lastWatered, 'Never')}
                    </Text>
                  </View>
                  
                  <View style={styles.careItem}>
                    <Sparkles size={16} color="#8B5CF6" />
                    <Text style={styles.careLabel}>Fertilized:</Text>
                    <Text style={styles.careValue}>
                      {formatLastAction(plant.lastFertilized, 'Never')}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleWaterPlant(plant)}
                  >
                    <Droplets size={16} color="#3B82F6" />
                    <Text style={styles.actionButtonText}>Water</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleFertilizePlant(plant)}
                  >
                    <Sparkles size={16} color="#8B5CF6" />
                    <Text style={styles.actionButtonText}>Fertilize</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push({
                      pathname: '/plant-details',
                      params: { plantId: plant.id }
                    })}
                  >
                    <Edit3 size={16} color="#6B7280" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeletePlant(plant)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredPlants.length === 0 && searchQuery && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No plants found</Text>
                <Text style={styles.emptyText}>
                  Try a different search term or add more plants to your garden.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#22C55E',
    marginLeft: 8,
  },
  plantsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  plantHeader: {
    padding: 16,
  },
  plantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plantEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  plantNames: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  plantScientific: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  careStatus: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  careLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  careValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  careValueAlert: {
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});