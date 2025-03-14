export interface Watch {
    id: string;
    brand: string;
    model: string;
    price: number;
    year?: string;
    image: string[];
    condition?: string;
    [key: string]: string | number | string[] | boolean | undefined; // Allow indexing
}
