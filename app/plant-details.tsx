import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard as Edit3, Save, Trash2, Calendar, Droplets, Sun, Thermometer, Heart, TrendingUp, TrendingDown, Minus, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle } from 'lucide-react-native';
import { PlantStorage, SavedPlant } from '@/utils/storage';

export default function PlantDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { plantId } = params;
  
  const [plant, setPlant] = useState<SavedPlant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPlantDetails();
  }, [plantId]);

  const loadPlantDetails = async () => {
    try {
      const plantData = await PlantStorage.getPlantById(plantId as string);
      if (plantData) {
        setPlant(plantData);
        setCustomName(plantData.customName || '');
        setNotes(plantData.notes || '');
      } else {
        Alert.alert('Error', 'Plant not found');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load plant details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plant) return;
    
    setIsSaving(true);
    try {
      await PlantStorage.updatePlant(plant.id, {
        customName: customName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      
      // Update local state
      setPlant({
        ...plant,
        customName: customName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Plant details updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!plant) return;
    
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to remove "${plant.customName || plant.commonName}" from your collection? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PlantStorage.deletePlant(plant.id);
              Alert.alert('Success', 'Plant removed from your collection');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plant');
            }
          },
        },
      ]
    );
  };

  const getHealthIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'good':
        return <CheckCircle size={24} color="#22C55E" />;
      case 'warning':
      case 'moderate':
        return <AlertTriangle size={24} color="#F59E0B" />;
      case 'poor':
      case 'critical':
        return <XCircle size={24} color="#EF4444" />;
      default:
        return <AlertTriangle size={24} color="#6B7280" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'good':
        return '#22C55E';
      case 'warning':
      case 'moderate':
        return '#F59E0B';
      case 'poor':
      case 'critical':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp size={20} color="#22C55E" />;
    if (score >= 60) return <Minus size={20} color="#F59E0B" />;
    return <TrendingDown size={20} color="#EF4444" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading plant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Plant not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const careCategories = [
    {
      icon: Droplets,
      title: 'Watering',
      description: plant.quickFacts.waterFrequency || 'Water when top inch of soil is dry',
      color: '#3B82F6',
    },
    {
      icon: Sun,
      title: 'Light',
      description: plant.quickFacts.lightRequirement || 'Bright, indirect sunlight',
      color: '#F59E0B',
    },
    {
      icon: Thermometer,
      title: 'Temperature',
      description: plant.quickFacts.temperature || 'Room temperature is ideal',
      color: '#EF4444',
    },
    {
      icon: Heart,
      title: 'Humidity',
      description: plant.quickFacts.humidity || 'Moderate humidity levels',
      color: '#8B5CF6',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {isEditing ? (
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
                disabled={isSaving}
              >
                <Save size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Edit3 size={20} color="#374151" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: plant.imageUri }} style={styles.plantImage} />
          <View style={styles.healthScoreBadge}>
            {getScoreIcon(plant.healthScore)}
            <Text style={[styles.healthScoreText, { color: getScoreColor(plant.healthScore) }]}>
              {plant.healthScore}/100
            </Text>
          </View>
        </View>

        {/* Plant Info */}
        <View style={styles.plantInfo}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <Text style={styles.editLabel}>Custom Name</Text>
              <TextInput
                style={styles.editInput}
                value={customName}
                onChangeText={setCustomName}
                placeholder={plant.commonName}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ) : (
            <Text style={styles.plantName}>
              {plant.customName || plant.commonName}
            </Text>
          )}
          
          <Text style={styles.plantScientific}>{plant.name}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.metaText}>Added {formatDate(plant.dateAdded)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.confidenceText}>{plant.confidence}% confidence</Text>
            </View>
          </View>
          
          <View style={styles.diagnosisCard}>
            <View style={styles.diagnosisHeader}>
              {getHealthIcon(plant.healthStatus)}
              <Text style={styles.diagnosisTitle}>Health Assessment</Text>
            </View>
            <Text style={[styles.diagnosisText, { color: getHealthColor(plant.healthStatus) }]}>
              {plant.diagnosis}
            </Text>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {isEditing ? (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add your notes about this plant..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.notesCard}>
              <Text style={[styles.notesText, { fontStyle: plant.notes ? 'normal' : 'italic' }]}>
                {plant.notes || 'No notes added yet. Tap edit to add your observations about this plant.'}
              </Text>
            </View>
          )}
        </View>

        {/* Care Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Guidelines</Text>
          <View style={styles.careGrid}>
            {careCategories.map((category, index) => (
              <View key={index} style={styles.careCard}>
                <View style={[styles.careIcon, { backgroundColor: `${category.color}20` }]}>
                  <category.icon size={20} color={category.color} />
                </View>
                <Text style={styles.careTitle}>{category.title}</Text>
                <Text style={styles.careDescription}>{category.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Care Advice */}
        {plant.careAdvice && plant.careAdvice.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Care Recommendations</Text>
            <View style={styles.stepsContainer}>
              {plant.careAdvice.map((advice: string, index: number) => (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{advice}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Facts</Text>
          <View style={styles.factsCard}>
            {plant.quickFacts.origin && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Origin:</Text>
                <Text style={styles.factValue}>{plant.quickFacts.origin}</Text>
              </View>
            )}
            {plant.quickFacts.difficulty && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Difficulty:</Text>
                <Text style={styles.factValue}>{plant.quickFacts.difficulty}</Text>
              </View>
            )}
            {plant.quickFacts.growthRate && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Growth Rate:</Text>
                <Text style={styles.factValue}>{plant.quickFacts.growthRate}</Text>
              </View>
            )}
            {plant.quickFacts.toxicity && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Toxicity:</Text>
                <Text style={styles.factValue}>{plant.quickFacts.toxicity}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  plantImage: {
    width: '100%',
    height: 300,
  },
  healthScoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  healthScoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  plantInfo: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  plantName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  plantScientific: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 16,
  },
  editContainer: {
    marginBottom: 8,
  },
  editLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#22C55E',
  },
  diagnosisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  diagnosisText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  careGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  careIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  careTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  careDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  factsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  factLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  factValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
});