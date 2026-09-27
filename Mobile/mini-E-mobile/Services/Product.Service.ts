import { handleApiResponse, handleCentralError, ApiResponse } from '../Utils/errorHandler';
import axiosInstance from '../core/interceptors/HttpTokenInterceptor/HttpTokenInterceptor';

export interface Product {
  _id: string;
  createdBy?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetProductsQueryParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  image?: string;
}

export const ProductService = {
  /**
   * Get paginated products with optional search and category filters
   */
  async getProducts(params?: GetProductsQueryParams): Promise<PaginatedProductsResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedProductsResponse>>('/products', {
        params
      });

      return await handleApiResponse<PaginatedProductsResponse>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Get single product details by ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await axiosInstance.get<ApiResponse<Product>>(`/products/${id}`);

      return await handleApiResponse<Product>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Create a new product (Requires Admin Token)
   */
  async createProduct(payload: CreateProductPayload): Promise<Product> {
    try {
      const response = await axiosInstance.post<ApiResponse<Product>>('/products', payload);

      return await handleApiResponse<Product>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Create a new product with an image (Requires Admin Token)
   */
  async createProductWithImage(payload: CreateProductPayload, imageUri: string): Promise<Product> {
    try {
      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('category', payload.category);
      formData.append('price', payload.price.toString());
      formData.append('stock', payload.stock.toString());
      if (payload.description) formData.append('description', payload.description);

      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await axiosInstance.post<ApiResponse<Product>>('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return await handleApiResponse<Product>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Update an existing product by ID (Requires Admin Token)
   */
  async updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    try {
      const response = await axiosInstance.put<ApiResponse<Product>>(`/products/${id}`, payload);

      return await handleApiResponse<Product>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Delete a product by ID (Requires Admin Token)
   */
  async deleteProduct(id: string): Promise<null> {
    try {
      const response = await axiosInstance.delete<ApiResponse<null>>(`/products/${id}`);

      return await handleApiResponse<null>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },
};
