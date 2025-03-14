// app/types/ArtPiece.ts

export interface ArtPiece {
    id: string; 
    title: string;
    artist: string;
    year?: string;
    medium?: string;
    dimensions?: string;
    description?: string;
  
    /**
     * Can be a numeric price (e.g., 1000) or a text string (e.g., "Price Upon Request")
     */
    price: number | string;
  
    /**
     * Array of image URLs
     */
    image: string[];
  
    newArrival?: boolean;
  }
  