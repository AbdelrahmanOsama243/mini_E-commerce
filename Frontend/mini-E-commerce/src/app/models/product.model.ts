export interface Product {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    items: Product[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface SingleProductResponse {
  success: boolean;
  message: string;
  data: Product;
}
