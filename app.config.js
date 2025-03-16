import 'dotenv/config';

export default {
  expo: {
    name: 'watch_salon',
    slug: 'salon',
    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: '196d8bb9-d7b4-4c0d-91b7-00858fb9ff80'
      }
    },
    ios: {
      bundleIdentifier: 'com.itsabike.salon',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    plugins: [
      'expo-router',
      [
        '@react-native-firebase/app',
        {
          ios: {
            googleServicesFile: "./GoogleService-Info.plist"
          },
          android: {
            googleServicesFile: "./google-services.json"
          }
        }
      ],
      '@react-native-firebase/auth'
    ],
    owner: 'itsabike'
  }
};