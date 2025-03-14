import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BackButton: React.FC = () => {
    const router = useRouter();

    return (
        <Pressable
            onPress={() => router.back()}
           
        >
            <Feather name="arrow-left" size={24} color="#000" />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 16,
        left: 16,
        padding: 8,
      
    
    },
});

export default BackButton;
