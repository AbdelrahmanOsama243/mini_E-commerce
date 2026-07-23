import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard } from './core/guards/auth.guard';

import { HomeComponent } from './Feather/home/home';
import { LoginComponent } from './Feather/auth/login/login';
import { RegisterComponent } from './Feather/auth/register/register';
import { ProductListComponent } from './Feather/products/product-list/product-list';
import { ProductDetailComponent } from './Feather/products/product-detail/product-detail';
import { CartComponent } from './Feather/cart/cart';
import { CheckoutComponent } from './Feather/checkout-page/checkout-page';
import { OrderHistoryComponent } from './Feather/orders/order-list/order-list';
import { OrderDetailComponent } from './Feather/orders/order-detail/order-detail';
import { AdminProductsComponent } from './Feather/admin-products/product-table/product-table';
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
    path: 'products',
    component: ProductListComponent
  },
  {
    path: 'products/:id',
    component: ProductDetailComponent
  },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
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
    path: 'admin/products',
    component: AdminProductsComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
