// hooks/useFirebase.ts
import { doc, getDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export function useFirebase() {
    const getDocumentById = async (collectionName: string, docId: string) => {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            console.error('Error getting document:', error);
            throw error;
        }
    };

    const getCollectionDocs = async (collectionName: string, options = {}) => {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting collection:', error);
            throw error;
        }
    };

    const getWatchesByBrand = async (brandName: string) => {
        try {
            const q = query(
                collection(db, 'Watches'),
                where('brand', '==', brandName)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting watches by brand:', error);
            throw error;
        }
    };

    const searchWatches = async (searchTerm: string) => {
        try {
            // Get all watches first
            const watchesRef = collection(db, 'Watches');
            const querySnapshot = await getDocs(watchesRef);
            
            if (!searchTerm.trim()) {
                // If no search term, return all watches sorted by brand
                return querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (a as any).brand.localeCompare((b as any).brand));
            }

            // Filter watches based on search term
            const normalizedSearchTerm = searchTerm.toLowerCase().trim();
            const filteredWatches = querySnapshot.docs
                .filter(doc => {
                    const data = doc.data();
                    const brand = (data.brand || '').toString().toLowerCase();
                    const model = (data.model || '').toString().toLowerCase();
                    const year = (data.year || '').toString().toLowerCase();

                    return (
                        brand.includes(normalizedSearchTerm) ||
                        model.includes(normalizedSearchTerm) ||
                        year.includes(normalizedSearchTerm)
                    );
                })
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Ensure image is always an array
                    image: doc.data().image ? 
                        (Array.isArray(doc.data().image) ? 
                            doc.data().image : 
                            Object.values(doc.data().image)
                        ) : []
                }));

            return filteredWatches;
        } catch (error) {
            console.error('Error searching watches:', error);
            throw error;
        }
    };

    const getFilteredWatches = async (filters: {
        brand?: string;
        model?: string;
        year?: string;
        caseMaterial?: string;
    }) => {
        try {
            const watchesRef = collection(db, 'Watches');
            let q = query(watchesRef);

            // Add filters if they exist
            if (filters.brand) {
                q = query(q, where('brand', '==', filters.brand));
            }
            if (filters.model) {
                q = query(q, where('model', '==', filters.model));
            }
            if (filters.year) {
                q = query(q, where('year', '==', filters.year));
            }
            if (filters.caseMaterial) {
                q = query(q, where('caseMaterial', '==', filters.caseMaterial));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                image: doc.data().image ? 
                    (Array.isArray(doc.data().image) ? 
                        doc.data().image : 
                        Object.values(doc.data().image)
                    ) : []
            }));
        } catch (error) {
            console.error('Error filtering watches:', error);
            throw error;
        }
    };

    return {
        getDocumentById,
        getCollectionDocs,
        getWatchesByBrand,
        searchWatches,
        getFilteredWatches
    };
}