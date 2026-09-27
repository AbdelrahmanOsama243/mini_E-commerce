import { NgModule, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { httpTokenInterceptor } from './core/interceptors/http-token.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/Services/auth-service';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

export function initializeApp(authService: AuthService) {
  return () => authService.initAuth();
}

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
import { UserDashboardComponent } from './Feather/dashboard/user-dashboard/user-dashboard';
import { AdminDashboardComponent } from './Feather/dashboard/admin-dashboard/admin-dashboard';
import { RegisterComponent } from './Feather/auth/register/register';
import { LoginComponent } from './Feather/auth/login/login';
import { VerifyEmailComponent } from './Feather/auth/verify-email/verify-email';
import { ForgotPasswordComponent } from './Feather/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './Feather/auth/reset-password/reset-password';
import { PaymentIframeComponent } from './Feather/payment/payment-iframe/payment-iframe';
import { FawryReferenceComponent } from './Feather/payment/fawry-reference/fawry-reference';
import { PaymentSuccessComponent } from './Feather/payment/payment-success/payment-success';
import { PaymentFailedComponent } from './Feather/payment/payment-failed/payment-failed';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgxChartsModule } from '@swimlane/ngx-charts';

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
    UserDashboardComponent,
    AdminDashboardComponent,
    RegisterComponent,
    LoginComponent,
    VerifyEmailComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    PaymentIframeComponent,
    FawryReferenceComponent,
    PaymentSuccessComponent,
    PaymentFailedComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, NgxChartsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([httpTokenInterceptor, errorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}

