// app/watch/[id].tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  StatusBar,
  ScrollView,
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
import StripeCheckout from "../components/StripeCheckout";
import Colors from "../../constants/Colors";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Pre-compile frequently used components for smoother nav
const preloadComponentCache = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dummy1 = <StockBadge />;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dummy2 = <LikeList watchId="" initialLikes={0} />;
};

// Memoised specs row
const SpecRow = React.memo(
  ({ label, value }: { label: string; value: string | null | undefined }) => {
    const { isDark } = useTheme();
    return value ? (
      <View
        style={[
          styles.specRow,
          { borderBottomColor: isDark ? "#333" : "#f0f0f0" },
        ]}
      >
        <Text
          style={[styles.specLabel, { color: isDark ? "#aaa" : "#666" }]}
        >
          {label}
        </Text>
        <Text
          style={[styles.specValue, { color: isDark ? "#fff" : "#002d4e" }]}
        >
          {value}
        </Text>
      </View>
    ) : null;
  }
);

export default function DetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const router = useRouter();
  const { watches, loading } = useWatches();
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();

  useEffect(preloadComponentCache, []);

  // ███████  Memoise watch record  ███████
  const watch = useMemo(() => {
    if (!watches || watches.length === 0) return null;
    let found = watches.find((w) => w.id === id);
    if (!found) found = watches.find((w) => String(w.id) === String(id));
    if (!found && !isNaN(Number(id)))
      found = watches.find((w) => Number(w.id) === Number(id));
    return found;
  }, [watches, id]);

  // Navigation guard / fade-in once found
  useEffect(() => {
    let to: ReturnType<typeof setTimeout>;
    if (!loading && watches?.length) {
      if (!watch) {
        setError(`Watch not found. ID: ${id}`);
        to = setTimeout(() => router.back(), 1500);
      } else {
        to = setTimeout(() => {
          setContentReady(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 100);
      }
    }
    return () => clearTimeout(to);
  }, [loading, watches, watch, id, router, fadeAnim]);

  const handlePurchaseSuccess = useCallback(() => {
    setPurchaseCompleted(true);
    // update backend if needed
  }, []);

  // Format numbers for first render
  const { formattedPrice, formattedMSRP } = useMemo(() => {
    if (!watch) return { formattedPrice: "", formattedMSRP: "" };
    return {
      formattedPrice: watch.price?.toLocaleString() ?? "",
      formattedMSRP: watch.msrp?.toLocaleString() ?? "",
    };
  }, [watch]);

  // Build specs list once
  const specEntries = useMemo(() => {
    if (!watch) return [];
    return [
      { label: "Case Material", value: watch.caseMaterial },
      { label: "Diameter", value: watch.caseDiameter },
      { label: "Movement", value: watch.movement },
      {
        label: "Complications",
        value: watch.complications?.length
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
        value:
          watch.papers !== undefined ? (watch.papers ? "Yes" : "No") : null,
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

  // Theme colours
  const bgColor = isDark ? "#121212" : Colors.headerBg;
  const textColor = isDark ? "#fff" : "#002d4e";
  const secondaryTextColor = isDark ? "#aaa" : "#666";

  // Loading / guard
  if (
    loading ||
    !watches?.length ||
    !watch ||
    !contentReady
  ) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.statusBarFill, { backgroundColor: bgColor }]} />
        <FixedHeader showBackButton title="" />
        <View style={styles.loadingContainer}>
          {error ? (
            <>
              <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
              <Text style={{ color: textColor }}>
                Returning to previous screen…
              </Text>
            </>
          ) : (
            <ActivityIndicator
              size="large"
              color={isDark ? "#81b0ff" : "#002d4e"}
            />
          )}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.statusBarFill, { backgroundColor: bgColor }]} />
      <FixedHeader showBackButton watch={watch} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
        >
          <SecondaryCard watch={watch} />

          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={styles.detailsPanel}
          >
            <View style={styles.headerSection}>
              {/* Brand & likes */}
              <View style={styles.brandLikeContainer}>
                <View style={styles.brandContainer}>
                  {/* ▼▼▼ NEW: small style also for Van Cleef & Arpels ▼▼▼ */}
                  {["Vacheron Constantin", "Van Cleef & Arpels", "Van Cleef and Arpels"].includes(
                    watch.brand ?? ""
                  ) ? (
                    <Text
                      style={[styles.brandSmaller, { color: textColor }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {watch.brand}
                    </Text>
                  ) : (
                    <Text
                      style={[styles.brand, { color: textColor }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {watch.brand ?? " "}
                    </Text>
                  )}
                </View>

                <View style={styles.likeListContainer}>
                  <LikeList
                    watchId={watch.id}
                    initialLikes={watch.likes ?? 0}
                  />
                </View>
              </View>

              <Text style={[styles.model, { color: textColor }]}>
                {watch.model ?? " "}
              </Text>

              <View style={styles.infoContainer}>
                {watch.referenceNumber && (
                  <Text
                    style={[
                      styles.referenceNumber,
                      { color: secondaryTextColor },
                    ]}
                  >
                    Ref. {watch.referenceNumber}
                  </Text>
                )}
                {watch.sku && (
                  <Text
                    style={[
                      styles.referenceNumber,
                      { color: secondaryTextColor },
                    ]}
                  >
                    SKU: {watch.sku}
                  </Text>
                )}
              </View>

              <View style={styles.stockPriceContainer}>
                <View style={styles.stockBadgeWrapper}>
                  <StockBadge />
                </View>

                <View style={styles.priceContainer}>
                  {watch.msrp ? (
                    <View style={styles.msrpContainer}>
                      <Text style={[styles.msrpLabel, { color: textColor }]}>
                        MSRP:{" "}
                      </Text>
                      <Text style={[styles.msrpValue, { color: textColor }]}>
                        ${formattedMSRP}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.price, { color: textColor }]}>
                    ${formattedPrice}
                  </Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <View style={styles.buttonWrapper}>
                <TradeButton watch={watch} />
              </View>
              <View style={styles.buttonWrapper}>
                <MessageButton title="MESSAGE US" />
              </View>
            </View>

            {/* Specs */}
            <View style={styles.specsContainer}>
              {specEntries.map((spec, i) => (
                <SpecRow key={i} label={spec.label} value={spec.value} />
              ))}
            </View>
          </BlurView>

          {/* Description */}
          {watch.description && (
            <View style={styles.descriptionContainer}>
              <Text
                style={[styles.descriptionLabel, { color: textColor }]}
              >
                Description
              </Text>
              <Text
                style={[styles.descriptionText, { color: textColor }]}
              >
                {watch.description}
              </Text>
            </View>
          )}

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: textColor }]}>
              Shreve, Crump & Low • Horological Excellence Since 1796
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Checkout / sold banner */}
      <View
        style={[
          styles.bottomContainer,
          {
            backgroundColor: isDark ? "#222" : "#fff",
            borderTopColor: isDark ? "#333" : "#eee",
          },
        ]}
      >
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
            onCancel={() => { }}
          />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerBg },
  statusBarFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight,
    backgroundColor: Colors.headerBg,
    zIndex: 10,
  },
  scrollContent: { paddingBottom: 140 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  headerSection: { marginBottom: 32, paddingTop: 8 },
  brandLikeContainer: {
    position: "relative",
    marginBottom: 4,
    height: 40,
  },
  brandContainer: { width: "100%", paddingRight: 60 },
  brand: {
    fontSize: 30,
    fontWeight: "600",
    color: "#002d4e",
    letterSpacing: 0.2,
    width: "100%",
  },
  brandSmaller: {
    fontSize: 24,
    fontWeight: "500",
    color: "#002d4e",
    letterSpacing: -0.5,
    width: "100%",
  },
  likeListContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
    alignItems: "flex-end",
  },

  model: {
    fontSize: 18,
    fontWeight: "400",
    color: "#002d4e",
    letterSpacing: -0.3,
    marginBottom: 12,
    marginTop: 4,
    flexWrap: "wrap",
    lineHeight: 24,
  },
  infoContainer: { marginBottom: 12, minHeight: 22 },
  referenceNumber: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
    marginBottom: 4,
  },

  stockPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: -9,
    height: 40,
  },
  stockBadgeWrapper: { width: SCREEN_WIDTH * 0.3, overflow: "hidden" },

  priceContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 40,
  },
  msrpContainer: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
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
    height: 24,
    textAlign: "right",
    alignSelf: "flex-end",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    marginHorizontal: -12,
    height: 48,
  },
  buttonWrapper: { flex: 1, marginHorizontal: 8, marginVertical: -34 },

  specsContainer: { marginTop: 20, paddingHorizontal: 3 },
  specRow: {
    gap: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specLabel: { fontSize: 15, color: "#666", width: 120 },
  specValue: {
    fontSize: 15,
    color: "#002d4e",
    fontWeight: "500",
    flex: 1,
  },

  footerContainer: { paddingVertical: 20, paddingHorizontal: 16 },
  footerText: {
    fontSize: 15,
    color: "#002d4e",
    textAlign: "center",
    letterSpacing: 1,
    fontWeight: "300",
    textTransform: "uppercase",
  },

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
