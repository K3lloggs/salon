import 'dotenv/config';

export default {
  expo: {
    name: 'Watch SCL',
    slug: 'salon',
    scheme: 'watchsalon', // <-- Required linking scheme for production builds
    icon: "./assets/images/shreve_circle.png",
    orientation: "portrait",
    version: "1.1.8",  // Version number
    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      STRIPE_PUBLISHABLE_KEY: "pk_live_51KOAMQDYuNaEOlQ2nqKvmYdL45mnKhQxEdOCJX5kgcpCmlHueINBYyPmggU0LHhPtUsUr2bKG8Iph5xSXsGlmi3h008ESuHAo0",
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
          "youtube",
          "watchsalon" // Added for handling deep links
        ],
        // Added for URL scheme handling
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "watchsalon"
            ]
          }
        ]
      }
    },
    android: {
      package: "com.itsabike.salon",
      // Added for Android deep linking
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "watchsalon"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
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
          "merchantIdentifier": "",// apple pay
          "enableGooglePay": false,
          "urlScheme": "watchsalon" // return url scheme for stripe
        }
      ]
    ],
    owner: 'itsabike'
  }
};