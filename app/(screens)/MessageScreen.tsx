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
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Modal from 'react-native-modal';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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

      // Add document to Firestore Messages collection
      await addDoc(collection(db, 'Messages'), {
        name,
        email,
        phone,
        subject,
        message,
        createdAt: serverTimestamp(),
        read: false
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
      Alert.alert(
        'Error',
        'There was a problem sending your message. Please try again later.'
      );
    }
  }, [name, email, phone, subject, message, sending, onClose]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modalStyle}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
              <View style={styles.swipeIndicator} />
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Send Message</Text>
              </View>
            </View>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <BlurView intensity={50} tint="light" style={styles.formContainer}>
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
                <View style={styles.contactInfo}>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactText}>617-267-9100</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactText}>39 Newbury Street, Boston</Text>
                  </View>
                </View>
              </BlurView>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
  },
  swipeIndicator: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002d4e',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  inputWrapper: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#002d4e',
    backgroundColor: '#F5F5F5',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#002d4e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
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
  contactInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#002d4e',
    fontWeight: '500',
  },
});

export default MessageScreen;