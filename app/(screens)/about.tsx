import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FixedHeader } from '../components/FixedHeader';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface LocationSectionProps {
  title: string;
  address: string;
  phone: string;
  hours: string[];
}

const LocationSection = ({ title, address, phone, hours }: LocationSectionProps) => {
  const { isDark } = useTheme();
  
  // Theme-specific colors
  const textColor = isDark ? '#FFF' : '#002d4e';
  const borderColor = isDark ? '#444' : '#002d4e';
  const backgroundColor = isDark ? '#222' : '#fff';
  const shadowColor = isDark ? '#000' : '#000';
  const iconColor = isDark ? '#81b0ff' : '#002d4e';
  
  return (
    <View style={[
      styles.locationContainer, 
      { 
        backgroundColor, 
        borderColor,
        shadowColor
      }
    ]}>
      <Text style={[styles.locationTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.addressText, { color: textColor }]}>{address}</Text>
      <TouchableOpacity
        style={styles.phoneContainer}
        onPress={() => Linking.openURL(`tel:${phone}`)}
      >
        <Ionicons name="call-outline" size={18} color={iconColor} />
        <Text style={[styles.phoneText, { color: textColor }]}>{phone}</Text>
      </TouchableOpacity>
      {hours.map((hour, index) => (
        <Text key={index} style={[styles.hoursText, { color: textColor }]}>{hour}</Text>
      ))}
    </View>
  );
};

function AboutScreen() {
  const { isDark } = useTheme();
  
  // Theme-specific colors
  const backgroundColor = isDark ? '#121212' : '#ffffff';
  const textColor = isDark ? '#FFF' : '#002d4e';
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FixedHeader showBackButton />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={[styles.mainTitle, { color: textColor }]}>America's Jeweler since 1796</Text>

          <Text style={[styles.paragraph, { color: textColor }]}>
            Shreve, Crump & Low is a family-owned and operated business founded in New England.
            Our magnificent three-story flagship is located at 39 Newbury Street in Boston,
            Massachusetts with a second location nestled in the heart of Greenwich, Connecticut
            at 125 Greenwich Avenue. Shreve, Crump & Low features the finest diamonds, colored
            gemstones, timepieces, and estate jewelry from around the world, as well as one of
            the country's finest and most exclusive china and giftware collections.
          </Text>

          <Text style={[styles.paragraph, { color: textColor }]}>
            Our collection of both jewelry and watches is unlike any other in America. We strive
            to find the rarest pieces from estate pieces of jewelry made by Jean Schlumberger
            himself, to jewelry made by the incredible Oscar Heyman. Our collection of jewelry
            is unlike any other.
          </Text>

          <Text style={[styles.paragraph, { color: textColor }]}>
            In addition to our rare collection of gems, the same can be said for our Watch Salon.
            A vast collection of the most famous Swiss & German brands, we carry the rarest and
            most valuable timepieces in the world.
          </Text>

          <Text style={[styles.sectionTitle, { color: textColor }]}>Our Locations</Text>

          <LocationSection
            title="Boston"
            address="39 Newbury Street, Boston MA 02116"
            phone="(617) 267-9100"
            hours={[
              "Monday - Saturday, 10 AM to 5 PM",
              "Sunday, Closed"
            ]}
          />

          <LocationSection
            title="Greenwich"
            address="125 Greenwich Avenue, Greenwich CT 06830"
            phone="(237) 622-6205"
            hours={[
              "Monday - Saturday, 10 AM to 5 PM",
              "Sunday, Closed"
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
    fontFamily: 'serif',
  },
  locationContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  addressText: {
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'serif',
  },
  hoursText: {
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'serif',
  },
});

export default AboutScreen;