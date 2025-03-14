import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FixedHeader } from '../components/FixedHeader';
import { Ionicons } from '@expo/vector-icons';

const LocationSection = ({
    title,
    address,
    phone,
    hours
}: {
    title: string;
    address: string;
    phone: string;
    hours: string[];
}) => (
    <View style={styles.locationContainer}>
    
        <TouchableOpacity
            style={styles.phoneContainer}
            onPress={() => Linking.openURL(`tel:${phone}`)}
        >
            <Ionicons name="call-outline" size={16} color="#002d4e" />
            <Text style={styles.phoneText}>{phone}</Text>
        </TouchableOpacity>
        {hours.map((hour, index) => (
            <Text key={index} style={styles.hoursText}>{hour}</Text>
        ))}
    </View>
);

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <FixedHeader />
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.content}>
                    <Text style={styles.mainTitle}>America's Jeweler since 1796</Text>

                    <Text style={styles.paragraph}>
                        Shreve, Crump & Low is a family-owned and operated business founded in New England.
                        Our magnificent three-story flagship is located at 39 Newbury Street in Boston,
                        Massachusetts with a second location nestled in the heart of Greenwich, Connecticut
                        at 125 Greenwich Avenue. Shreve, Crump & Low features the finest diamonds, colored
                        gemstones, timepieces, and estate jewelry from around the world, as well as one of
                        the country's finest and most exclusive china and giftware collections.
                    </Text>

                    <Text style={styles.paragraph}>
                        Our collection of both jewelry and watches is unlike any other in America. We strive
                        to find the rarest pieces from estate pieces of jewelry made by Jean Schlumberger
                        himself, to jewelry made by the incredible Oscar Heyman. Our collection of jewelry
                        is unlike any other.
                    </Text>

                    <Text style={styles.paragraph}>
                        In addition to our rare collection of gems, the same can be said for our Watch Salon.
                        A vast collection of the most famous Swiss & German brands, we carry the rarest and
                        most valuable timepieces in the world.
                    </Text>

                    <Text style={styles.sectionTitle}>Our Locations</Text>

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
        backgroundColor: '#ffffff',
    },
    scrollContainer: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#002d4e',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#002d4e',
        marginTop: 30,
        marginBottom: 20,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 16,
    },
    locationContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    locationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#002d4e',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    phoneText: {
        fontSize: 16,
        color: '#002d4e',
        marginLeft: 8,
    },
    hoursText: {
        fontSize: 16,
        color: '#333',
        marginTop: 4,
    },
});