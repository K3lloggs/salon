import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Watch } from "../types/Watch";
import { SortOption } from "../context/SortContext";

export function useWatches(searchQuery: string = "", sortOption: SortOption = null) {
  const [allWatches, setAllWatches] = useState<Watch[]>([]);
  const [filteredWatches, setFilteredWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all watches once when the hook is mounted.
  useEffect(() => {
    const fetchWatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const watchesRef = collection(db, "Watches");
        // Fetch all documents without filtering or ordering from Firebase.
        const querySnapshot = await getDocs(watchesRef);

        const watchesData = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // Process image field into an array.
          let images: string[] = [];
          if (data.image) {
            if (Array.isArray(data.image)) {
              images = data.image;
            } else if (typeof data.image === "object") {
              images = Object.values(data.image);
            }
          }

          // Process the dateAdded field.
          let dateAddedMillis = 0;
          if (data.dateAdded && typeof data.dateAdded.toMillis === 'function') {
            dateAddedMillis = data.dateAdded.toMillis();
          } else {
            dateAddedMillis = Number(data.dateAdded);
          }

          // Determine if the watch is a new arrival (within last 14 days).
          const isNewArrival = Date.now() - dateAddedMillis < 14 * 24 * 60 * 60 * 1000;

          return {
            id: doc.id,
            brand: data.brand || "",
            model: data.model || "",
            price: Number(data.price) || 0,
            year: String(data.year || ""),
            image: images,
            caseMaterial: data.caseMaterial || "",
            caseDiameter: data.caseDiameter || "",
            box: data.box || false,
            papers: data.papers || false,
            newArrival: isNewArrival,
            movement: data.movement || "",
            hold: data.hold || "",
            powerReserve: data.powerReserve || "",
            dial: data.dial || "",
            strap: data.strap || "",
            referenceNumber: data.referenceNumber || "",
            sku: data.sku || "",
            description: data.description || "",
            dateAdded: dateAddedMillis,
            likes: data.likes ?? 0,
            warranty: data.warranty || "",
            msrp: data.msrp || 0,
            complications: data.complications || [],
            exhibitionCaseback: data.exhibitionCaseback || false,
          } as Watch;
        });

        setAllWatches(watchesData);
      } catch (err) {
        console.error("Error fetching watches:", err);
        setError(err instanceof Error ? err.message : "Error fetching watches");
      } finally {
        setLoading(false);
      }
    };

    fetchWatches();
  }, []);

  // Filter and sort watches in memory whenever searchQuery, sortOption, or the fetched data changes.
  useEffect(() => {
    let filtered = allWatches;

    if (searchQuery.trim()) {
      const queryStr = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((watch) => {
        const brand = String(watch.brand || "").toLowerCase();
        const model = String(watch.model || "").toLowerCase();
        const year = String(watch.year || "").toLowerCase();
        const sku = String(watch.sku || "").toLowerCase();
        const referenceNumber = String(watch.referenceNumber || "").toLowerCase();
        
        return (
          brand.includes(queryStr) || 
          model.includes(queryStr) || 
          year.includes(queryStr) ||
          sku.includes(queryStr) ||
          referenceNumber.includes(queryStr)
        );
      });
    }

    // Sort the filtered list based on sortOption.
    if (sortOption === "highToLow") {
      filtered = filtered.slice().sort((a, b) => b.price - a.price);
    } else if (sortOption === "lowToHigh") {
      filtered = filtered.slice().sort((a, b) => a.price - b.price);
    } else {
      // Default sort by brand alphabetically.
      filtered = filtered.slice().sort((a, b) => a.brand.localeCompare(b.brand));
    }

    setFilteredWatches(filtered);
  }, [allWatches, searchQuery, sortOption]);

  return { watches: filteredWatches, loading, error };
}