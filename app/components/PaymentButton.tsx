// components/PaymentButton.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

interface PaymentButtonProps {
  amount: number;
  watchId: string | number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: any) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ 
  amount, 
  watchId, 
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  // Function to initialize the payment sheet
  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Call your backend API to create a payment intent
      const response = await fetch('https://your-backend-api.com/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents for Stripe
          currency: 'usd',
          watchId: watchId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { paymentIntent, ephemeralKey, customer } = await response.json();
      
      // Initialize the payment sheet
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: 'Shreve, Crump & Low',
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: true, // Set to false in production
        },
        allowsDelayedPaymentMethods: true,
        style: 'automatic',
      });
      
      if (error) {
        console.error('Error initializing payment sheet:', error);
        onPaymentError?.(error);
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to present the payment sheet
  const handlePayment = async () => {
    await initializePayment();
    const { error } = await presentPaymentSheet();
    
    if (error) {
      console.error('Payment failed:', error);
      onPaymentError?.(error);
    } else {
      // Payment successful
      console.log('Payment successful!');
      onPaymentSuccess?.();
    }
  };

  // Get the appropriate button text based on platform
  const getButtonText = () => {
    if (Platform.OS === 'ios') {
      return 'Pay with Apple Pay';
    } else if (Platform.OS === 'android') {
      return 'Pay with Google Pay';
    }
    return 'Purchase';
  };

  return (
    <TouchableOpacity 
      style={styles.paymentButton} 
      onPress={handlePayment}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  paymentButton: {
    backgroundColor: '#002d4e',
    flex: 1,
    height: 50,
    marginVertical: 8,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentButton;