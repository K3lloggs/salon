import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  showLoading: () => { },
  hideLoading: () => { },
});

export const useLoading = () => useContext(LoadingContext);

// Global flag to prevent loading on subsequent tab changes
let initialNavigationCompleted = true; // Start as true to prevent initial loading

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  // Initialize loading state as false and never show it
  const [isLoading, setIsLoading] = useState(false);

  // These functions do nothing to prevent any loading indicators
  const showLoading = useCallback(() => {
    // Intentionally empty
  }, []);

  const hideLoading = useCallback(() => {
    // Intentionally empty
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}