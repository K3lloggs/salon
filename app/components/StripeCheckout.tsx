// app/components/StripeCheckout.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const StripeCheckout = ({ watch, onSuccess, onCancel }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");
  const [processing, setProcessing] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // Format price for display
  const formattedPrice = watch?.price
    ? `$${watch.price.toLocaleString()}`
    : "$0";

  // Validate form fields
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Please enter your shipping address");
      return false;
    }
    if (!city.trim()) {
      Alert.alert("Error", "Please enter your city");
      return false;
    }
    if (!zipCode.trim()) {
      Alert.alert("Error", "Please enter your ZIP/Postal code");
      return false;
    }
    if (!state.trim()) {
      Alert.alert("Error", "Please enter your state");
      return false;
    }
    return true;
  };

  // Initialize the payment sheet
  const initializePayment = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      // Get functions instance from the current app
      const functions = getFunctions(getApp());
      const firestore = getFirestore(getApp());
      
      // Save shipping information to Firestore first
      const shippingInfoId = `shipping_${Date.now()}`;
      const shippingInfo = {
        name,
        email,
        phone,
        address,
        city,
        zipCode,
        state,
        country,
        watchId: watch.id,
        watchBrand: watch.brand,
        watchModel: watch.model,
        watchPrice: watch.price,
        createdAt: new Date().toISOString(),
      };
      
      // Save shipping info to Firestore
      await setDoc(doc(firestore, "shippingInfo", shippingInfoId), shippingInfo);
      
      // Call Firebase function to create payment intent
      const createPaymentIntentFn = httpsCallable(
        functions,
        "createPaymentIntent"
      );

      // Convert price to cents for Stripe
      const amountInCents = Math.round(parseFloat(watch.price) * 100);

      const response = await createPaymentIntentFn({
        amount: amountInCents,
        currency: "usd",
        watchId: watch.id,
        description: `Purchase of ${watch.brand} ${watch.model}`,
        shippingInfoId: shippingInfoId, // Pass shipping info ID to link with payment
        shipping: {
          name,
          email,
          phone,
          address,
          city,
          zipCode,
          state,
          country
        },
        customerEmail: email // Make sure to pass the customer email for confirmation
      });
      
      const { clientSecret } = response.data as { clientSecret: string };
      
      if (!clientSecret) {
        throw new Error("Failed to receive client secret from server");
      }

      // Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Watch Salon",
        style: 'automatic',
        defaultBillingDetails: {
          name,
          email,
          phone,
          address: {
            line1: address,
            city,
            postalCode: zipCode,
            state,
            country,
          },
        },
        allowsDelayedPaymentMethods: true,
        returnURL: 'watchsalon://stripe-redirect',
      });

      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        Alert.alert("Error", initError.message);
        setProcessing(false);
        return;
      }

      // Open the payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          // User canceled, just close silently
          setProcessing(false);
          return;
        }

        console.error("Error presenting payment sheet:", presentError);
        Alert.alert("Error", presentError.message);
        setProcessing(false);
        return;
      }

      // If we get here, payment was successful
      Alert.alert("Success", "Your purchase was successful! We'll contact you shortly with shipping details and send you a confirmation email.", [
        {
          text: "OK",
          onPress: () => {
            setModalVisible(false);
            if (onSuccess) onSuccess();
          },
        },
      ]);
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Error",
        "There was a problem processing your payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Pressable
        style={styles.buyButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buyButtonText}>Purchase</Text>
      </Pressable>

      {/* Checkout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!processing) {
            setModalVisible(false);
            if (onCancel) onCancel();
          }
        }}
      >
        <SafeAreaView style={styles.centeredView}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.modalView}>
              <ScrollView style={styles.scrollView}>
                <Text style={styles.modalTitle}>Complete Your Purchase</Text>
                <Text style={styles.watchTitle}>
                  {watch.brand} {watch.model}
                </Text>
                <Text style={styles.priceText}>{formattedPrice}</Text>

                <View style={styles.formContainer}>
                  <Text style={styles.sectionTitle}>Shipping Information</Text>

                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    editable={!processing}
                    autoCapitalize="words"
                  />

                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!processing}
                  />

                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    editable={!processing}
                  />

                  <Text style={styles.inputLabel}>Street Address</Text>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your street address"
                    editable={!processing}
                  />

                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter your city"
                    editable={!processing}
                  />

                  <View style={styles.rowContainer}>
                    <View style={styles.halfColumn}>
                      <Text style={styles.inputLabel}>ZIP/Postal Code</Text>
                      <TextInput
                        style={styles.input}
                        value={zipCode}
                        onChangeText={setZipCode}
                        placeholder="ZIP Code"
                        keyboardType="numeric"
                        editable={!processing}
                      />
                    </View>

                    <View style={styles.halfColumn}>
                      <Text style={styles.inputLabel}>State</Text>
                      <TextInput
                        style={styles.input}
                        value={state}
                        onChangeText={setState}
                        placeholder="State"
                        editable={!processing}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="Country"
                    editable={!processing}
                  />

                  <View style={styles.buttonContainer}>
                    {processing ? (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color="#002D4E" />
                        <Text style={styles.processingText}>
                          Processing your payment...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Pressable
                          style={styles.payButton}
                          onPress={initializePayment}
                        >
                          <Text style={styles.payButtonText}>
                            Pay {formattedPrice}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.cancelButton}
                          onPress={() => {
                            setModalVisible(false);
                            if (onCancel) onCancel();
                          }}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buyButton: {
    backgroundColor: "#002D4E",
    flex: 1,
    height: 50,
    marginVertical: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  centeredView: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "95%",
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#002D4E",
    marginTop: 20,
    marginBottom: 4,
    textAlign: "center",
  },
  watchTitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#002D4E",
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfColumn: {
    width: "48%",
  },
  buttonContainer: {
    marginTop: 24,
  },
  payButton: {
    backgroundColor: "#002D4E",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#444",
    fontSize: 16,
    fontWeight: "500",
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    color: "#002D4E",
  },
});

export default StripeCheckout;