export interface FirebaseWatch {
    id: string;
    brand: string;
    model: string;
    year: number;            // e.g. 2015
    price: number;           // e.g. 190000
    diameter: number;        // e.g. 38
    movement: string;        // e.g. "Automatic"
    caseMaterial: string;    // e.g. "Gold"
    dial: string;            // e.g. "Journe"
    newArrival: boolean;     // e.g. true
    box: boolean;            // e.g. true
    papers: boolean;         // e.g. true
    powerReserve: string;    // e.g. "90 hours"
    strap: string;           // e.g. "brown alligator leather"
    warranty: string;        // e.g. "2 years"
    dateAdded: string;       // stored as string (or could be Timestamp)
    image: string[];
}
