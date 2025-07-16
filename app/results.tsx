import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, Bookmark, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle, Droplets, Sun, Thermometer, Calendar, Heart, Save, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { PlantStorage, SavedPlant } from '@/utils/storage';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { 
    imageUri, 
    plantName, 
    commonName, 
    confidence, 
    diagnosis, 
    healthStatus,
    healthScore,
    careAdvice,
    quickFacts,
    healthInsights
  } = params;
  
  const careSteps = careAdvice ? JSON.parse(careAdvice as string) : [];
  const facts = quickFacts ? JSON.parse(quickFacts as string) : {};
  const insights = healthInsights ? JSON.parse(healthInsights as string) : {};
  const score = parseInt(healthScore as string) || 50;

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

  const handleSavePlant = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const plantData: Omit<SavedPlant, 'id' | 'dateAdded'> = {
        name: plantName as string,
        commonName: commonName as string,
        imageUri: imageUri as string,
        confidence: parseInt(confidence?.toString().replace('%', '') || '50'),
        healthStatus: healthStatus as string,
        healthScore: score,
        diagnosis: diagnosis as string,
        careAdvice: careSteps,
        quickFacts: facts,
        identificationId: `plant_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      await PlantStorage.savePlant(plantData);
      setIsSaved(true);
      
      Alert.alert(
        'Plant Saved! 🌱',
        'Your plant has been added to your collection. You can view and manage it in your journal.',
        [
          { text: 'View Collection', onPress: () => router.push('/journal') },
          { text: 'Continue', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I identified a ${plantName} using PlantPal! 🌱 Health Score: ${score}/100 | Confidence: ${confidence}`,
        title: 'Plant Identification Result',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const careCategories = [
    {
      icon: Droplets,
      title: 'Watering',
      description: facts.waterFrequency || 'Water when top inch of soil is dry',
      frequency: facts.waterFrequency || 'Every 7-10 days',
      color: '#3B82F6',
    },
    {
      icon: Sun,
      title: 'Light',
      description: facts.lightRequirement || 'Bright, indirect sunlight',
      frequency: '6-8 hours daily',
      color: '#F59E0B',
    },
    {
      icon: Thermometer,
      title: 'Temperature',
      description: facts.temperature || 'Room temperature is ideal',
      frequency: facts.temperature || '65-75°F (18-24°C)',
      color: '#EF4444',
    },
    {
      icon: Heart,
      title: 'Humidity',
      description: facts.humidity || 'Moderate humidity levels',
      frequency: facts.humidity || '40-60% humidity',
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
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isSaved && styles.savedButton]} 
              onPress={handleSavePlant}
              disabled={isSaving || isSaved}
            >
              {isSaved ? (
                <CheckCircle size={20} color="#FFFFFF" />
              ) : (
                <Save size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri as string }} style={styles.plantImage} />
          <View style={styles.badgeContainer}>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{confidence} match</Text>
            </View>
            <View style={[styles.healthScoreBadge, { backgroundColor: getScoreColor(score) }]}>
              {getScoreIcon(score)}
              <Text style={styles.healthScoreText}>{score}/100</Text>
            </View>
          </View>
        </View>

        {/* Plant Info */}
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plantName}</Text>
          {commonName && (
            <Text style={styles.plantScientific}>{commonName}</Text>
          )}
          
          <View style={styles.diagnosisCard}>
            <View style={styles.diagnosisHeader}>
              {getHealthIcon(healthStatus as string)}
              <Text style={styles.diagnosisTitle}>Health Assessment</Text>
            </View>
            <Text style={[styles.diagnosisText, { color: getHealthColor(healthStatus as string) }]}>
              {diagnosis}
            </Text>
          </View>
        </View>

        {/* Health Insights */}
        {insights.overallCondition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Health Insights</Text>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Overall Condition</Text>
              <Text style={styles.insightText}>{insights.overallCondition}</Text>
            </View>

            {insights.strengths && insights.strengths.length > 0 && (
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <CheckCircle size={20} color="#22C55E" />
                  <Text style={styles.insightTitle}>Strengths</Text>
                </View>
                {insights.strengths.map((strength: string, index: number) => (
                  <Text key={index} style={styles.insightBullet}>• {strength}</Text>
                ))}
              </View>
            )}

            {insights.concerns && insights.concerns.length > 0 && (
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <Text style={styles.insightTitle}>Areas of Concern</Text>
                </View>
                {insights.concerns.map((concern: string, index: number) => (
                  <Text key={index} style={styles.insightBullet}>• {concern}</Text>
                ))}
              </View>
            )}

            {insights.recommendations && insights.recommendations.length > 0 && (
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <TrendingUp size={20} color="#3B82F6" />
                  <Text style={styles.insightTitle}>AI Recommendations</Text>
                </View>
                {insights.recommendations.map((rec: string, index: number) => (
                  <Text key={index} style={styles.insightBullet}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}

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
                <Text style={styles.careFrequency}>{category.frequency}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Step-by-Step Care */}
        {careSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Care Steps</Text>
            <View style={styles.stepsContainer}>
              {careSteps.map((step: string, index: number) => (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Facts</Text>
          <View style={styles.factsCard}>
            {facts.origin && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Origin:</Text>
                <Text style={styles.factValue}>{facts.origin}</Text>
              </View>
            )}
            {facts.difficulty && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Difficulty:</Text>
                <Text style={styles.factValue}>{facts.difficulty}</Text>
              </View>
            )}
            {facts.growthRate && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Growth Rate:</Text>
                <Text style={styles.factValue}>{facts.growthRate}</Text>
              </View>
            )}
            {facts.toxicity && (
              <View style={styles.factRow}>
                <Text style={styles.factLabel}>Toxicity:</Text>
                <Text style={styles.factValue}>{facts.toxicity}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isSaved && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSavePlant}
              disabled={isSaving}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save to Collection'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={isSaved ? styles.primaryButton : styles.secondaryButton}
            onPress={() => router.push('/camera')}
          >
            <Text style={isSaved ? styles.primaryButtonText : styles.secondaryButtonText}>
              Scan Another Plant
            </Text>
          </TouchableOpacity>
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
  actionButton: {
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
  savedButton: {
    backgroundColor: '#16A34A',
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
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  healthScoreBadge: {
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
    color: '#FFFFFF',
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
    marginBottom: 20,
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
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  insightBullet: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
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
    marginBottom: 4,
  },
  careFrequency: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#22C55E',
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
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#22C55E',
  },
});