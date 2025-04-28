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
import { FixedHeader } from '../components/FixedHeader';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebaseConfig';
import { Watch } from '../types/Watch';
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { isDark, colors, styles: themeStyles } = useThemedStyles();

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
    <View style={[styles.mainContainer, { backgroundColor: isDark ? colors.background : '#ffffff' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
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
            <View style={[styles.stepLineBackground, { backgroundColor: isDark ? '#444' : '#E0E0E0' }]} />
            <View style={styles.stepLineProgressContainer}>
              <View
                style={[
                  styles.stepLineProgress,
                  { backgroundColor: colors.primary },
                  currentStep === 1 
                    ? { width: (SCREEN_WIDTH - 48) / 2 - 18 } 
                    : { width: SCREEN_WIDTH - 48 - 36 }
                ]}
              />
            </View>
            <View style={styles.stepsRow}>
              <View style={[styles.stepCircleContainer, { 
                backgroundColor: isDark ? colors.background : '#FFFFFF',
                shadowColor: isDark ? '#000' : '#000',
              }]}>
                <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberActive}>1</Text>
                </View>
              </View>
              
              <View style={[styles.stepCircleContainer, { 
                backgroundColor: isDark ? colors.background : '#FFFFFF',
                shadowColor: isDark ? '#000' : '#000',
              }]}>
                {currentStep >= 2 ? (
                  <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberActive}>2</Text>
                  </View>
                ) : (
                  <View style={[styles.inactiveStep, { 
                    backgroundColor: isDark ? colors.background : '#FFFFFF',
                    borderColor: isDark ? '#555' : '#E0E0E0',
                  }]}>
                    <Text style={[styles.stepNumberInactive, { color: isDark ? '#888' : '#888888' }]}>2</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Mode Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: isDark ? '#222' : '#F5F7FA' }]}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.toggleButton,
                  activeMode === mode && [styles.toggleButtonActive, { backgroundColor: colors.primary }],
                  currentStep === 2 && (activeMode !== mode ? styles.toggleButtonDisabled : {}),
                ]}
                onPress={() => currentStep === 1 && setActiveMode(mode)}
                disabled={currentStep === 2}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    { color: isDark ? colors.primary : '#002d4e' },
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
            <BlurView intensity={10} tint={isDark ? "dark" : "light"} style={[styles.watchCard, {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 45, 78, 0.08)',
            }]}>
              <View style={[styles.watchIconContainer, {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 45, 78, 0.08)',
              }]}>
                <Ionicons name="watch-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.watchInfoContent}>
                <Text style={[styles.watchBrand, { color: colors.primary }]}>{watchData.brand}</Text>
                <Text style={[styles.watchModel, { color: colors.text }]}>{watchData.model}</Text>
                <Text style={[styles.watchPrice, { color: colors.primary }]}>${watchData.price?.toLocaleString()}</Text>
              </View>
            </BlurView>
          )}

          {/* Step 1: Watch Information */}
          {currentStep === 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Watch Details</Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Reference Number</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDark ? '#333' : '#FFFFFF',
                    color: colors.text,
                    borderColor: isDark ? '#555' : '#E0E0E0',
                  }]}
                  value={formData.reference}
                  onChangeText={(text) => updateField('reference', text)}
                  placeholder="Enter watch reference (e.g., 116610LN)"
                  placeholderTextColor={isDark ? "#aaa" : "#8E8E8E"}
                />
              </View>
              <View style={styles.photoSection}>
                <Text style={[styles.label, { color: colors.primary }]}>Watch Photo *</Text>
                {formData.photo ? (
                  <View style={[styles.photoPreviewContainer, {
                    borderColor: isDark ? '#555' : '#E0E0E0',
                  }]}>
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
                    <TouchableOpacity style={[styles.photoButton, {
                      backgroundColor: isDark ? '#333' : '#FAFAFA',
                      borderColor: isDark ? '#555' : '#E0E0E0',
                    }]} onPress={takePhoto}>
                      <Ionicons name="camera-outline" size={28} color={colors.primary} />
                      <Text style={[styles.photoButtonText, { color: colors.primary }]}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.photoButton, {
                      backgroundColor: isDark ? '#333' : '#FAFAFA',
                      borderColor: isDark ? '#555' : '#E0E0E0',
                    }]} onPress={pickImage}>
                      <Ionicons name="image-outline" size={28} color={colors.primary} />
                      <Text style={[styles.photoButtonText, { color: colors.primary }]}>Upload Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[styles.helperText, { color: isDark ? '#ccc' : '#666666' }]}>
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
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Contact Information</Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDark ? '#333' : '#FFFFFF',
                    color: colors.text,
                    borderColor: isDark ? '#555' : '#E0E0E0',
                  }]}
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateField('phoneNumber', text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={isDark ? "#aaa" : "#8E8E8E"}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDark ? '#333' : '#FFFFFF',
                    color: colors.text,
                    borderColor: isDark ? '#555' : '#E0E0E0',
                  }]}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="Enter your email address"
                  placeholderTextColor={isDark ? "#aaa" : "#8E8E8E"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Message (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, {
                    backgroundColor: isDark ? '#333' : '#FFFFFF',
                    color: colors.text,
                    borderColor: isDark ? '#555' : '#E0E0E0',
                  }]}
                  value={formData.message}
                  onChangeText={(text) => updateField('message', text)}
                  placeholder="Add any additional information or questions"
                  placeholderTextColor={isDark ? "#aaa" : "#8E8E8E"}
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
                style={[styles.backButton, {
                  backgroundColor: isDark ? '#333' : '#f5f5f5',
                  borderColor: isDark ? '#555' : '#e0e0e0',
                }]}
                onPress={handleBackPress}
                activeOpacity={0.85}
              >
                <View style={styles.backButtonContent}>
                  <Ionicons name="arrow-back" size={18} color={colors.primary} />
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                { backgroundColor: colors.primary },
                !canProceed && styles.primaryButtonDisabled,
                currentStep === 2 ? { flex: 2 } : { flex: 1 }
              ]}
              onPress={handleSubmit}
              disabled={!canProceed || isSubmitting}
            >
              <View style={styles.primaryButtonContent}>
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
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    zIndex: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
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
    borderWidth: 1,
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
  },
  // Toggle Buttons
  toggleContainer: {
    flexDirection: 'row',
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
  },
  toggleButtonDisabled: {
    opacity: 0.3,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  watchModel: {
    fontSize: 14,
    marginBottom: 6,
  },
  watchPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Form Elements
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
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
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  photoButtonText: {
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
  primaryButtonContent: {
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
  // Back Button
  backButton: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    marginRight: 6,
    borderWidth: 1,
  },
  backButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});