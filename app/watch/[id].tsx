// app/watch/[id].tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SecondaryCard } from "../components/SecondaryCard";
import { TradeButton } from "../components/TradeButton";
import { MessageButton } from "../components/MessageButton";
import { FixedHeader } from "../components/FixedHeader";
import { StockBadge } from "../components/StockBadge";
import { LikeList } from "../components/LikeList";
import { useWatches } from "../hooks/useWatches";
import { StripeProvider } from "@stripe/stripe-react-native";
import StripeCheckout from "../components/StripeCheckout";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51KOAMQDYuNaEOlQ2h7MW9gJ2D5TqDVRaP6bHYjsKY3UrTCrnCSVpILWzJvWiw33EhrouU4UObAxectGVxcnTbwsg001yIaHp9V";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Preload cache for smoother transitions
const preloadComponentCache = () => {
  // This forces the JS engine to compile components ahead of time
  const StockBadgeTemp = <StockBadge />;
  const LikeListTemp = <LikeList watchId="" initialLikes={0} />;
};

// Memoize SpecRow to prevent unnecessary rerenders
const SpecRow = React.memo(({ label, value }: {
  label: string;
  value: string | null | undefined;
}) =>
  value ? (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  ) : null
);

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { watches, loading } = useWatches();
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Preload cache
  useEffect(() => {
    preloadComponentCache();
  }, []);

  // If watches are loaded and no matching watch is found, navigate back.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!loading && watches && watches.length > 0) {
      const found = watches.find((w) => String(w.id) === String(id));
      if (!found) {
        timeoutId = setTimeout(() => router.back(), 500);
      } else {
        // When watch is found, start a short delay before revealing content
        // This ensures all components have time to measure and layout
        timeoutId = setTimeout(() => {
          setContentReady(true);
          // Fade in content smoothly
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 100);
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, watches, id, router, fadeAnim]);

  const handlePurchaseSuccess = useCallback(() => {
    setPurchaseCompleted(true);
    // Update Firestore or perform additional actions here
  }, []);

  // Memoize watch data to prevent recalculations
  const watch = useMemo(() => {
    if (!watches || watches.length === 0) return null;
    return watches.find((w) => String(w.id) === String(id));
  }, [watches, id]);

  // Format price and MSRP values - ensure they're available for initial render
  const { formattedPrice, formattedMSRP } = useMemo(() => {
    if (!watch) return { formattedPrice: "", formattedMSRP: "" };
    return {
      formattedPrice: watch.price ? watch.price.toLocaleString() : "",
      formattedMSRP: watch.msrp ? watch.msrp.toLocaleString() : ""
    };
  }, [watch]);

  // Memoize spec entries to avoid recalculations
  const specEntries = useMemo(() => {
    if (!watch) return [];

    return [
      { label: "Case Material", value: watch.caseMaterial },
      { label: "Diameter", value: watch.caseDiameter },
      { label: "Movement", value: watch.movement },
      {
        label: "Complications",
        value:
          watch.complications && watch.complications.length > 0
            ? watch.complications.join(", ")
            : null,
      },
      { label: "Dial", value: watch.dial },
      { label: "Power Reserve", value: watch.powerReserve },
      { label: "Strap", value: watch.strap },
      { label: "Year", value: watch.year },
      {
        label: "Box",
        value: watch.box !== undefined ? (watch.box ? "Yes" : "No") : null,
      },
      {
        label: "Papers",
        value: watch.papers !== undefined ? (watch.papers ? "Yes" : "No") : null,
      },
      { label: "Warranty", value: watch.warranty },
      {
        label: "Exhibition Caseback",
        value:
          watch.exhibitionCaseback !== undefined
            ? watch.exhibitionCaseback
              ? "Yes"
              : "No"
            : null,
      },
    ];
  }, [watch]);

  // Use a full-page loading approach to avoid content jumping
  if (loading || !watches || watches.length === 0 || !watch || !contentReady) {
    return (
      <SafeAreaView style={styles.container}>
        <FixedHeader showBackButton title="" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002d4e" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.watchsalon"
    >
      <SafeAreaView style={styles.container}>
        <FixedHeader showBackButton watch={watch} />

        <Animated.View style={{
          flex: 1,
          opacity: fadeAnim,
        }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          >
            <SecondaryCard watch={watch} />

            <BlurView intensity={30} tint="light" style={styles.detailsPanel}>
              <View style={styles.headerSection}>
                {/* Brand & LikeList Container with original positioning */}
                <View style={styles.brandLikeContainer}>
                  <View style={styles.brandContainer}>
                    <Text style={styles.brand} numberOfLines={1} ellipsizeMode="tail">
                      {watch.brand || " "}
                    </Text>
                  </View>

                  <View style={styles.likeListContainer}>
                    <LikeList watchId={watch.id} initialLikes={watch.likes || 0} />
                  </View>
                </View>

                <Text style={styles.model}>{watch.model || " "}</Text>
                <View style={styles.infoContainer}>
                  {watch.referenceNumber && (
                    <Text style={styles.referenceNumber}>
                      Ref. {watch.referenceNumber}
                    </Text>
                  )}
                  {watch.sku && (
                    <Text style={styles.referenceNumber}>
                      SKU: {watch.sku}
                    </Text>
                  )}
                </View>
                <View style={styles.stockPriceContainer}>
                  <View style={styles.stockBadgeWrapper}>
                    <StockBadge />
                  </View>
                  <View style={styles.priceContainer}>
                    {/* Fixed MSRP display - ensure consistent height */}
                    <View style={styles.msrpContainer}>
                      {watch.msrp ? (
                        <>
                          <Text style={styles.msrpLabel}>MSRP: </Text>
                          <Text style={styles.msrpValue}>${formattedMSRP}</Text>
                        </>
                      ) : null}
                    </View>
                    {/* Fixed price display */}
                    <Text style={styles.price}>${formattedPrice}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <TradeButton watch={watch} />
                </View>
                <View style={styles.buttonWrapper}>
                  <MessageButton title="MESSAGE US" />
                </View>
              </View>

              <View style={styles.specsContainer}>
                {specEntries.map((spec, index) => (
                  <SpecRow key={index} label={spec.label} value={spec.value} />
                ))}
              </View>
            </BlurView>

            {watch.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{watch.description}</Text>
              </View>
            )}

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Shreve, Crump & Low • Horological Excellence Since 1796
              </Text>
            </View>
          </ScrollView>
        </Animated.View>

        <View style={styles.bottomContainer}>
          {purchaseCompleted || watch.sold ? (
            <View style={[styles.stripeButton, styles.soldButton]}>
              <Text style={styles.stripeButtonText}>Sold</Text>
            </View>
          ) : watch.hold ? (
            <View style={[styles.stripeButton, styles.onHoldButton]}>
              <Text style={styles.stripeButtonText}>On Hold</Text>
            </View>
          ) : (
            <StripeCheckout
              watch={watch}
              onSuccess={handlePurchaseSuccess}
              onCancel={() => console.log("Purchase cancelled")}
            />
          )}
        </View>
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  scrollContent: {
    paddingBottom: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  detailsPanel: {
    marginTop: -20,
    padding: 28,
    borderRadius: 16,
    width: SCREEN_WIDTH,
    alignSelf: "center",
    marginBottom: 16,
  },
  descriptionContainer: { paddingHorizontal: 16, marginBottom: 16 },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#002d4e",
    marginBottom: 8,
  },
  descriptionText: { fontSize: 15, color: "#002d4e", lineHeight: 22 },
  headerSection: {
    marginBottom: 32,
    paddingTop: 8,
  },
  /* BRAND & LIKELIST - Maintaining original positioning */
  brandLikeContainer: {
    position: 'relative',
    marginBottom: 4,
    height: 40, // Fixed height prevents layout shift
  },
  brandContainer: {
    width: '100%',
    paddingRight: 60, // Make space for the like list on the right
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    color: "#002d4e",
    letterSpacing: -0.5,
    width: '100%',
  },
  likeListContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
    alignItems: 'flex-end',
  },

  model: {
    fontSize: 20,
    fontWeight: "400",
    color: "#002d4e",
    letterSpacing: -0.3,
    marginBottom: 12,
    marginTop: 4,
    flexWrap: "wrap",
    lineHeight: 24,
  },
  infoContainer: {
    marginBottom: 12,
    minHeight: 22, // Ensure consistent height even when empty
  },
  referenceNumber: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
    marginBottom: 4,
  },
  /* STOCK & PRICE */
  stockPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: -9,
    height: 40, // Fixed height prevents layout shifts
  },
  stockBadgeWrapper: { width: SCREEN_WIDTH * 0.3, overflow: "hidden" },
  priceContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 40, // Fixed height to match container
  },
  msrpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    height: 16, // Fixed height to prevent shifting when empty
  },
  msrpLabel: { fontSize: 14, color: "#002d4e", opacity: 0.8 },
  msrpValue: {
    fontSize: 14,
    color: "#002d4e",
    opacity: 0.8,
    textDecorationLine: "line-through",
    fontWeight: "700",
  },
  price: {
    fontSize: 22,
    fontWeight: "600",
    color: "#002d4e",
    letterSpacing: -0.3,
    height: 24, // Fixed height for consistency
  },
  /* BUTTON ROW */
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    marginHorizontal: -12,
    height: 48, // Fixed height for the buttons
  },
  buttonWrapper: { flex: 1, marginHorizontal: 8, marginVertical: -34 },
  /* SPECS */
  specsContainer: { marginTop: 84, paddingHorizontal: 3 },
  specRow: {
    gap: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specLabel: { fontSize: 15, color: "#666", letterSpacing: -0.2, width: 120 },
  specValue: {
    fontSize: 15,
    color: "#002d4e",
    fontWeight: "500",
    letterSpacing: -0.2,
    flex: 1,
    marginLeft: 30,
  },
  /* FOOTER */
  footerContainer: { paddingVertical: 20, paddingHorizontal: 16 },
  footerText: {
    fontSize: 15,
    color: "#002d4e",
    textAlign: "center",
    letterSpacing: 1,
    fontWeight: "300",
    textTransform: "uppercase",
  },
  /* BOTTOM CONTAINER */
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  stripeButton: {
    backgroundColor: "#002d4e",
    flex: 1,
    height: 50,
    marginVertical: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  stripeButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  soldButton: { backgroundColor: "#888" },
  onHoldButton: { backgroundColor: "#002d4e" },
});