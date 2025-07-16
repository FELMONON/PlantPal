import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Droplets, Sparkles, Calendar, TrendingUp, Plus } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { PlantStorage, SavedPlant } from '@/utils/storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate
} from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const leafAnimation = useSharedValue(0);
  const sparkleAnimation = useSharedValue(0);

  // Start animations
  useEffect(() => {
    leafAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );

    sparkleAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadPlants = async () => {
    try {
      const savedPlants = await PlantStorage.getAllPlants();
      setPlants(savedPlants);
    } catch (error) {
      console.error('Error loading plants:', error);
    }
  };

  const generateQuote = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_PLANT_API_KEY;
      if (!apiKey) {
        setCurrentQuote("Every plant teaches us patience and the beauty of slow growth 🌱");
        return;
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Generate a beautiful, inspiring quote about plants, nature, growth, or life. Keep it under 100 characters and make it uplifting. Just return the quote without quotation marks."
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const quote = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (quote) {
        setCurrentQuote(quote);
      }
    } catch (error) {
      setCurrentQuote("Every plant teaches us patience and the beauty of slow growth 🌱");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPlants(), generateQuote()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadPlants();
      generateQuote();
    }, [])
  );

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlantsThatNeedWater = () => {
    const now = new Date();
    return plants.filter(plant => {
      if (!plant.lastWatered) return true;
      const lastWatered = new Date(plant.lastWatered);
      const daysSince = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= 7; // Need water if 7+ days since last watering
    });
  };

  const plantsNeedingWater = getPlantsThatNeedWater();

  // Animated styles
  const leafAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(leafAnimation.value, [0, 1], [0, 10]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const sparkleAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(sparkleAnimation.value, [0, 1], [0.8, 1.2]);
    const opacity = interpolate(sparkleAnimation.value, [0, 0.5, 1], [0.3, 1, 0.3]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Time */}
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime()}</Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.greetingContainer}>
            <Animated.View style={leafAnimatedStyle}>
              <Text style={styles.leafEmoji}>🌿</Text>
            </Animated.View>
            <Text style={styles.greetingText}>{getTimeGreeting()}</Text>
          </View>
        </View>

        {/* AI Quote */}
        <View style={styles.quoteContainer}>
          <Animated.View style={sparkleAnimatedStyle}>
            <Sparkles size={20} color="#22C55E" />
          </Animated.View>
          <Text style={styles.quoteText}>{currentQuote}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{plants.length}</Text>
            <Text style={styles.statLabel}>Plants</Text>
            <Text style={styles.plantEmoji}>🪴</Text>
          </View>
          
          <View style={[styles.statCard, plantsNeedingWater.length > 0 && styles.statCardAlert]}>
            <Text style={[styles.statNumber, plantsNeedingWater.length > 0 && styles.statNumberAlert]}>
              {plantsNeedingWater.length}
            </Text>
            <Text style={[styles.statLabel, plantsNeedingWater.length > 0 && styles.statLabelAlert]}>
              Need Water
            </Text>
            <Droplets size={20} color={plantsNeedingWater.length > 0 ? "#EF4444" : "#6B7280"} />
          </View>
        </View>

        {/* Plants Needing Attention */}
        {plantsNeedingWater.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Plants Need Water</Text>
            <View style={styles.alertPlantsContainer}>
              {plantsNeedingWater.slice(0, 3).map((plant) => (
                <TouchableOpacity 
                  key={plant.id} 
                  style={styles.alertPlantCard}
                  onPress={() => router.push({
                    pathname: '/plant-details',
                    params: { plantId: plant.id }
                  })}
                >
                  <Text style={styles.alertPlantEmoji}>💧</Text>
                  <Text style={styles.alertPlantName}>
                    {plant.customName || plant.commonName}
                  </Text>
                  <Text style={styles.alertPlantDays}>
                    {plant.lastWatered 
                      ? `${Math.floor((new Date().getTime() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'Never watered'
                    }
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent Plants */}
        {plants.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌱 Recent Plants</Text>
              <TouchableOpacity onPress={() => router.push('/journal')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plantsScroll}>
              {plants.slice(0, 5).map((plant) => (
                <TouchableOpacity 
                  key={plant.id} 
                  style={styles.plantCard}
                  onPress={() => router.push({
                    pathname: '/plant-details',
                    params: { plantId: plant.id }
                  })}
                >
                  <View style={styles.plantImageContainer}>
                    <Text style={styles.plantCardEmoji}>🌿</Text>
                    <View style={[styles.healthDot, { backgroundColor: plant.healthScore >= 80 ? '#22C55E' : plant.healthScore >= 60 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.plantCardName} numberOfLines={1}>
                    {plant.customName || plant.commonName}
                  </Text>
                  <Text style={styles.plantCardHealth}>
                    {plant.healthScore}/100
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add Plant Button */}
        <View style={styles.addPlantSection}>
          <TouchableOpacity 
            style={styles.addPlantButton}
            onPress={() => router.push('/camera')}
          >
            <View style={styles.addPlantIcon}>
              <Plus size={24} color="#FFFFFF" />
            </View>
            <View style={styles.addPlantContent}>
              <Text style={styles.addPlantTitle}>
                {plants.length === 0 ? 'Add Your First Plant' : 'Add New Plant'}
              </Text>
              <Text style={styles.addPlantSubtitle}>
                {plants.length === 0 
                  ? 'Start your plant care journey' 
                  : 'Scan and identify a new plant'
                }
              </Text>
            </View>
            <Camera size={20} color="#22C55E" />
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {plants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Welcome to PlantPal</Text>
            <Text style={styles.emptyText}>
              Your personal plant care companion. Start by adding your first plant to begin tracking its health and care schedule.
            </Text>
          </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  timeContainer: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  leafEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  quoteContainer: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quoteText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#166534',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  statNumberAlert: {
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  statLabelAlert: {
    color: '#DC2626',
  },
  plantEmoji: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#22C55E',
  },
  alertPlantsContainer: {
    gap: 12,
  },
  alertPlantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertPlantEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  alertPlantName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  alertPlantDays: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
  plantsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  plantImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  plantCardEmoji: {
    fontSize: 32,
  },
  healthDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  plantCardName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  plantCardHealth: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  addPlantSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  addPlantButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
  },
  addPlantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addPlantContent: {
    flex: 1,
  },
  addPlantTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  addPlantSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
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