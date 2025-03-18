import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FixedHeader } from '../components/FixedHeader';
import { Link } from 'expo-router';

export default function MoreScreen() {
  // Function to handle Instagram linking
  const handleInstagramPress = () => {
    const instagramAppUrl = 'instagram://user?username=shrevecrumplow';
    const instagramWebUrl = 'https://www.instagram.com/shrevecrumplow/#';
    Linking.canOpenURL(instagramAppUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(instagramAppUrl);
        } else {
          Linking.openURL(instagramWebUrl);
        }
      })
      .catch((err) =>
        console.error('An error occurred while trying to open Instagram', err)
      );
  };

  // Function to handle Facebook linking
  const handleFacebookPress = () => {
    const facebookAppUrl =
      'fb://facewebmodal/f?href=https://www.facebook.com/shrevecrumpandlowboston/';
    const facebookWebUrl =
      'https://www.facebook.com/shrevecrumpandlowboston/';
    Linking.canOpenURL(facebookAppUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(facebookAppUrl);
        } else {
          Linking.openURL(facebookWebUrl);
        }
      })
      .catch((err) =>
        console.error('An error occurred while trying to open Facebook', err)
      );
  };

  // Function to handle YouTube linking
  const handleYoutubePress = () => {
    // Attempt to open the YouTube app; if not available, fallback to the web URL.
    const youtubeAppUrl = 'youtube://www.youtube.com/@shrevecrumplow';
    const youtubeWebUrl = 'https://www.youtube.com/@shrevecrumplow';
    Linking.canOpenURL(youtubeAppUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(youtubeAppUrl);
        } else {
          Linking.openURL(youtubeWebUrl);
        }
      })
      .catch((err) =>
        console.error('An error occurred while trying to open YouTube', err)
      );
  };

  return (
    <ScrollView style={styles.container}>
      <FixedHeader />

      {/* Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <Link href="/about" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#002d4e" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Follow Us */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleInstagramPress}
        >
          <Text style={styles.menuText}>Instagram</Text>
          <Ionicons name="chevron-forward" size={20} color="#002d4e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleFacebookPress}
        >
          <Text style={styles.menuText}>Facebook</Text>
          <Ionicons name="chevron-forward" size={20} color="#002d4e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleYoutubePress}
        >
          <Text style={styles.menuText}>YouTube</Text>
          <Ionicons name="chevron-forward" size={20} color="#002d4e" />
        </TouchableOpacity>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Linking.openURL('https://apps.apple.com/app/your-app-id')
          }
        >
          <Text style={styles.menuText}>Rate the App</Text>
          <Ionicons name="chevron-forward" size={20} color="#002d4e" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002d4e',
    marginBottom: 12,
    paddingLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});
