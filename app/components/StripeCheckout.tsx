import React, { useState, useMemo } from "react";
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
  TouchableOpacity,
  Image,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { doc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { Feather } from "@expo/vector-icons";

// Note: The publishable key should be set in your app's root component using StripeProvider,
// not in this component directly.


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
  const formattedPrice = useMemo(() => {
    return watch?.price ? `$${watch.price.toLocaleString()}` : "$0";
  }, [watch?.price]);

  // Process images based on the watch data structure
  const watchImages = useMemo(() => {
    if (!watch) return [];
    if (Array.isArray(watch.image)) {
      return watch.image;
    } else if (typeof watch.image === "string") {
      return [watch.image];
    } else if (watch.image && typeof watch.image === "object") {
      return Object.values(watch.image);
    }
    return [];
  }, [watch]);

  // Validate form fields
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter your full name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Missing Information", "Please enter your phone number");
      return false;
    }
    if (!address.trim()) {
      Alert.alert("Missing Information", "Please enter your shipping address");
      return false;
    }
    if (!city.trim()) {
      Alert.alert("Missing Information", "Please enter your city");
      return false;
    }
    if (!zipCode.trim()) {
      Alert.alert("Missing Information", "Please enter your ZIP/Postal code");
      return false;
    }
    if (!state.trim()) {
      Alert.alert("Missing Information", "Please enter your state");
      return false;
    }
    return true;
  };

  // Initialize the payment sheet
  const initializePayment = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      const functions = getFunctions(getApp());
      const firestore = getFirestore(getApp());

      // Create a document ID using the submitted name and the watch's SKU.
      // Sanitize the name by trimming and removing spaces.
      const sanitizedName = name.trim().replace(/\s+/g, '');
      const orderDocId = `${sanitizedName}_${watch.sku}`;
      const createdAt = new Date().toISOString();

      const orderData = {
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
        createdAt,
        paymentStatus: "pending", // update to 'paid' upon success
      };

      // Save the order document in the "orders" collection
      await setDoc(doc(firestore, "orders", orderDocId), orderData);

      // Call Firebase function to create a PaymentIntent for Stripe
      const createPaymentIntentFn = httpsCallable(functions, "createPaymentIntent");
      const amountInCents = Math.round(parseFloat(watch.price) * 100);

      const response = await createPaymentIntentFn({
        amount: amountInCents,
        currency: "usd",
        watchId: watch.id,
        description: `Purchase of ${watch.brand} ${watch.model}`,
        shipping: {
          name,
          email,
          phone,
          address,
          city,
          zipCode,
          state,
          country,
        },
        customerEmail: email,
      });

      const { clientSecret } = response.data as { clientSecret: string };

      if (!clientSecret) {
        throw new Error("Failed to receive client secret from server");
      }

      // Initialize the payment sheet with the client secret
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Watch Salon",
        style: "automatic",
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
        returnURL: "watchsalon://stripe-redirect",
      });

      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        Alert.alert("Payment Error", initError.message);
        setProcessing(false);
        return;
      }

      // Present the payment sheet to the user
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          setProcessing(false);
          return;
        }
        console.error("Error presenting payment sheet:", presentError);
        Alert.alert("Payment Error", presentError.message);
        setProcessing(false);
        return;
      }

      // Payment was successful on the client side.
      // Update the order document to mark paymentStatus as "paid"
      await updateDoc(doc(firestore, "orders", orderDocId), {
        paymentStatus: "paid",
      });

      // Update the watch document to put it on hold (hold = true)
      await updateDoc(doc(firestore, "Watches", watch.id), {
        hold: true,
      });

      Alert.alert(
        "Purchase Successful",
        "Your order has been confirmed! We'll contact you shortly with shipping details and confirmation.",
        [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Processing Error",
        "There was a problem processing your payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseModal = () => {
    if (processing) return;
    setModalVisible(false);
    if (onCancel) onCancel();
  };

  return (
    <>
      <Pressable style={styles.buyButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.buyButtonText}>Purchase</Text>
      </Pressable>

      {/* Checkout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.centeredView}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              {/* Header with back button */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleCloseModal}
                  disabled={processing}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Feather name="arrow-left" size={24} color="#002d4e" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Shipping Info</Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Scrollable content area */}
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardView}
              >
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollViewContent}
                >
                  {/* Watch info section with image */}
                  <View style={styles.watchInfoContainer}>
                    {watchImages.length > 0 ? (
                      <Image
                        source={{ uri: watchImages[0] }}
                        style={styles.watchImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.watchImagePlaceholder}>
                        <Feather name="watch" size={30} color="#aaa" />
                      </View>
                    )}
                    <View style={styles.watchDetails}>
                      <Text style={styles.watchBrand}>{watch.brand}</Text>
                      <Text style={styles.watchTitle}>{watch.model}</Text>
                      <Text style={styles.priceText}>{formattedPrice}</Text>
                    </View>
                  </View>

                  <View style={styles.formContainer}>
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

                    {/* Extra bottom padding */}
                    <View style={{ height: 90 }} />
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>

              {/* Fixed footer with pay button */}
              <View style={styles.modalFooter}>
                {processing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#002D4E" />
                    <Text style={styles.processingText}>
                      Processing your payment...
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={initializePayment}
                    disabled={processing}
                  >
                    <Text style={styles.payButtonText}>
                      Pay {formattedPrice}
                    </Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
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
    shadowOffset: { width: 0, height: 2 },
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "95%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#002D4E",
    textAlign: "center",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  watchInfoContainer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#f9f9f9",
    marginBottom: 20,
    alignItems: "center",
  },
  watchImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#f0f0f0",
  },
  watchImagePlaceholder: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  watchDetails: {
    flex: 1,
  },
  watchBrand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#002D4E",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  watchTitle: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#002D4E",
    letterSpacing: 0.3,
  },
  formContainer: {
    paddingHorizontal: 20,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f5f5f7",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfColumn: {
    width: "48%",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
    width: "100%",
    backgroundColor: "white",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  payButton: {
    backgroundColor: "#002D4E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    color: "#002D4E",
  },
});

export default StripeCheckout;