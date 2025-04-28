import React, { createContext, useState, useContext, useRef } from 'react';
import { Watch } from '../types/Watch';

export type SortOption = 'highToLow' | 'lowToHigh' | 'mostLiked' | null;

interface SortContextType {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  // Store separate sort states for different screens
  indexSortOption: SortOption;
  setIndexSortOption: (option: SortOption) => void;
  newArrivalsSortOption: SortOption;
  setNewArrivalsSortOption: (option: SortOption) => void;
  // Get sorted watches with stable random order
  getSortedWatches: (watches: Watch[], option: SortOption) => Watch[];
}

const SortContext = createContext<SortContextType | undefined>(undefined);

export const SortProvider = ({ children }: { children: React.ReactNode }) => {
  // General sort option (for backward compatibility)
  const [sortOption, setSortOption] = useState<SortOption>(null);
  
  // Screen-specific sort options
  const [indexSortOption, setIndexSortOption] = useState<SortOption>(null);
  const [newArrivalsSortOption, setNewArrivalsSortOption] = useState<SortOption>(null);
  
  // Store random order to keep it consistent between renders
  const randomOrderRef = useRef<Map<string, number>>(new Map());
  
  // Function to sort watches with consistent random ordering
  const getSortedWatches = (watches: Watch[], option: SortOption): Watch[] => {
    if (!watches || watches.length === 0) return [];
    
    // Ensure we have random values for all watches
    watches.forEach(watch => {
      if (!randomOrderRef.current.has(watch.id)) {
        randomOrderRef.current.set(watch.id, Math.random());
      }
    });
    
    if (option === 'highToLow') {
      return [...watches].sort((a, b) => b.price - a.price);
    } else if (option === 'lowToHigh') {
      return [...watches].sort((a, b) => a.price - b.price);
    } else if (option === 'mostLiked') {
      return [...watches].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Default to random for null or any other value
      return [...watches].sort((a, b) => {
        const randomA = randomOrderRef.current.get(a.id) || 0;
        const randomB = randomOrderRef.current.get(b.id) || 0;
        return randomA - randomB;
      });
    }
  };

  return (
    <SortContext.Provider value={{ 
      sortOption, 
      setSortOption,
      indexSortOption,
      setIndexSortOption,
      newArrivalsSortOption,
      setNewArrivalsSortOption,
      getSortedWatches
    }}>
      {children}
    </SortContext.Provider>
  );
};

export const useSortContext = () => {
  const context = useContext(SortContext);
  if (!context) {
    throw new Error('useSortContext must be used within a SortProvider');
  }
  return context;
};