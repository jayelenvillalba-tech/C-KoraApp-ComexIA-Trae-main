import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MarketplaceFilters {
  sector?: string;
  type?: string;
  hsCode?: string;
  country?: string;
  subcategory?: string;
  incoterm?: string;
  ecological?: boolean;
}

interface MarketplaceContextType {
  filters: MarketplaceFilters;
  setFilters: (filters: MarketplaceFilters) => void;
  selectedPost: any | null;
  setSelectedPost: (post: any | null) => void;
  // Helper to get countries from current filters
  getFilteredCountries: () => string[];
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const getFilteredCountries = () => {
    const countries: string[] = [];
    if (filters.country) {
      countries.push(filters.country);
    }
    // Could be extended to extract countries from active posts
    return countries;
  };

  return (
    <MarketplaceContext.Provider
      value={{
        filters,
        setFilters,
        selectedPost,
        setSelectedPost,
        getFilteredCountries
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
