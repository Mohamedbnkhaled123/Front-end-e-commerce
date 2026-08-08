import { Routes } from '@angular/router';

// Guards & Resolvers only (these are tiny, always needed)
import { adminGuard } from './core/guards/admin-guard';
import { dashboardLoginGuard } from './core/guards/dashboard-login-guard';
import { mathuserGuard } from './core/guards/mathuser-guard';
import { deactivateGuard } from './core/guards/deactivate-guard';
import { authGuard } from './core/guards/auth-guard';
import { superadminSetupGuard } from './core/guards/superadmin-setup-guard';
import { productResolver } from './core/resolvers/product.resolver';


export const routes: Routes = [
  // --- Storefront Routes ---
  {
    path: '',
    loadComponent: () => import('./frontend/frontend').then(m => m.Frontend),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./frontend/home/home.component').then(m => m.Home) },
      { path: 'products', loadComponent: () => import('./frontend/products/products.component').then(m => m.Products) },
      { path: 'products/:slug', loadComponent: () => import('./frontend/product-details/product-details.component').then(m => m.ProductDetails), resolve: { productData: productResolver } },
      { path: 'login', loadComponent: () => import('./frontend/login/login.component').then(m => m.Login) },
      { path: 'dashboard-login', loadComponent: () => import('./dashboard/dashboard-login/dashboard-login.component').then(m => m.DashboardLogin), canActivate: [dashboardLoginGuard] },
      { path: 'superadmin-setup', loadComponent: () => import('./dashboard/superadmin-setup/superadmin-setup.component').then(m => m.SuperadminSetup), canActivate: [superadminSetupGuard] },
      { path: 'signup', loadComponent: () => import('./frontend/signup/signup.component').then(m => m.Signup), canDeactivate: [deactivateGuard] },
      { path: 'account', loadComponent: () => import('./frontend/account/account.component').then(m => m.Account), canMatch: [mathuserGuard] },
      { path: 'cart', loadComponent: () => import('./frontend/cart/cart.component').then(m => m.Cart) },
      { path: 'checkout', loadComponent: () => import('./frontend/checkout/checkout.component').then(m => m.Checkout), canActivate: [authGuard] },
      { path: 'my-orders', loadComponent: () => import('./frontend/my-orders/my-orders.component').then(m => m.MyOrders), canActivate: [authGuard] },
      { path: 'about', loadComponent: () => import('./frontend/about/about.component').then(m => m.About) },
      { path: 'policy', loadComponent: () => import('./frontend/policy/policy.component').then(m => m.Policy) },
      { path: 'faq', loadComponent: () => import('./frontend/faq/faq.component').then(m => m.Faq) },
      { path: 'contact', loadComponent: () => import('./frontend/contact/contact.component').then(m => m.Contact) },
    ]
  },

  // --- Admin / Dashboard Routes (lazy-loaded as a group) ---
  {
    path: 'admin',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'home', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics', loadComponent: () => import('./dashboard/admin-analytics/admin-analytics.component').then(m => m.AdminAnalytics) },
      { path: 'coupons', loadComponent: () => import('./dashboard/admin-coupons/admin-coupons.component').then(m => m.AdminCoupons) },
      { path: 'listusers', loadComponent: () => import('./dashboard/users-list/users-list.component').then(m => m.UsersList) },
      { path: 'adduser', loadComponent: () => import('./dashboard/users-list/add-user/add-user.component').then(m => m.AddUser) },
      { path: 'orders', loadComponent: () => import('./dashboard/admin-orders/admin-orders.component').then(m => m.AdminOrders) },
      { path: 'cms', loadComponent: () => import('./dashboard/admin-cms/admin-cms.component').then(m => m.AdminCms) },
      { path: 'reviews', loadComponent: () => import('./dashboard/admin-reviews/admin-reviews.component').then(m => m.AdminReviews) },
      { path: 'products', loadComponent: () => import('./dashboard/admin-products/admin-products.component').then(m => m.AdminProducts) },
      { path: 'products/add', loadComponent: () => import('./dashboard/admin-products/add-product/add-product.component').then(m => m.AddProduct) },
      { path: 'products/edit/:id', loadComponent: () => import('./dashboard/admin-products/edit-product/edit-product.component').then(m => m.EditProduct) },
      { path: 'messages', loadComponent: () => import('./dashboard/admin-messages/admin-messages.component').then(m => m.AdminMessages) },
    ]
  },
  { path: 'dashboard', redirectTo: 'admin', pathMatch: 'prefix' },

  // --- 404 Wildcard ---
  { path: '**', loadComponent: () => import('./shared/not-found/not-found.component').then(m => m.NotFound) }
];
