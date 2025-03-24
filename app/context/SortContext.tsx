import React, { createContext, useState, useContext } from 'react';

export type SortOption = 'highToLow' | 'lowToHigh' | 'mostLiked' | 'leastLiked' | 'random' | null;

interface SortContextType {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
}

const SortContext = createContext<SortContextType | undefined>(undefined);

export const SortProvider = ({ children }: { children: React.ReactNode }) => {
  const [sortOption, setSortOption] = useState<SortOption>(null);

  return (
    <SortContext.Provider value={{ sortOption, setSortOption }}>
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