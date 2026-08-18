export interface ProductDocument {
  id: string;
  productId: string;
  type: string; // e.g., "Technical Datasheet", "Installation Manual", "Product Brochure"
  version: string;
  file: string;
  title: string;
  fileSize?: string;
  publishDate?: string;
}

export interface Product {
  id: string; // Unique Immutable Product ID, e.g. M-101, P-100
  model: string; // Model number
  name: string; // Product name
  category: string; // e.g., "Motors", "Pumps", "Controllers", "Gearboxes", "Valves", "Compressors"
  description: string;
  image: string; // Product image path
  specifications: {
    [key: string]: string;
  };
  applications: string[];
  compatibleProducts: string[]; // List of Product IDs
  relatedProducts: string[]; // List of Product IDs
  documents: ProductDocument[];
  version?: number;
  lastUpdated?: string;
}

export interface Category {
  id: string; // e.g., "motors"
  name: string; // e.g., "Industrial Motors"
  description: string;
  image: string;
  productCount: number;
}

export interface QuoteRequest {
  productId: string;
  model: string;
  name: string;
  quantity: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  application: string;
  message: string;
}
