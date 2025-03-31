import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import { Watch } from '../types/Watch';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebaseConfig';

interface FormData {
  reference: string;
  phoneNumber: string;
  email: string;
  photo: string | null;
  tradeDetails: string;
}

interface DedicatedTradeModalProps {
  visible: boolean;
  onClose: () => void;
  watch?: Watch;
}

const DedicatedTradeModal: React.FC<DedicatedTradeModalProps> = ({
  visible,
  onClose,
  watch,
}) => {
  const [formData, setFormData] = useState<FormData>({
    reference: '',
    phoneNumber: '',
    email: '',
    photo: null,
    tradeDetails: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const updateField = useCallback(
    (field: keyof FormData, value: string | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

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

  const handleSubmit = useCallback(async () => {
    if (!formData.reference && !formData.photo) {
      Alert.alert(
        'Missing Information',
        'Please provide a reference number or add a photo of your watch.'
      );
      return;
    }
    if (!formData.phoneNumber) {
      Alert.alert('Missing Information', 'Please provide your contact number.');
      return;
    }
    if (!formData.email) {
      Alert.alert('Missing Information', 'Please provide your email address.');
      return;
    }
    if (!formData.tradeDetails) {
      Alert.alert(
        'Missing Information',
        'Please provide details about the watch you want to trade.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoURL = null;
      
      if (formData.photo) {
        const storage = getStorage();
        const timestamp = new Date().getTime();
        const reference = formData.reference ? formData.reference.replace(/[^a-zA-Z0-9]/g, '') : 'noref';
        const filename = `${reference}_${timestamp}.jpg`;
        const fullPath = `trade-photos/${filename}`;
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
        tradeDetails: formData.tradeDetails,
        photoURL: photoURL,
        photoPath: formData.photo ? `trade-photos/${formData.reference || 'noref'}_${new Date().getTime()}.jpg` : null,
        createdAt: new Date().toISOString(),
        ...(watch && {
          watchBrand: watch.brand,
          watchModel: watch.model,
          watchPrice: watch.price,
          watchReference: watch.referenceNumber,
          watchId: watch.id,
        }),
      };

      const tradeRef = collection(db, 'TradeRequests');
      await addDoc(tradeRef, payload);
      
      Alert.alert(
        'Trade Request Sent',
        'Thank you! Your trade request has been sent. We will contact you shortly to discuss the trade details.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Could not submit your trade request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onClose, watch]);

  // Display only the clicked watch image (without any fallback placeholder)
  const renderWatchDetails = useCallback(() => {
    if (!watch) return null;

    let watchImageUri;
    if (Array.isArray(watch.images) && watch.images.length > 0) {
      watchImageUri = watch.images[0];
    } else if (watch.image && typeof watch.image === 'string') {
      watchImageUri = watch.image;
    }

    return (
      <View style={styles.watchInfoContainer}>
        {watchImageUri && (
          <Image 
            source={{ uri: watchImageUri }} 
            style={styles.watchImage} 
            resizeMode="cover" 
          />
        )}
        <View style={styles.watchDetails}>
          <Text style={styles.watchBrand}>{watch.brand}</Text>
          <Text style={styles.watchTitle}>{watch.model}</Text>
          {watch.price && (
            <Text style={styles.priceText}>${watch.price.toLocaleString()}</Text>
          )}
        </View>
      </View>
    );
  }, [watch]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={500}       // Smoother slide in timing
      animationOutTiming={500}      // Smoother slide out timing
      style={styles.modalStyle}
      propagateSwipe={true}
      backdropOpacity={0.5}
      avoidKeyboard={false}
      statusBarTranslucent
      useNativeDriver={true}        // Enable native driver for smoother animations
    >
      <View style={styles.modalContainer}>
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trade Request</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderWatchDetails()}

          <View style={styles.formSection}>
            <View style={styles.rowContainer}>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Reference Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reference}
                  onChangeText={(text) => updateField('reference', text)}
                  placeholder="Ref Number"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={[styles.inputWrap, { marginLeft: 12 }]}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateField('phoneNumber', text)}
                  placeholder="Phone Number"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="email@example.com"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trade Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.tradeDetails}
                onChangeText={(text) => updateField('tradeDetails', text)}
                placeholder="Describe the watch you'd like to trade (brand, model, condition)"
                placeholderTextColor="#888"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.photoSection}>
              <Text style={styles.label}>Watch Photos</Text>
              {formData.photo ? (
                <View style={styles.photoPreviewContainer}>
                  <Image 
                    source={{ uri: formData.photo }} 
                    style={styles.photoPreview}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => updateField('photo', null)}
                  >
                    <Ionicons name="close-circle" size={28} color="#C0392B" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.photoButton} 
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={28} color="#002d4e" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.photoButton} 
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={28} color="#002d4e" />
                    <Text style={styles.photoButtonText}>Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.helperText}>
                {formData.photo 
                  ? "Tap the X to change the photo" 
                  : "A clear photo helps us with your valuation"}
              </Text>
            </View>
            
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Trade Request
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DedicatedTradeModal;

const styles = StyleSheet.create({
  modalStyle: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '95%',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#002d4e',
  },
  scrollView: {
    maxHeight: '75%',
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  formSection: {
    paddingBottom: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrap: {
    flex: 1,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#002d4e',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  photoSection: {
    marginVertical: 5,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  photoButton: {
    flex: 0.48,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  photoButtonText: {
    color: '#002d4e',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  photoPreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 30,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#002d4e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  /* Styles for Watch Info */
  watchInfoContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
    alignItems: 'center',
  },
  watchImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  watchDetails: {
    flex: 1,
  },
  watchBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002d4e',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  watchTitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002d4e',
    letterSpacing: 0.3,
  },
});
