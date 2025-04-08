import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardTypeOptions,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { BlurView } from 'expo-blur'; // Add this import if not already using expo-blur

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MessageScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface CustomInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  style?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const CustomInput: React.FC<CustomInputProps> = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  style,
  autoCapitalize = 'none',
}) => (
  <View style={styles.inputWrapper}>
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      placeholderTextColor="#8E8E93"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      returnKeyType="done"
      accessible
      accessibilityLabel={placeholder}
    />
  </View>
);

const MessageScreen: React.FC<MessageScreenProps> = ({ visible, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleSend = useCallback(async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setSending(true);

      await addDoc(collection(db, 'Messages'), {
        name,
        email,
        phone,
        subject,
        message,
        createdAt: serverTimestamp(),
        read: false,
      });

      // Reset form and close modal
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setSending(false);

      Alert.alert(
        'Message Sent',
        'Thank you for your message. We will get back to you soon.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      setSending(false);
      console.error('Error sending message:', error);
      Alert.alert('Error', 'There was a problem sending your message. Please try again later.');
    }
  }, [name, email, phone, subject, message, onClose]);

  const resetAndClose = () => {
    // Clear form when closing
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={resetAndClose}
      onBackButtonPress={resetAndClose}
      swipeDirection={['down']}
      onSwipeComplete={resetAndClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={500}
      animationOutTiming={500}
      style={styles.modalStyle}
      propagateSwipe={true}
      backdropOpacity={0.5}
      statusBarTranslucent
      useNativeDriver
      deviceHeight={SCREEN_HEIGHT}
    >
      <BlurView intensity={10} tint="light" style={styles.blurContainer}>
        <View style={styles.modalContainer}>
          {/* Drag Handle */}
          <TouchableWithoutFeedback onPress={resetAndClose}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
          </TouchableWithoutFeedback>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Send Message</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={resetAndClose}
              hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.formContainer}>
                <CustomInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <CustomInput
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <CustomInput
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <CustomInput
                  placeholder="Subject"
                  value={subject}
                  onChangeText={setSubject}
                />
                <CustomInput
                  placeholder="Your Message"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  style={styles.messageInput}
                />
              </View>
            </TouchableWithoutFeedback>

            {/* Fixed Button Container */}
            <SafeAreaView style={styles.buttonSafeArea}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.sendButton, sending && styles.disabledButton]}
                  onPress={handleSend}
                  disabled={sending}
                  accessibilityRole="button"
                  accessibilityLabel="Send Message"
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendButtonText}>SEND MESSAGE</Text>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: '#F2F3F5', // Light grey background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#002d4e',
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: '#666666',
  },
  keyboardAvoiding: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#333333',
    backgroundColor: 'transparent',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonSafeArea: {
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sendButton: {
    backgroundColor: '#002d4e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#002d4e',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabledButton: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default MessageScreen;