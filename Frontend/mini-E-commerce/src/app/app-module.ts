import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { httpTokenInterceptor } from './core/interceptors/http-token.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Shared Components
import { ToastComponent } from './shared/toast/toast';
import { ProductCardComponent } from './shared/product-card/product-card';
import { NotFoundComponent } from './shared/not-found/not-found';
import { NavbarComponent } from './shared/navbar/navbar';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner';
import { FooterComponent } from './shared/footer/footer';

// Feather Components
import { ProductListComponent } from './Feather/products/product-list/product-list';
import { ProductDetailComponent } from './Feather/products/product-detail/product-detail';
import { HomeComponent } from './Feather/home/home';
import { OrderHistoryComponent } from './Feather/orders/order-list/order-list';
import { OrderDetailComponent } from './Feather/orders/order-detail/order-detail';
import { CheckoutComponent } from './Feather/checkout-page/checkout-page';
import { CartComponent } from './Feather/cart/cart';
import { AdminProductsComponent } from './Feather/admin-products/product-table/product-table';
import { RegisterComponent } from './Feather/auth/register/register';
import { LoginComponent } from './Feather/auth/login/login';

@NgModule({
  declarations: [
    App,
    ToastComponent,
    ProductCardComponent,
    NotFoundComponent,
    NavbarComponent,
    LoadingSpinnerComponent,
    FooterComponent,
    ProductListComponent,
    ProductDetailComponent,
    HomeComponent,
    OrderHistoryComponent,
    OrderDetailComponent,
    CheckoutComponent,
    CartComponent,
    AdminProductsComponent,
    RegisterComponent,
    LoginComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([httpTokenInterceptor, errorInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
