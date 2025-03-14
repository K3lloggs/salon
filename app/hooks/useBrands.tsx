// hooks/useBrands.ts
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // 

interface Brand {
    id: string;
    name: string;
    models: number;
    image?: string;
}

export function useBrands() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const watchesRef = collection(db, 'Watches');
                const snapshot = await getDocs(watchesRef);

                // Group watches by brand
                const brandMap = new Map<string, Brand>();

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const brandName = data.brand;

                    if (brandName) {
                        if (!brandMap.has(brandName)) {
                            brandMap.set(brandName, {
                                id: doc.id,
                                name: brandName,
                                models: 1,
                                image: data.image
                            });
                        } else {
                            const brand = brandMap.get(brandName)!;
                            brand.models += 1;
                        }
                    }
                });

                setBrands(Array.from(brandMap.values()));
                setError(null);
            } catch (err) {
                console.error('Error fetching brands:', err);
                setError(err instanceof Error ? err.message : 'Error fetching brands');
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    return { brands, loading, error };
}