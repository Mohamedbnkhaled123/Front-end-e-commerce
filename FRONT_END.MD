# 📋 FRONT_END — دليل بناء مشروع E-Commerce (Front-end)

> **الهدف:** ملف مرجعي يوثق الوضع الحالي لمشروع الـ Angular
> كما هو مكتوب ومبني فعلياً في مجلد:
> ```text
> myStore
> ```

---

## 📚 المهارات والتقنيات المستخدمة في الـ Front-end

| # | المهارة | أين طُبقت | الحالة |
|---|---------|-----------|--------|
| 1 | Angular Standalone Components | جميع المكونات بدون استثناء | ✅ مكتمل |
| 2 | Component Imports System | ملفات الـ ts للمكونات (بدون NgModule) | ✅ مكتمل |
| 3 | Angular Signals | `signals.ts` — `signal()` + `effect()` + `update()` | ✅ مكتمل |
| 4 | Client-side Routing | `app.routes.ts` | ✅ مكتمل |
| 5 | Nested Routes (Children) | `app.routes.ts` — Frontend + Dashboard | ✅ مكتمل |
| 6 | Route Parameters (`:slug`) | `app.routes.ts` — `products/:slug` | ✅ مكتمل |
| 7 | HTTP Client + API Connection | `product-service.ts`, `auth-service.ts`, `user-service.ts` | ✅ مكتمل |
| 8 | Interfaces (TypeScript Models) | `product.model.ts`, `auth.model.ts`, `user.model.ts`, `canDeactivate.model.ts` | ✅ مكتمل |
| 9 | Environments Config | `src/env/env.ts` + `env.production.ts` | ✅ مكتمل |
| 10 | `@Input()` Decorator | `product.ts` — تمرير بيانات المنتج من الأب للابن | ✅ مكتمل |
| 11 | Control Flow `@for` | `products.html`, `product-details.html` | ✅ مكتمل |
| 12 | Control Flow `@if` / `@else` | `header.html`, `product-details.html` | ✅ مكتمل |
| 13 | Reactive Forms | `login.ts`, `signup.ts` — `FormGroup` + `FormControl` | ✅ مكتمل |
| 14 | Route Guards (`canActivate`) | `auth-guard.ts`, `admin-guard.ts` | ✅ مكتمل |
| 15 | Route Guards (`canMatch`) | `mathuser-guard.ts` — حماية صفحة الحساب | ✅ مكتمل |
| 16 | Route Guards (`canDeactivate`) | `deactivate-guard.ts` — حماية مغادرة صفحة التسجيل | ✅ مكتمل |
| 17 | HTTP Interceptors | `auth-interceptor.ts` — إرفاق التوكن تلقائياً | ✅ مكتمل |
| 18 | Error Handler Interceptor | `error-handler-interceptor.ts` — معالجة أكواد 401/403/404 | ✅ مكتمل |
| 19 | Resolvers (Pre-fetch Data) | `product.reslover.ts` — تحميل بيانات المنتج قبل فتح الصفحة | ✅ مكتمل |
| 20 | Built-in Pipes | `pipes.ts` — 10 Pipes مختلفة (UpperCase, Date, Currency...) | ✅ مكتمل |
| 21 | Custom Pipe | `nospace.pipe.ts` — حذف المسافات من النصوص | ✅ مكتمل |
| 22 | Async Pipe | `pipes.ts` — عرض بيانات Promise تلقائياً | ✅ مكتمل |
| 23 | JWT Authentication | `auth-service.ts` — تسجيل دخول + حفظ/قراءة/حذف التوكن | ✅ مكتمل |
| 24 | JWT Decoding | `auth-service.ts` — فك تشفير التوكن + فحص الصلاحية والانتهاء | ✅ مكتمل |
| 25 | BehaviorSubject (State) | `auth-service.ts` — إدارة حالة تسجيل الدخول في كل المكونات | ✅ مكتمل |
| 26 | RxJS `tap` Operator | `auth-service.ts` — تنفيذ Side Effects في الـ Login | ✅ مكتمل |
| 27 | RxJS `catchError` | `error-handler-interceptor.ts`, `product.reslover.ts` | ✅ مكتمل |
| 28 | Subscription Management | `products.ts` — `Subscription` + `ngOnDestroy` لمنع Memory Leaks | ✅ مكتمل |
| 29 | Lazy Loading (loadComponent) | `app.routes.ts` — صفحة الـ Account بـ Dynamic Import | ✅ مكتمل |
| 30 | `@ViewChildren` + `QueryList` | `parent.ts` — الوصول لعدة مكونات أبناء | ✅ مكتمل |
| 31 | Component Lifecycle Hooks | `parent.ts` — توثيق الـ 9 Hooks + تطبيق `ngOnDestroy` | ✅ مكتمل |
| 32 | `RouterLink` + `RouterLinkActive` | `header.html` — تنقل ديناميكي + إبراز الصفحة النشطة | ✅ مكتمل |

---

## 📐 هيكل مجلدات الـ App الحقيقي

```text
src/app/
├── app.config.ts        ← إعدادات التطبيق + تسجيل Interceptors
├── app.routes.ts        ← نظام التوجيه الكامل مع Guards و Resolvers
├── app.ts               ← المكون الجذر + تهيئة الـ Auth
├── app.html             ← القالب الجذر مع RouterOutlet
├── app.css
│
├── core/                ← طبقة البنية التحتية (Services, Guards, Interceptors)
│   ├── models/
│   │   ├── product.model.ts      ← واجهات المنتجات
│   │   ├── auth.model.ts         ← واجهات تسجيل الدخول والتوكن
│   │   ├── user.model.ts         ← واجهات المستخدمين
│   │   └── canDeactivate.model.ts ← واجهة حماية المغادرة
│   ├── services/
│   │   ├── auth-service.ts       ← خدمة المصادقة الكاملة (JWT)
│   │   ├── product-service.ts    ← خدمة جلب المنتجات (API)
│   │   └── user-service.ts       ← خدمة جلب المستخدمين (API)
│   ├── guards/
│   │   ├── auth-guard.ts         ← حماية صفحات المستخدم (canActivate)
│   │   ├── admin-guard.ts        ← حماية لوحة تحكم الأدمن (canActivate)
│   │   ├── mathuser-guard.ts     ← حماية صفحة الحساب (canMatch)
│   │   └── deactivate-guard.ts   ← حماية مغادرة الـ Signup (canDeactivate)
│   ├── interceptors/
│   │   ├── auth-interceptor.ts   ← إرفاق التوكن تلقائياً مع كل Request
│   │   └── error-handler-interceptor.ts ← معالجة أخطاء HTTP المركزية
│   ├── resolvers/
│   │   └── product.reslover.ts   ← تحميل بيانات المنتج قبل فتح الصفحة
│   └── pipes/
│       └── nospace.pipe.ts       ← Pipe مخصص لحذف المسافات
│
├── frontend/            ← واجهة العملاء
│   ├── frontend.ts / .html       ← Layout المغلّف (Header + RouterOutlet)
│   ├── home/                     ← الصفحة الرئيسية
│   ├── login/                    ← تسجيل الدخول (Reactive Forms)
│   ├── signup/                   ← إنشاء حساب جديد (canDeactivate)
│   ├── products/                 ← قائمة المنتجات
│   │   └── product/              ← كارت المنتج الصغير (Card Component)
│   ├── product-details/          ← تفاصيل المنتج + منتجات مشابهة (Resolver)
│   ├── account/                  ← صفحة حسابي (Lazy Loaded)
│   ├── parent/                   ← تجربة @ViewChildren + Lifecycle
│   │   └── child/                ← المكون الابن
│   ├── pipes/                    ← صفحة عرض الـ Pipes
│   ├── signals/                  ← تجربة Angular Signals
│   └── shared/
│       └── header/               ← شريط التنقل الديناميكي
│
├── dashboard/           ← لوحة تحكم الأدمن (محمية بـ adminGuard)
│   ├── dashboard.ts / .html      ← Layout لوحة التحكم
│   ├── home/                     ← الصفحة الرئيسية للأدمن
│   ├── users-list/               ← قائمة المستخدمين
│   │   └── add-user/             ← إضافة مستخدم جديد
│   └── shared/                   ← مكونات مشتركة للـ Dashboard
│
└── shared/              ← مكونات مشتركة عامة
    ├── footer/                   ← التذييل
    └── not-found/                ← صفحة 404
```

---

## 🔧 منطق الأكواد والملفات الرئيسية

### 1. إعدادات التطبيق (App Config)

ملف:
```text
src/app/app.config.ts
```

الكود:
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorHandlerInterceptor } from './core/interceptors/error-handler-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorHandlerInterceptor]))
  ]
};
```

> **ملاحظة:** يتم تسجيل Interceptors (إرفاق التوكن + معالجة الأخطاء) هنا بشكل مركزي لكل التطبيق عبر `withInterceptors`.

---

### 2. إعدادات البيئة (Environments)

ملف:
```text
src/env/env.ts
```

الكود:
```typescript
export const env = {
    apiURL: 'http://localhost:3000/api/v1/',
    staticURL: 'http://localhost:3000/uploads/',
    production: false
}
```

---

### 3. واجهات البيانات (Model Interfaces)

#### واجهة المنتجات
ملف:
```text
src/app/core/models/product.model.ts
```
```typescript
export interface IProduct {
    _id: string;
    name: string;
    desc: string;
    price: number;
    imgURL: string;
    stock: number;
    slug: string;
}

export interface IProductListRes {
    message: string;
    data: IProduct[];
}

export interface IProductRes {
    message: string;
    data: IProduct;
}
```

#### واجهة المصادقة
ملف:
```text
src/app/core/models/auth.model.ts
```
```typescript
export interface IAuthLogin {
    email: string;
    password: string;
}

export interface IAuthLoginRes {
    JWT: string;
}

export interface IJWT {
    id: string;
    name: string;
    role: string;
    iat: number;
    exp: number;
}
```

#### واجهة المستخدمين
ملف:
```text
src/app/core/models/user.model.ts
```
```typescript
export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export interface IUserListRes {
    message: string;
    data: IUser[];
}
```

#### واجهة حماية المغادرة
ملف:
```text
src/app/core/models/canDeactivate.model.ts
```
```typescript
export interface ICanComponentDeactivate {
    canDeactivate: () => boolean | Promise<boolean>;
}
```

---

### 4. خدمة المصادقة الكاملة (Auth Service)

ملف:
```text
src/app/core/services/auth-service.ts
```

الكود:
```typescript
import { Injectable } from '@angular/core';
import { env } from '../../../env/env';
import { HttpClient } from '@angular/common/http';
import { IAuthLogin, IAuthLoginRes, IJWT } from '../models/auth.model';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private _http: HttpClient, private _router: Router) {}

  private isAuthanticate = new BehaviorSubject<string | null>(null);
  apiURL = env.apiURL + 'auth/login';

  // فحص دور المستخدم الحالي من التوكن
  isUser() {
    const token = this.getToken();
    if (token) {
      const decoded = this.jwtDecoding(token);
      if (decoded) {
        return decoded.role;
      }
    }
    return null;
  }

  // Observable لحالة تسجيل الدخول — يُستخدم في الـ Header
  isLogedIn() {
    return this.isAuthanticate.asObservable();
  }

  // تهيئة حالة المصادقة عند بدء التطبيق (App OnInit)
  onInitAuth() {
    const token = this.getToken();
    if (token) {
      const decoded = this.jwtDecoding(token);
      if (decoded) {
        return this.isAuthanticate.next(decoded.name);
      }
    }
    this.isAuthanticate.next(null);
  }

  // تسجيل الدخول + حفظ التوكن + التوجيه حسب الدور
  login(data: IAuthLogin) {
    return this._http.post<IAuthLoginRes>(this.apiURL, data).pipe(tap(res => {
      const token = res.JWT;
      this.storeToken(token);
      const decodedToken = this.jwtDecoding(token);
      if (decodedToken) {
        this.setUserLogin(decodedToken.name);
        if (decodedToken.role === 'user') {
          this._router.navigate(['/home']);
        } else {
          this._router.navigate(['/dashboard', 'home']);
        }
      }
    }));
  }

  setUserLogin(name: string) {
    this.isAuthanticate.next(name);
  }

  // فك تشفير التوكن + التحقق من الصلاحية والانتهاء
  jwtDecoding(token: string): IJWT | null {
    try {
      const decode = jwtDecode<IJWT>(token);
      if (!decode) {
        return null;
      } else {
        const expiry = decode.exp * 1000;
        if (Date.now() > expiry) {
          return null;
        }
      }
      return decode;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  private token_key = 'token';
  private storeToken(token: string) {
    localStorage.setItem(this.token_key, token);
  }

  getToken() {
    return localStorage.getItem(this.token_key);
  }

  private deleteToken() {
    localStorage.removeItem(this.token_key);
  }

  // تسجيل الخروج + مسح التوكن + إعادة التوجيه
  logout() {
    this.deleteToken();
    this.isAuthanticate.next(null);
    this._router.navigate(['/home']);
  }
}
```

---

### 5. خدمة جلب المنتجات (Product Service)

ملف:
```text
src/app/core/services/product-service.ts
```

الكود:
```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../../../env/env';
import { IProduct, IProductListRes, IProductRes } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private _http: HttpClient) {}
  private apiURL = env.apiURL + 'product';

  getAllProducts() {
    return this._http.get<IProductListRes>(this.apiURL);
  }

  getProductBySlug(slug: string) {
    return this._http.get<IProductRes>(this.apiURL + '/' + slug);
  }

  getRelatedProducts(slug: string) {
    return this._http.get<IProductListRes>(this.apiURL + '/related/' + slug);
  }
}
```

---

### 6. خدمة جلب المستخدمين (User Service)

ملف:
```text
src/app/core/services/user-service.ts
```

الكود:
```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUserListRes } from '../models/user.model';
import { env } from '../../../env/env';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiURL = env.apiURL + 'user';
  constructor(private _http: HttpClient, private _authService: AuthService) {}

  getUsers() {
    // التوكن يُرفق تلقائياً عبر الـ Auth Interceptor
    return this._http.get<IUserListRes>(this.apiURL);
  }
}
```

---

### 7. الـ Interceptors

#### Auth Interceptor — إرفاق التوكن تلقائياً
ملف:
```text
src/app/core/interceptors/auth-interceptor.ts
```
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const _authService = inject(AuthService);
  const token = _authService.getToken();
  if (token) {
    const clone = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clone);
  }
  return next(req);
};
```

#### Error Handler Interceptor — معالجة أخطاء HTTP المركزية
ملف:
```text
src/app/core/interceptors/error-handler-interceptor.ts
```
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const _router = inject(Router);
  const _authService = inject(AuthService);

  return next(req).pipe(catchError((error) => {
    console.error(error);
    if (error.status === 401) {
      _authService.logout();
      _router.navigate(['/login']);
    } else if (error.status === 403) {
      _router.navigate(['/login']);
    } else if (error.status === 404) {
      _router.navigate(['/notfound']);
    } else {
      alert('something went wrong');
    }
    return throwError(() => error);
  }));
};
```

---

### 8. Route Guards (حراس المسارات)

#### Auth Guard — حماية صفحات المستخدم
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  if (_authService.isUser() === 'user') {
    return true;
  }
  _router.navigate(['/login']);
  return false;
};
```

#### Admin Guard — حماية لوحة التحكم
```typescript
export const adminGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  if (_authService.isUser() === 'admin') {
    return true;
  }
  _router.navigate(['/login']);
  return false;
};
```

#### CanMatch Guard — حماية صفحة الحساب
```typescript
export const mathuserGuard: CanMatchFn = (route, segments) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  if (_authService.isUser() === 'user') {
    return true;
  }
  _router.navigate(['/login']);
  return false;
};
```

#### CanDeactivate Guard — حماية المغادرة
```typescript
export const deactivateGuard: CanDeactivateFn<ICanComponentDeactivate> = (
  component, currentRoute, currentState, nextState
) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
```

---

### 9. Product Resolver — تحميل البيانات قبل فتح الصفحة

ملف:
```text
src/app/core/resolvers/product.reslover.ts
```
```typescript
@Injectable({ providedIn: 'root' })
export class ProductReslover implements Resolve<IProductRes | null> {
  constructor(private _productService: ProductService, private _router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const slug = route.paramMap.get('slug');
    if (slug) {
      return this._productService.getProductBySlug(slug).pipe(catchError((error) => {
        this._router.navigate(['/products']);
        return of(null);
      }));
    }
    this._router.navigate(['/products']);
    return of(null);
  }
}
```

---

### 10. Custom Pipe — حذف المسافات

ملف:
```text
src/app/core/pipes/nospace.pipe.ts
```
```typescript
@Pipe({ name: 'nospace' })
export class Nospace implements PipeTransform {
  transform(value: string) {
    return value.replaceAll(' ', '');
  }
}
```

---

### 11. نظام المسارات الكامل (Routing System)

ملف:
```text
src/app/app.routes.ts
```
```typescript
export const routes: Routes = [
    // Frontend Routes — واجهة العملاء
    { path: '', component: Frontend, children: [
        { path: '', redirectTo: 'home', pathMatch: 'full' },
        { path: 'home', component: FrontHome },
        { path: 'products', component: Products },
        { path: 'login', component: Login },
        { path: 'products/:slug', component: ProductDetails, resolve: {
            product: ProductReslover
        }},
        // Lazy Loading — التحميل الكسول
        { path: 'account', loadComponent: () =>
            import('./frontend/account/account').then(c => c.Account),
            canMatch: [mathuserGuard]
        },
        { path: 'signup', component: Signup, canDeactivate: [deactivateGuard] },
        { path: 'pipes', component: Pipes },
        { path: 'parent', component: Parent },
        { path: 'signals', component: Signals }
    ]},

    // Dashboard Routes — لوحة تحكم الأدمن (محمية)
    { path: 'dashboard', component: Dashboard, canActivate: [adminGuard], children: [
        { path: '', redirectTo: 'home', pathMatch: 'full' },
        { path: 'home', component: Home },
        { path: 'listusers', component: UsersList },
        { path: 'adduser', component: AddUser }
    ]},

    // 404
    { path: '**', component: NotFound }
];
```

---

### 12. المكون الجذر (App Component)

ملف:
```text
src/app/app.ts
```
```typescript
export class App implements OnInit {
  protected readonly title = signal('myStore');

  constructor(private _authService: AuthService) {}

  ngOnInit(): void {
    this._authService.onInitAuth();  // تهيئة حالة المصادقة عند بدء التطبيق
  }
}
```

---

### 13. عرض قائمة المنتجات (Products Component)

ملف الـ TS:
```text
src/app/frontend/products/products.ts
```
```typescript
export class Products implements OnInit, OnDestroy {
  constructor(private _productService: ProductService, private _cdr: ChangeDetectorRef) {}
  productsList!: IProduct[];
  private subscribtions: Subscription = new Subscription();

  ngOnInit(): void {
    const productsSub = this._productService.getAllProducts().subscribe({
      next: res => {
        this.productsList = res.data;
        this._cdr.detectChanges();
      },
      error: err => console.log(err)
    });
    this.subscribtions.add(productsSub);
  }

  ngOnDestroy(): void {
    this.subscribtions.unsubscribe();  // منع الـ Memory Leaks
  }
}
```

ملف القالب HTML:
```html
<h1>Our Products</h1>
@for(product of productsList; track product){
    <app-product [myProduct]="product"></app-product>
}
```

---

### 14. تفاصيل المنتج (Product Details — عبر Resolver)

ملف الـ TS:
```text
src/app/frontend/product-details/product-details.ts
```
```typescript
export class ProductDetails implements OnInit {
  myProduct!: IProduct;
  relatedProducts!: IProduct[];
  staticURL = env.staticURL;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _productService: ProductService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // البيانات جاهزة مسبقاً من الـ Resolver
    this.myProduct = this._activatedRoute.snapshot.data['product'].data;
    this._cdr.detectChanges();
  }
}
```

ملف القالب HTML:
```html
@if(myProduct){
  <h1>{{myProduct.name}}</h1>
  <img [src]="staticURL + '/' + myProduct.imgURL" alt="">
  <p>{{myProduct.desc}}</p>
  <h3>Price: {{myProduct.price}}</h3>

  <h2>Related Products</h2>
  @for(product of relatedProducts; track product){
    <app-product [myProduct]="product"></app-product>
  }
}
```

---

### 15. صفحة تسجيل الدخول (Login Component)

ملف الـ TS:
```text
src/app/frontend/login/login.ts
```
```typescript
export class Login {
  constructor(private _authService: AuthService) {}

  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });

  login() {
    this._authService.login(this.loginForm.value as IAuthLogin).subscribe({
      next: (res) => console.log(res.JWT),
      error: (err) => console.log(err)
    });
  }
}
```

---

### 16. صفحة إنشاء حساب (Signup — مع CanDeactivate)

ملف الـ TS:
```text
src/app/frontend/signup/signup.ts
```
```typescript
export class Signup implements ICanComponentDeactivate {
  canDeactivate(): boolean {
    if (this.myForm.dirty) {
      return confirm('Are you sure you want to leave without signup?');
    }
    return true;
  }

  myForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl('')
  });

  onSubmit() {
    this.myForm.markAsPristine();
  }
}
```

---

### 17. Angular Signals

ملف:
```text
src/app/frontend/signals/signals.ts
```
```typescript
export class Signals {
  constructor() {
    effect(() => {
      console.log(this.count());  // يتتبع التغييرات تلقائياً
    });
  }

  count = signal(0);

  change() {
    this.count.update(v => v + 5);
  }
}
```

---

### 18. كارت المنتج (Product Card Component)

ملف:
```text
src/app/frontend/products/product/product.ts
```
```typescript
export class Product {
  @Input() myProduct!: IProduct;
  staticURL = env.staticURL;
}
```

```html
<h3>{{myProduct.name}}</h3>
<img [src]="staticURL + myProduct.imgURL" alt="">
<br>
<a [routerLink]="'/products/' + myProduct.slug">More Details</a>
```

---

### 19. Parent-Child Communication — `@ViewChildren` + `QueryList`

ملف:
```text
src/app/frontend/parent/parent.ts
```
```typescript
export class Parent implements OnInit, AfterViewInit {
  @ViewChildren(Child) myChildren!: QueryList<Child>;

  names = ['mona', 'ali', 'sara', 'ahmed'];

  change() {
    this.myChildren.forEach((child, i) => {
      child.myName = i.toString() + "-" + child.myName;
    });
  }

  ngOnDestroy() {
    console.log('Destroyed');
  }
}
```

---

## 📦 حزم الـ Packages المطلوبة في package.json

```json
  "dependencies": {
    "@angular/common": "^21.2.0",
    "@angular/compiler": "^21.2.0",
    "@angular/core": "^21.2.0",
    "@angular/forms": "^21.2.0",
    "@angular/platform-browser": "^21.2.0",
    "@angular/router": "^21.2.0",
    "bootstrap": "^5.3.8",
    "jwt-decode": "latest",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular/build": "^21.2.16",
    "@angular/cli": "^21.2.16",
    "@angular/compiler-cli": "^21.2.0",
    "typescript": "~5.9.2"
  }
```

---

## 📊 تحليل مدى التطابق مع متطلبات المتجر الإلكتروني

| المجال | الحالة | التفاصيل |
|--------|--------|----------|
| Standalone Components | ✅ مكتمل | كل المكونات بدون NgModule |
| Routing + Nested Routes | ✅ مكتمل | Frontend و Dashboard مع Children |
| Route Guards (4 أنواع) | ✅ مكتمل | canActivate, canMatch, canDeactivate |
| Interceptors (2) | ✅ مكتمل | Auth Token + Error Handler |
| Resolver | ✅ مكتمل | Product Resolver مع Error Handling |
| JWT Auth (كامل) | ✅ مكتمل | Login + Decode + Expiry Check + Logout |
| Product Display | ✅ مكتمل | عرض القائمة + التفاصيل + المنتجات المشابهة |
| Reactive Forms | ✅ مكتمل | Login + Signup |
| Angular Signals | ✅ مكتمل | signal() + effect() + update() |
| RxJS Operators | ✅ مكتمل | tap, catchError, BehaviorSubject |
| Pipes (Built-in + Custom) | ✅ مكتمل | 10 Built-in + 1 Custom |
| Lazy Loading | ✅ مكتمل | loadComponent للـ Account |
| Lifecycle Hooks | ✅ مكتمل | OnInit, OnDestroy, AfterViewInit |
| @ViewChildren + QueryList | ✅ مكتمل | Parent-Child Communication |
| Subscription Management | ✅ مكتمل | Subscription + ngOnDestroy |
| صفحة السلة (Cart) | 🔴 غائب | لا يوجد مكون ولا خدمة |
| صفحة الطلبات (Orders) | 🔴 غائب | لا يوجد مكون ولا خدمة |
| إدارة المنتجات (Dashboard) | 🔴 غائب | لا يوجد مكون إضافة/تعديل/حذف منتج |
| إدارة الأقسام (Categories) | 🔴 غائب | لا يوجد مكون ولا خدمة |
| CMS / الصفحات الثابتة | 🔴 غائب | لا يوجد مكون ولا خدمة |
| التقييمات / Testimonials | 🔴 غائب | لا يوجد مكون ولا خدمة |
| Register (ربط بالباك إند) | 🟡 جزئي | الفورم موجود لكن مش مربوط بالـ API |

---

## 🎯 نسبة الاكتمال التقريبية

```
Authentication (JWT):      95%  █████████░
Routing + Guards:          95%  █████████░
Interceptors:              95%  █████████░
Product Display:           90%  █████████░
Forms (Login/Signup):      70%  ███████░░░
Angular Concepts (تعليمي): 100% ██████████
Dashboard (Admin CRUD):    15%  █░░░░░░░░░
Cart Page:                  0%  ░░░░░░░░░░
Orders Page:                0%  ░░░░░░░░░░
Categories Management:      0%  ░░░░░░░░░░
Reviews / Testimonials:     0%  ░░░░░░░░░░
CMS Pages:                  0%  ░░░░░░░░░░
─────────────────────────────────────────
الإجمالي التقريبي:        ~45%  ████░░░░░░
```

---

## 🗺️ خطة المتابعة والتنفيذ للمرحلة القادمة

### ✅ المرحلة 1: إعداد البنية الأساسية (مكتمل)
- [x] إنشاء صفحات العميل (Home, Login, Signup, Products, Product Details, Account)
- [x] إنشاء صفحات الـ Dashboard (Admin Home, Users List, Add User)
- [x] ربط Nested Routing + RouterOutlet
- [x] تطبيق كل أنواع Route Guards
- [x] إنشاء Auth + Error Interceptors
- [x] بناء Product Resolver

### ✅ المرحلة 2: الاتصال بالباك إند (مكتمل)
- [x] واجهات البيانات (Product, Auth, User)
- [x] خدمات HTTP (ProductService, AuthService, UserService)
- [x] تسجيل الدخول + حفظ التوكن + التوجيه حسب الدور
- [x] عرض المنتجات والتفاصيل والمنتجات المشابهة

### 🔲 المرحلة 3: ربط Signup بالـ API + صفحة السلة ← الخطوة القادمة
- [ ] ربط صفحة الـ Signup بالباك إند (POST /api/v1/auth/register)
- [ ] إنشاء Cart Service + Cart Component
- [ ] عرض السلة + تعديل الكمية + حذف منتج

### 🔲 المرحلة 4: الطلبات والدفع
- [ ] إنشاء Order Service + Checkout Component
- [ ] صفحة عرض طلباتي (My Orders)

### 🔲 المرحلة 5: لوحة تحكم الأدمن
- [ ] إضافة/تعديل/حذف منتجات
- [ ] إدارة الأقسام والتصنيفات الفرعية
- [ ] إدارة الطلبات (تحديث الحالة)
- [ ] إدارة التقييمات (قبول/رفض)
- [ ] إدارة الصفحات الثابتة (CMS)
