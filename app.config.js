import 'dotenv/config';

export default {
  expo: {
    name: 'Watch Salon',
    slug: 'salon',
    scheme: 'watchsalon', // <-- Required linking scheme for production builds
    icon: "./assets/images/shreve_circle.png",
    orientation: "portrait",
    version: "1.0.3",  // Version number
    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      STRIPE_PUBLISHABLE_KEY:
        "sk_test_51KOAMQDYuNaEOlQ2cMftzqDaJJVqIl6T8wLv0v84WJwfWx2JVojRulGtQf7nlEYSE0jsmVspizrMpBeY12BYlpWv004f15rpTd", // Replace with your actual key
      eas: {
        projectId: '196d8bb9-d7b4-4c0d-91b7-00858fb9ff80'
      }
    },
    ios: {
      bundleIdentifier: 'com.itsabike.salon',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          "This app uses the camera to scan payment cards.",
        LSApplicationQueriesSchemes: [
          "instagram",
          "fb",
          "youtube"
        ]
      }
    },
    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          ios: {
            useModularHeaders: true,
            useFrameworks: "static"
          }
        }
      ],
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "",  // Leave empty if not using Apple Pay
          "enableGooglePay": false,
          "urlScheme": "watchsalon" // For returnURL in your Stripe component
        }
      ]
    ],
    owner: 'itsabike'
  }
};
