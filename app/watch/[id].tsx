// app/watch/[id].tsx

import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SpecRowProps {
  label: string;
  value: string | null | undefined;
}

const SpecRow: React.FC<SpecRowProps> = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
};

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { watches, loading } = useWatches();
  
  // Always show loading until watches are fully loaded
  if (loading || !watches || watches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FixedHeader showBackButton={true} title="" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002d4e" />
        </View>
      </SafeAreaView>
    );
  }

  // Only look for watch after loading is complete
  const watch = watches.find((w) => String(w.id) === String(id));
  
  // Only redirect if we're sure watches are loaded and watch isn't found
  if (!watch) {
    // Add a small delay to prevent immediate bounce back
    setTimeout(() => {
      router.back();
    }, 500);
    
    return (
      <SafeAreaView style={styles.container}>
        <FixedHeader showBackButton={true} title="" />
        <View style={styles.loadingContainer}>
          <Text style={{color: "#666", marginBottom: 10}}>Watch not found</Text>
          <ActivityIndicator size="small" color="#002d4e" />
        </View>
      </SafeAreaView>
    );
  }

  // Specification entries
  const specEntries = [
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
    { label: "MSRP", value: watch.msrp ? `$${watch.msrp.toLocaleString()}` : null },
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

  return (
    <SafeAreaView style={styles.container}>
      <FixedHeader showBackButton={true} watch={watch} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SecondaryCard watch={watch} />

        <BlurView intensity={40} tint="light" style={styles.detailsPanel}>
          {/* Top Text Section with extra spacing */}
          <View style={styles.headerSection}>
            <Text style={styles.brand}>{watch.brand}</Text>
            <Text style={styles.model}>{watch.model}</Text>
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
                <LikeList watchId={watch.id} initialLikes={watch.likes || 0} />
                <Text style={styles.price}>
                  ${watch.price.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Horizontal Row for Trade and Message Us buttons */}
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <TradeButton watch={watch} />
            </View>
            <View style={styles.buttonWrapper}>
              <MessageButton title="MESSAGE US" />
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.specsContainer}>
            {specEntries.map((spec, index) => (
              <SpecRow key={index} label={spec.label} value={spec.value} />
            ))}
          </View>
        </BlurView>

        {/* Watch Description */}
        {watch.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{watch.description}</Text>
          </View>
        )}

        {/* Heritage Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Shreve, Crump & Low • Horological Excellence Since 1796
          </Text>
        </View>
      </ScrollView>

      {/* Full-Width Stripe Button Container */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.stripeButton}>
          <Text style={styles.stripeButtonText}>Purchase</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  scrollContent: { 
    paddingBottom: 140 
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
  descriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#002d4e",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: "#002d4e",
    lineHeight: 22,
  },
  headerSection: {
    marginBottom: 32, // Extra breathing room
    paddingTop: 8,
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    color: "#002d4e",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  model: {
    fontSize: 20,
    fontWeight: "400",
    color: "#002d4e",
    letterSpacing: -0.3,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  infoContainer: { marginBottom: 12 },
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
    marginBottom: 24,
  },
  stockBadgeWrapper: { width: SCREEN_WIDTH * 0.3, overflow: "hidden" },
  priceContainer: { flex: 1, alignItems: "flex-end" },
  price: {
    fontSize: 22,
    fontWeight: "600",
    color: "#002d4e",
    letterSpacing: -0.3,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    marginHorizontal: -12,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 8,
    marginVertical: -34,
  },
  specsContainer: { marginTop: 84, paddingHorizontal: 3 },
  specRow: {
    gap: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specLabel: {
    fontSize: 15,
    color: "#666",
    letterSpacing: -0.2,
    width: 120,
  },
  specValue: {
    fontSize: 15,
    color: "#002d4e",
    fontWeight: "500",
    letterSpacing: -0.2,
    flex: 1,
    marginLeft: 30,
  },

  footerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
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
  stripeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});