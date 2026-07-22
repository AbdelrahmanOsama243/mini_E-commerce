import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductReadService } from './product-service/product-read.service';
import { ProductWriteService } from './product-service/product-write.service';
import {
  Product,
  ProductsResponse,
  SingleProductResponse,
  DeleteProductResponse,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload
} from '../Models/iproduct';

export type { Product, ProductsResponse, SingleProductResponse, DeleteProductResponse, ProductQueryParams, CreateProductPayload, UpdateProductPayload };

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private readService: ProductReadService,
    private writeService: ProductWriteService
  ) {}

  getProducts(params: ProductQueryParams = {}): Observable<ProductsResponse> {
    return this.readService.getProducts(params);
  }

  getProductById(id: string): Observable<SingleProductResponse> {
    return this.readService.getProductById(id);
  }

  createProduct(payload: CreateProductPayload): Observable<SingleProductResponse> {
    return this.writeService.createProduct(payload);
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<SingleProductResponse> {
    return this.writeService.updateProduct(id, payload);
  }

  deleteProduct(id: string): Observable<DeleteProductResponse> {
    return this.writeService.deleteProduct(id);
  }
}
