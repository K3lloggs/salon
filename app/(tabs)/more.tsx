import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Text,
  View,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FixedHeader } from '../components/FixedHeader';
import { Link } from 'expo-router';
import Colors from '../../constants/Colors';
import { useTheme } from '../context/ThemeContext';

export default function MoreScreen() {
  const { isDark, toggleTheme } = useTheme();

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

  // Function to handle App Store review link
  const handleRateAppPress = () => {
    Linking.openURL(
      'https://apps.apple.com/us/app/watch-scl/id6743322357?action=write-review'
    );
  };

  return (
    <ScrollView style={[
      styles.container, 
      { backgroundColor: isDark ? '#000' : Colors.offWhite }
    ]}>
      <FixedHeader />

      {/* Information */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle, 
          { color: isDark ? '#fff' : Colors.primaryBlue }
        ]}>Information</Text>
        <Link href="/about" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={[
              styles.menuText,
              { color: isDark ? '#fff' : '#1a1a1a' }
            ]}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#fff" : "#002d4e"} />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Follow Us */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle, 
          { color: isDark ? '#fff' : Colors.primaryBlue }
        ]}>Follow Us</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleInstagramPress}
        >
          <View style={styles.leftContainer}>
            <View style={styles.textContainer}>
              <Text style={[
                styles.menuText,
                { color: isDark ? '#fff' : '#1a1a1a' }
              ]}>Instagram</Text>
            </View>
            <Ionicons
              name="logo-instagram"
              size={24}
              color="#E1306C"
              style={styles.socialIcon}
            />
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? "#fff" : "#002d4e"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleFacebookPress}
        >
          <View style={styles.leftContainer}>
            <View style={styles.textContainer}>
              <Text style={[
                styles.menuText,
                { color: isDark ? '#fff' : '#1a1a1a' }
              ]}>Facebook</Text>
            </View>
            <Ionicons
              name="logo-facebook"
              size={24}
              color="#3b5998"
              style={styles.socialIcon}
            />
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? "#fff" : "#002d4e"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleYoutubePress}
        >
          <View style={styles.leftContainer}>
            <View style={styles.textContainer}>
              <Text style={[
                styles.menuText,
                { color: isDark ? '#fff' : '#1a1a1a' }
              ]}>YouTube</Text>
            </View>
            <Ionicons
              name="logo-youtube"
              size={24}
              color="#FF0000"
              style={styles.socialIcon}
            />
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? "#fff" : "#002d4e"} />
        </TouchableOpacity>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle, 
          { color: isDark ? '#fff' : Colors.primaryBlue }
        ]}>App</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleRateAppPress}
        >
          <Text style={[
            styles.menuText,
            { color: isDark ? '#fff' : '#1a1a1a' }
          ]}>Rate the App</Text>
          <Ionicons name="chevron-forward" size={20} color={isDark ? "#fff" : "#002d4e"} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
        >
          <View style={styles.leftContainer}>
            <Text style={[
              styles.menuText,
              { color: isDark ? '#fff' : '#1a1a1a' }
            ]}>Dark Mode</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDark ? "#fff" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={isDark}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    width: 100,
  },
  socialIcon: {
    marginLeft: 4,
  },
  menuText: {
    fontSize: 16,
  },
});