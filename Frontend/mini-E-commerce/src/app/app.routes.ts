import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard } from './core/guards/auth.guard';

import { HomeComponent } from './Feather/home/home';
import { LoginComponent } from './Feather/auth/login/login';
import { RegisterComponent } from './Feather/auth/register/register';
import { VerifyEmailComponent } from './Feather/auth/verify-email/verify-email';
import { ForgotPasswordComponent } from './Feather/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './Feather/auth/reset-password/reset-password';
import { ProductListComponent } from './Feather/products/product-list/product-list';
import { ProductDetailComponent } from './Feather/products/product-detail/product-detail';
import { CartComponent } from './Feather/cart/cart';
import { CheckoutComponent } from './Feather/checkout-page/checkout-page';
import { OrderHistoryComponent } from './Feather/orders/order-list/order-list';
import { OrderDetailComponent } from './Feather/orders/order-detail/order-detail';
import { AdminProductsComponent } from './Feather/admin-products/product-table/product-table';
import { UserDashboardComponent } from './Feather/dashboard/user-dashboard/user-dashboard';
import { AdminDashboardComponent } from './Feather/dashboard/admin-dashboard/admin-dashboard';
import { PaymentIframeComponent } from './Feather/payment/payment-iframe/payment-iframe';
import { FawryReferenceComponent } from './Feather/payment/fawry-reference/fawry-reference';
import { PaymentSuccessComponent } from './Feather/payment/payment-success/payment-success';
import { PaymentFailedComponent } from './Feather/payment/payment-failed/payment-failed';
import { NotFoundComponent } from './shared/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent
  },
  {
    path: 'verify-email/:token',
    component: VerifyEmailComponent
  },
  {
    path: 'products',
    component: ProductListComponent
  },
  {
    path: 'products/:id',
    component: ProductDetailComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/iframe',
    component: PaymentIframeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/fawry-reference',
    component: FawryReferenceComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/success',
    component: PaymentSuccessComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment/failed',
    component: PaymentFailedComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    component: OrderHistoryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'orders/:id',
    component: OrderDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin/products',
    component: AdminProductsComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
