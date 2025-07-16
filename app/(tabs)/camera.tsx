import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, RotateCcw, Image as ImageIcon, X, Loader, Upload } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loader size={48} color="#22C55E" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📸</Text>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>
            PlantPal needs camera access to identify your plants and provide care recommendations.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          imageType: 'jpg',
        });
        if (photo) {
          setCapturedImage(photo.uri);
          setCapturedImageBase64(photo.base64 || null);
          setImageMimeType('image/jpeg');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        setCapturedImageBase64(asset.base64 || null);
        
        // Determine MIME type from file extension or default to jpeg
        const uri = asset.uri.toLowerCase();
        if (uri.includes('.png')) {
          setImageMimeType('image/png');
        } else if (uri.includes('.webp')) {
          setImageMimeType('image/webp');
        } else {
          setImageMimeType('image/jpeg');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzePlant = async () => {
    if (!capturedImage || !capturedImageBase64) {
      Alert.alert('Error', 'No image data available. Please take a photo first.');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUri: capturedImage,
          imageBase64: capturedImageBase64,
          mimeType: imageMimeType
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        if (result.error === 'NOT_A_PLANT') {
          // Show what the object actually is
          const objectInfo = result.objectInfo;
          Alert.alert(
            `That's ${objectInfo?.objectType || 'not a plant'}!`,
            `I can see this is ${objectInfo?.objectName || 'something other than a plant'}.\n\n${objectInfo?.explanation || ''}\n\n${objectInfo?.whyNotPlant || 'PlantPal is designed to help you care for plants, flowers, and trees. Please take a photo of a botanical specimen instead.'}`,
            [
              { text: 'Learn More', onPress: () => {
                Alert.alert(
                  'About PlantPal',
                  'PlantPal helps you identify and care for:\n\n🌱 Houseplants\n🌸 Flowers\n🌿 Herbs\n🌳 Trees\n🌵 Succulents\n🍃 Garden plants\n\nTake a photo of any plant to get care tips, watering schedules, and health assessments!'
                );
              }},
              { text: 'Try Again', onPress: retakePicture, style: 'default' }
            ]
          );
          return;
        } else {
          throw new Error(result.message || 'Analysis failed');
        }
      }

      const data = result.data;
      
      router.push({
        pathname: '/results',
        params: {
          imageUri: capturedImage,
          plantName: data.plantName,
          commonName: data.commonName,
          confidence: `${data.confidence}%`,
          diagnosis: data.diagnosis,
          healthStatus: data.healthStatus,
          healthScore: data.healthScore.toString(),
          careAdvice: JSON.stringify(data.careAdvice),
          quickFacts: JSON.stringify(data.quickFacts),
          healthInsights: JSON.stringify(data.healthInsights)
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        'Failed to analyze the plant. Please check your internet connection and try again with a clearer photo.',
        [{ text: 'Try Again', onPress: retakePicture }]
      );
    } finally {
      setIsAnalyzing(false);
      setCapturedImage(null);
      setCapturedImageBase64(null);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setCapturedImageBase64(null);
    setImageMimeType('image/jpeg');
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.closeButton} onPress={retakePicture}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                <RotateCcw size={24} color="#374151" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.analyzeButton} 
                onPress={analyzePlant}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader size={24} color="#FFFFFF" />
                ) : (
                  <ImageIcon size={24} color="#FFFFFF" />
                )}
                <Text style={styles.analyzeButtonText}>
                  {isAnalyzing ? 'Analyzing...' : 'Identify Plant'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.topControls}>
              <Text style={styles.instructionText}>Point camera at your plant</Text>
            </View>
            
            <View style={styles.centerFrame}>
              <View style={[styles.frameCorner, styles.topLeft]} />
              <View style={[styles.frameCorner, styles.topRight]} />
              <View style={[styles.frameCorner, styles.bottomLeft]} />
              <View style={[styles.frameCorner, styles.bottomRight]} />
            </View>
            
            <View style={styles.bottomControls}>
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                  <RotateCcw size={28} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner}>
                    <Camera size={32} color="#22C55E" />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Upload size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.tipText}>
                📸 Take photo or choose from gallery
              </Text>
            </View>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  permissionEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  centerFrame: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#22C55E',
    borderWidth: 3,
  },
  topLeft: {
    top: -100,
    left: -100,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -100,
    right: -100,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -100,
    left: -100,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -100,
    right: -100,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewActions: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});