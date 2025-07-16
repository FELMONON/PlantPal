import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Loader } from 'lucide-react-native';

export default function ImageAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { imageUri, imageBase64 } = params;
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    analyzePlant();
  }, []);

  const analyzePlant = async () => {
    if (!imageUri || !imageBase64) {
      Alert.alert('Error', 'No image data available');
      router.back();
      return;
    }

    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUri: imageUri as string,
          imageBase64: imageBase64 as string,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error === 'NOT_A_PLANT') {
          Alert.alert(
            'Not a Plant',
            result.message || 'This image does not contain a plant. Please take a photo of a plant, flower, or other botanical specimen.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        } else {
          throw new Error(result.message || 'Analysis failed');
        }
      }

      const data = result.data;

      // Navigate to results screen with real data
      router.replace({
        pathname: '/results',
        params: {
          imageUri: imageUri as string,
          plantName: data.plantName,
          commonName: data.commonName,
          confidence: `${data.confidence}%`,
          diagnosis: data.diagnosis,
          healthStatus: data.healthStatus,
          careAdvice: JSON.stringify(data.careAdvice),
          quickFacts: JSON.stringify(data.quickFacts),
        },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        'Failed to analyze the plant. Please try again with a clearer photo.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri as string }} style={styles.image} />
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <Loader size={48} color="#FFFFFF" />
              <Text style={styles.loadingText}>Analyzing your plant...</Text>
              <Text style={styles.loadingSubtext}>
                Our AI is identifying the species and assessing health
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
});