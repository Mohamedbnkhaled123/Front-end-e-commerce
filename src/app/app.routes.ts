import { Routes } from '@angular/router';
import { Frontend } from './frontend/frontend';
import { Dashboard } from './dashboard/dashboard';

// Storefront Components
import { Home } from './frontend/home/home.component';
import { Products } from './frontend/products/products.component';
import { ProductDetails } from './frontend/product-details/product-details.component';
import { Login } from './frontend/login/login.component';
import { Signup } from './frontend/signup/signup.component';
import { Account } from './frontend/account/account.component';
import { Cart } from './frontend/cart/cart.component';
import { Checkout } from './frontend/checkout/checkout.component';
import { MyOrders } from './frontend/my-orders/my-orders.component';
import { About } from './frontend/about/about.component';
import { Policy } from './frontend/policy/policy.component';
import { Faq } from './frontend/faq/faq.component';
import { Contact } from './frontend/contact/contact.component';

// Admin / Dashboard Components
import { DashboardLogin } from './dashboard/dashboard-login/dashboard-login.component';
import { Home as AdminHome } from './dashboard/home/home.component';
import { UsersList } from './dashboard/users-list/users-list.component';
import { AddUser } from './dashboard/users-list/add-user/add-user.component';
import { AdminOrders } from './dashboard/admin-orders/admin-orders.component';
import { AdminCms } from './dashboard/admin-cms/admin-cms.component';
import { AdminReviews } from './dashboard/admin-reviews/admin-reviews.component';
import { AdminProducts } from './dashboard/admin-products/admin-products.component';
import { AddProduct } from './dashboard/admin-products/add-product/add-product.component';
import { EditProduct } from './dashboard/admin-products/edit-product/edit-product.component';

// Shared Components
import { NotFound } from './shared/not-found/not-found.component';

// Guards & Resolvers
import { adminGuard } from './core/guards/admin-guard';
import { mathuserGuard } from './core/guards/mathuser-guard';
import { deactivateGuard } from './core/guards/deactivate-guard';
import { authGuard } from './core/guards/auth-guard';
import { productResolver } from './core/resolvers/product.resolver';

export const routes: Routes = [
  // --- Storefront Routes ---
  {
    path: '',
    component: Frontend,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'products', component: Products },
      { path: 'products/:slug', component: ProductDetails, resolve: { productData: productResolver } },
      { path: 'login', component: Login },
      { path: 'dashboard-login', component: DashboardLogin },
      { path: 'signup', component: Signup, canDeactivate: [deactivateGuard] },
      { path: 'account', component: Account, canMatch: [mathuserGuard] },
      { path: 'cart', component: Cart },
      { path: 'checkout', component: Checkout, canActivate: [authGuard] },
      { path: 'my-orders', component: MyOrders, canActivate: [authGuard] },
      { path: 'about', component: About },
      { path: 'policy', component: Policy },
      { path: 'faq', component: Faq },
      { path: 'contact', component: Contact },
    ]
  },

  // --- Admin / Dashboard Routes ---
  {
    path: 'admin',
    component: Dashboard,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: AdminHome },
      { path: 'listusers', component: UsersList },
      { path: 'adduser', component: AddUser },
      { path: 'orders', component: AdminOrders },
      { path: 'cms', component: AdminCms },
      { path: 'reviews', component: AdminReviews },
      { path: 'products', component: AdminProducts },
      { path: 'products/add', component: AddProduct },
      { path: 'products/edit/:id', component: EditProduct },
    ]
  },
  { path: 'dashboard', redirectTo: 'admin', pathMatch: 'prefix' },

  // --- 404 Wildcard ---
  { path: '**', component: NotFound }
];
