// app/types/Watch.ts
export interface Watch {
  id: string;
  brand: string;
  model: string;
  dial: string;
  movement: string;
  powerReserve: string;
  strap: string;
  price: number;
  year?: string;
  image: string[]; // Array of image URLs
  caseMaterial?: string;
  caseDiameter?: string;
  referenceNumber?: string;
  box?: boolean;
  papers?: boolean;
  newArrival?: boolean;
  description?: string;
  sku?: string;
  msrp?: number;
  likes?: number; // <-- Already added

  // New fields
  warranty?: string;
  complications?: string[];
  exhibitionCaseback?: boolean;

  // Optionally allow unknown additional properties:
  [key: string]: string | number | string[] | boolean | undefined;
}