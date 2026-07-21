import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Product,
  ProductsResponse,
  SingleProductResponse,
  DeleteProductResponse,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload
} from './Product/models/product.model';
import { ProductApiService } from './Product/services/product-api.service';
import { ProductInventoryService } from './Product/services/product-inventory.service';
import { ProductCartIntegrationService } from './Product/services/product-cart-integration.service';
import { ProductOrderIntegrationService } from './Product/services/product-order-integration.service';
import { StockCheckResult, CartResponse, AddToCartPayload } from './Product/models/product-cart-relation.model';
import { CreateOrderPayload, OrderResponse, OrderListResponse } from './Product/models/product-order-relation.model';

// Re-export all sub-modules for backwards compatibility
export * from './Product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private productApiService: ProductApiService,
    private inventoryService: ProductInventoryService,
    private cartIntegrationService: ProductCartIntegrationService,
    private orderIntegrationService: ProductOrderIntegrationService
  ) {}

  // ─── Product API Facade Methods ─────────────────────────────────────────────

  getProducts(params: ProductQueryParams = {}): Observable<ProductsResponse> {
    return this.productApiService.getProducts(params);
  }

  getProductById(id: string): Observable<SingleProductResponse> {
    return this.productApiService.getProductById(id);
  }

  createProduct(payload: CreateProductPayload): Observable<SingleProductResponse> {
    return this.productApiService.createProduct(payload);
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<SingleProductResponse> {
    return this.productApiService.updateProduct(id, payload);
  }

  deleteProduct(id: string): Observable<DeleteProductResponse> {
    return this.productApiService.deleteProduct(id);
  }

  // ─── Inventory Sub-service Facade Methods ────────────────────────────────────

  checkStock(productId: string, requestedQuantity: number): Observable<StockCheckResult> {
    return this.inventoryService.checkStock(productId, requestedQuantity);
  }

  isInStock(product: Product, quantityNeeded: number = 1): boolean {
    return this.inventoryService.isInStock(product, quantityNeeded);
  }

  // ─── Cart Integration Sub-service Facade Methods ─────────────────────────────

  getCart(): Observable<CartResponse> {
    return this.cartIntegrationService.getCart();
  }

  addProductToCart(payload: AddToCartPayload): Observable<CartResponse> {
    return this.cartIntegrationService.addProductToCart(payload);
  }

  updateCartItem(productId: string, quantity: number): Observable<CartResponse> {
    return this.cartIntegrationService.updateCartItem(productId, quantity);
  }

  removeProductFromCart(productId: string): Observable<CartResponse> {
    return this.cartIntegrationService.removeProductFromCart(productId);
  }

  // ─── Order Integration Sub-service Facade Methods ────────────────────────────

  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    return this.orderIntegrationService.createOrder(payload);
  }

  getUserOrders(): Observable<OrderListResponse> {
    return this.orderIntegrationService.getUserOrders();
  }

  getOrderById(id: string): Observable<OrderResponse> {
    return this.orderIntegrationService.getOrderById(id);
  }
}
