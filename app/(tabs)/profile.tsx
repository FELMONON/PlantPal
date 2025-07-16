import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, CircleHelp as HelpCircle, Star, Share2, Settings, ChevronRight, Heart, Leaf, Droplets, Calendar, Edit3 } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PlantStorage } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate
} from 'react-native-reanimated';

interface UserProfile {
  full_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalPlants: 0,
    healthyPlants: 0,
    plantsNeedingCare: 0,
    plantsNeedingWater: 0,
    averageHealthScore: 0,
  });

  // Animation for profile elements
  const leafAnimation = useSharedValue(0);

  useEffect(() => {
    leafAnimation.value = withRepeat(
      withTiming(1, { duration: 4000 }),
      -1,
      true
    );
  }, []);

  const loadStats = async () => {
    try {
      const plantStats = await PlantStorage.getPlantStats();
      setStats(plantStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, bio, location, avatar_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadUserProfile();
    }, [])
  );

  const getCollectionLevel = (totalPlants: number) => {
    if (totalPlants >= 50) return { level: 'Master Gardener', emoji: '🌳', color: '#8B5CF6' };
    if (totalPlants >= 25) return { level: 'Plant Expert', emoji: '🌿', color: '#22C55E' };
    if (totalPlants >= 10) return { level: 'Green Thumb', emoji: '🌱', color: '#10B981' };
    if (totalPlants >= 5) return { level: 'Plant Lover', emoji: '🪴', color: '#F59E0B' };
    if (totalPlants >= 1) return { level: 'Beginner', emoji: '🌾', color: '#6B7280' };
    return { level: 'New Gardener', emoji: '🌱', color: '#9CA3AF' };
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const collectionLevel = getCollectionLevel(stats.totalPlants);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: Edit3, label: 'Edit Profile', action: () => router.push('/edit-profile') },
        { icon: Bell, label: 'Notifications', action: () => {}, hasSwitch: true },
        { icon: Shield, label: 'Privacy', action: () => {} },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: Star, label: 'Rate PlantPal', action: () => {} },
        { icon: Share2, label: 'Share App', action: () => {} },
        { icon: HelpCircle, label: 'Help', action: () => {} },
        { icon: Settings, label: 'Settings', action: () => {} },
        { icon: User, label: 'Sign Out', action: handleSignOut },
      ]
    }
  ];

  // Animated styles
  const leafAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(leafAnimation.value, [0, 1], [0, 5]);
    const scale = interpolate(leafAnimation.value, [0, 1], [1, 1.05]);
    return {
      transform: [{ rotate: `${rotate}deg` }, { scale }],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { borderColor: collectionLevel.color }]}>
              <Animated.Text style={[styles.avatarText, leafAnimatedStyle]}>
                {collectionLevel.emoji}
              </Animated.Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userProfile.full_name || userProfile.username || user?.email || 'Plant Enthusiast'}
              </Text>
              <Text style={[styles.userLevel, { color: collectionLevel.color }]}>
                {collectionLevel.level}
              </Text>
              {userProfile.location && (
                <Text style={styles.userLocation}>📍 {userProfile.location}</Text>
              )}
              <Text style={styles.joinDate}>
                {stats.totalPlants > 0 
                  ? `${stats.totalPlants} plant${stats.totalPlants === 1 ? '' : 's'} in garden`
                  : 'Start your plant journey'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        {userProfile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>
        )}

        {/* Garden Stats */}
        {stats.totalPlants > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Garden Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Leaf size={24} color="#22C55E" />
                <Text style={styles.statValue}>{stats.totalPlants}</Text>
                <Text style={styles.statLabel}>Total Plants</Text>
              </View>
              
              <View style={styles.statCard}>
                <Heart size={24} color="#22C55E" />
                <Text style={styles.statValue}>{stats.healthyPlants}</Text>
                <Text style={styles.statLabel}>Healthy</Text>
              </View>
              
              <View style={styles.statCard}>
                <Droplets size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{stats.plantsNeedingWater}</Text>
                <Text style={styles.statLabel}>Need Water</Text>
              </View>
              
              <View style={styles.statCard}>
                <Calendar size={24} color="#8B5CF6" />
                <Text style={styles.statValue}>{stats.averageHealthScore}</Text>
                <Text style={styles.statLabel}>Avg Health</Text>
              </View>
            </View>
          </View>
        )}

        {/* Collection Health */}
        {stats.totalPlants > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection Health</Text>
            <View style={styles.healthOverview}>
              <View style={styles.healthBar}>
                <View 
                  style={[
                    styles.healthFill, 
                    { 
                      width: `${(stats.healthyPlants / stats.totalPlants) * 100}%`,
                      backgroundColor: '#22C55E'
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.healthFill, 
                    { 
                      width: `${(stats.plantsNeedingCare / stats.totalPlants) * 100}%`,
                      backgroundColor: '#F59E0B',
                      marginLeft: `${(stats.healthyPlants / stats.totalPlants) * 100}%`
                    }
                  ]} 
                />
              </View>
              <View style={styles.healthLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.legendText}>Healthy ({stats.healthyPlants})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Need Care ({stats.plantsNeedingCare})</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder
                  ]}
                  onPress={item.action}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemIcon}>
                      <item.icon size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  
                  {item.hasSwitch ? (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                      thumbColor={notificationsEnabled ? '#22C55E' : '#F3F4F6'}
                    />
                  ) : (
                    <ChevronRight size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Animated.Text style={[styles.appIcon, leafAnimatedStyle]}>🌱</Animated.Text>
          <Text style={styles.appName}>PlantPal</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your personal plant care companion for a thriving garden.
          </Text>
        </View>
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  userLevel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 2,
  },
  joinDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  userLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  healthOverview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  healthBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 12,
    flexDirection: 'row',
  },
  healthFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
  },
  healthLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  appInfo: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  appIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});