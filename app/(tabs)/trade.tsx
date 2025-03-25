import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FixedHeader } from '../components/FixedHeader';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebaseConfig';
import { Watch } from '../types/Watch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define gradient colors for consistent use throughout the app
// Updated to more subtle colors with better contrast
const GRADIENT_COLORS: [string, string, string] = ['#ffffff', '#f2f8fd', '#e5f1fa'];

// Change gradient direction from left-to-right to top-left to bottom-right
const GRADIENT_START = { x: 0, y: 0 }; // Top-left
const GRADIENT_END = { x: 1, y: 1 }; // Bottom-right

// Button gradient colors with more contrast
const BUTTON_GRADIENT_COLORS: [string, string] = ['#003a64', '#002d4e'];

// Step indicator gradient for better visibility
const STEP_GRADIENT_COLORS: [string, string] = ['#003a64', '#002d4e'];

type Mode = 'trade' | 'sell' | 'request';

interface FormData {
  reference: string;
  phoneNumber: string;
  email: string;
  message: string;
  photo: string | null;
}

const MODES: Mode[] = ['trade', 'sell', 'request'];

export default function TradeScreen() {
  const router = useRouter();
  const { watch } = useLocalSearchParams() as { watch?: string };
  const watchData: Watch | undefined = watch ? JSON.parse(watch) : undefined;

  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const [formData, setFormData] = useState<FormData>({
    reference: '',
    phoneNumber: '',
    email: '',
    message: '',
    photo: null,
  });
  const [activeMode, setActiveMode] = useState<Mode>('trade');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Helper to update form fields
  const updateField = useCallback(
    (field: keyof FormData, value: string | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleBackPress = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  }, [currentStep, router]);

  const takePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is required to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      updateField('photo', result.assets[0].uri);
    }
  }, [updateField]);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      updateField('photo', result.assets[0].uri);
    }
  }, [updateField]);

  const resetForm = useCallback(() => {
    setFormData({
      reference: '',
      phoneNumber: '',
      email: '',
      message: '',
      photo: null,
    });
    setCurrentStep(1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (currentStep === 1) {
      if (!formData.photo) {
        Alert.alert('Missing Information', 'Please add a photo of your watch');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (!formData.phoneNumber) {
      Alert.alert('Missing Information', 'Please provide your phone number');
      return;
    }

    if (!formData.email) {
      Alert.alert('Missing Information', 'Please provide your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    const collectionName =
      activeMode === 'trade'
        ? 'TradeRequests'
        : activeMode === 'sell'
        ? 'SellRequests'
        : 'Requests';

    try {
      let photoURL = null;
      if (formData.photo) {
        const storage = getStorage();
        const storageFolder = 
          activeMode === 'trade' ? 'trade-photos' : 
          activeMode === 'sell' ? 'sell-photos' : 'request-photos';
        const timestamp = new Date().getTime();
        const reference = formData.reference ? formData.reference.replace(/[^a-zA-Z0-9]/g, '') : 'noref';
        const filename = `${reference}_${timestamp}.jpg`;
        const fullPath = `${storageFolder}/${filename}`;
        const storageRef = ref(storage, fullPath);
        const response = await fetch(formData.photo);
        const blob = await response.blob();
        const uploadTask = uploadBytesResumable(storageRef, blob);
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              photoURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(undefined);
            }
          );
        });
      }

      const payload = {
        reference: formData.reference,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        message: formData.message,
        photoURL: photoURL,
        photoPath: formData.photo ? `${activeMode}-photos/${formData.reference || 'noref'}_${new Date().getTime()}.jpg` : null,
        createdAt: new Date().toISOString(),
        mode: activeMode,
        ...(watchData && {
          watchBrand: watchData.brand,
          watchModel: watchData.model,
          watchPrice: watchData.price,
          watchId: watchData.id,
        }),
      };

      const reqRef = collection(db, collectionName);
      await addDoc(reqRef, payload);
      
      Alert.alert(
        'Request Submitted',
        `Thank you! Your ${activeMode} request has been sent. We'll be in touch soon.`,
        [
          { 
            text: 'Back to Watches', 
            onPress: () => {
              resetForm();
              router.replace('/');
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Could not submit your request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeMode, formData, resetForm, watchData, currentStep, router]);

  const canProceed = useMemo(() => {
    if (currentStep === 1) {
      return !!formData.photo;
    } else {
      return !!formData.phoneNumber && !!formData.email;
    }
  }, [formData, currentStep]);

  const actionButtonText = useMemo(() => {
    if (currentStep === 1) {
      return 'Continue';
    } else {
      return activeMode === 'request' 
        ? 'Submit Request' 
        : `Submit ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Request`;
    }
  }, [currentStep, activeMode]);

  const headerText = useMemo(() => {
    switch (activeMode) {
      case 'trade':
        return 'Trade In Your Watch';
      case 'sell':
        return 'Sell Your Watch';
      case 'request':
        return 'Request Information';
    }
  }, [activeMode]);

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.mainContainer}
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <FixedHeader 
        title={headerText}
        showBackButton={false}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={styles.stepLineBackground} />
            <View style={styles.stepLineProgressContainer}>
              <LinearGradient
                colors={STEP_GRADIENT_COLORS}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={[
                  styles.stepLineProgress,
                  currentStep === 1 
                    ? { width: (SCREEN_WIDTH - 48) / 2 - 18 } 
                    : { width: SCREEN_WIDTH - 48 - 36 }
                ]}
              />
            </View>
            <View style={styles.stepsRow}>
              <View style={styles.stepCircleContainer}>
                <LinearGradient
                  colors={STEP_GRADIENT_COLORS}
                  start={GRADIENT_START}
                  end={GRADIENT_END}
                  style={styles.stepCircle}
                >
                  <Text style={styles.stepNumberActive}>1</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.stepCircleContainer}>
                {currentStep >= 2 ? (
                  <LinearGradient
                    colors={STEP_GRADIENT_COLORS}
                    start={GRADIENT_START}
                    end={GRADIENT_END}
                    style={styles.stepCircle}
                  >
                    <Text style={styles.stepNumberActive}>2</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveStep}>
                    <Text style={styles.stepNumberInactive}>2</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Mode Toggle */}
          <View style={styles.toggleContainer}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.toggleButton,
                  activeMode === mode && styles.toggleButtonActive,
                  currentStep === 2 && (activeMode !== mode ? styles.toggleButtonDisabled : {}),
                ]}
                onPress={() => currentStep === 1 && setActiveMode(mode)}
                disabled={currentStep === 2}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    activeMode === mode && styles.toggleButtonTextActive,
                    currentStep === 2 && (activeMode !== mode ? styles.toggleButtonTextDisabled : {}),
                  ]}
                >
                  {mode === 'request' ? 'REQUEST' : mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Watch Information Card */}
          {watchData && isFocused && (
            <BlurView intensity={10} tint="light" style={styles.watchCard}>
              <View style={styles.watchIconContainer}>
                <Ionicons name="watch-outline" size={24} color="#002d4e" />
              </View>
              <View style={styles.watchInfoContent}>
                <Text style={styles.watchBrand}>{watchData.brand}</Text>
                <Text style={styles.watchModel}>{watchData.model}</Text>
                <Text style={styles.watchPrice}>${watchData.price?.toLocaleString()}</Text>
              </View>
            </BlurView>
          )}

          {/* Step 1: Watch Information */}
          {currentStep === 1 && (
            <>
              <Text style={styles.sectionTitle}>Watch Details</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reference Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reference}
                  onChangeText={(text) => updateField('reference', text)}
                  placeholder="Enter watch reference (e.g., 116610LN)"
                  placeholderTextColor="#8E8E8E"
                />
              </View>
              <View style={styles.photoSection}>
                <Text style={styles.label}>Watch Photo *</Text>
                {formData.photo ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: formData.photo }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => updateField('photo', null)}
                    >
                      <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoButtonsContainer}>
                    <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                      <Ionicons name="camera-outline" size={28} color="#002d4e" />
                      <Text style={styles.photoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                      <Ionicons name="image-outline" size={28} color="#002d4e" />
                      <Text style={styles.photoButtonText}>Upload Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.helperText}>
                  {formData.photo 
                    ? "Tap the photo to change it" 
                    : "* Photo required: A clear photo helps us with your valuation"}
                </Text>
              </View>
            </>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateField('phoneNumber', text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="Enter your email address"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.message}
                  onChangeText={(text) => updateField('message', text)}
                  placeholder="Add any additional information or questions"
                  placeholderTextColor="#8E8E8E"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {currentStep === 2 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ffffff', '#f5f5f5']}
                  start={GRADIENT_START}
                  end={GRADIENT_END}
                  style={styles.backButtonGradient}
                >
                  <Ionicons name="arrow-back" size={18} color="#002d4e" />
                  <Text style={styles.backButtonText}>Back</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                !canProceed && styles.primaryButtonDisabled,
                currentStep === 2 ? { flex: 2 } : { flex: 1 }
              ]}
              onPress={handleSubmit}
              disabled={!canProceed || isSubmitting}
            >
              <LinearGradient
                colors={BUTTON_GRADIENT_COLORS}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={styles.primaryButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>{actionButtonText}</Text>
                    <Ionicons 
                      name={currentStep === 1 ? "arrow-forward" : "paper-plane-outline"} 
                      size={18} 
                      color="#FFFFFF" 
                      style={styles.primaryButtonIcon}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  // Progress Indicator
  stepIndicator: {
    width: '100%',
    marginBottom: 28,
    marginTop: 10,
    height: 36,
    position: 'relative',
  },
  stepLineBackground: {
    position: 'absolute',
    top: 16,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  stepLineProgressContainer: {
    position: 'absolute',
    top: 16,
    left: 18,
    height: 2,
    zIndex: 2,
  },
  stepLineProgress: {
    height: 4,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  stepCircleContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveStep: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  // Toggle Buttons
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 28,
    width: '100%',
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#002d4e',
  },
  toggleButtonDisabled: {
    opacity: 0.3,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d4e',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleButtonTextDisabled: {
    color: '#999999',
  },
  // Watch Information Card
  watchCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 45, 78, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  watchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 45, 78, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  watchInfoContent: {
    flex: 1,
  },
  watchBrand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002d4e',
    marginBottom: 4,
  },
  watchModel: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 6,
  },
  watchPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d4e',
  },
  // Form Elements
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002d4e',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d4e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  photoSection: {
    width: '100%',
    marginBottom: 28,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 0.48,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: '#002d4e',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoPreview: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  // Buttons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonIcon: {
    marginLeft: 8,
  },
  // Back Button (Simplified)
  backButton: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    marginRight: 6,
  },
  backButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#002d4e',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});