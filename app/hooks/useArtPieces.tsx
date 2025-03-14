// app/hooks/useArtPiece.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ArtPiece } from '../types/ArtPiece';

export function useArtPiece() {
  const [artPieces, setArtPieces] = useState<ArtPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtPieces = async () => {
      setLoading(true);
      setError(null);

      try {
        // Changed from 'ArtPieces' to 'Art' to match your Firebase collection
        const colRef = collection(db, 'Art');
        const snapshot = await getDocs(colRef);
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            artist: data.artist || 'Unknown Artist',
            year: data.year || '',
            medium: data.medium,
            dimensions: data.dimensions,
            description: data.description,
            price: data.price,
            // Handle image data as an array with mapped URLs
            image: Array.isArray(data.image) ? 
              data.image.map((img: string) => img) : 
              [data.image],
            newArrival: data.newArrival || false,
          } as ArtPiece;
        });

        setArtPieces(items);
      } catch (err) {
        console.error('Error fetching art pieces:', err);
        setError(err instanceof Error ? err.message : 'Error fetching art pieces');
      } finally {
        setLoading(false);
      }
    };

    fetchArtPieces();
  }, []);

  return { artPieces, loading, error };
}