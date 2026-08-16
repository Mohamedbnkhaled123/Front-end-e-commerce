import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { IProduct } from '../../core/models/product.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';

import { ProductCacheService } from '../../core/services/product-cache.service';
import { FlyToCartService } from '../../core/services/fly-to-cart.service';

import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { CmsService } from '../../core/services/cms.service';
import { HomePageData, DEFAULT_HOME, parseCmsContent } from '../../core/models/cms.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit, OnDestroy {
  clickedProductId = signal<string | null>(null);
  newArrivals: IProduct[] = [];
  mostPopular: IProduct[] = [];
  staticURL = env.staticURL;

  cmsData: HomePageData = DEFAULT_HOME;
  isCmsLoading: boolean = false;
  isProductsLoading: boolean = false;
  heroImageSrcset: string = `
    https://res.cloudinary.com/lntp2qny/image/upload/f_auto,q_auto,w_200,c_limit/v1786395122/rbeljlxnwbezppug3ae3.png 200w,
    https://res.cloudinary.com/lntp2qny/image/upload/f_auto,q_auto,w_350,c_limit/v1786395122/rbeljlxnwbezppug3ae3.png 350w,
    https://res.cloudinary.com/lntp2qny/image/upload/f_auto,q_auto,w_500,c_limit/v1786395122/rbeljlxnwbezppug3ae3.png 500w,
    https://res.cloudinary.com/lntp2qny/image/upload/f_auto,q_auto,w_700,c_limit/v1786395122/rbeljlxnwbezppug3ae3.png 700w
  `.trim();

  currentLang: any;

  private subscriptions = new Subscription();

  constructor(
    private _productCacheService: ProductCacheService,
    private _cartService: CartService,
    private _flyToCartService: FlyToCartService,
    private _cdr: ChangeDetectorRef,
    private _route: ActivatedRoute,
    private _languageService: LanguageService,
    private _cmsService: CmsService
  ) {
    this.currentLang = this._languageService.currentLang;
  }

  get localized() {
    const lang = this.currentLang();
    return (val: any) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      return val[lang] || val['en'] || '';
    };
  }

  ngOnInit(): void {
    const preFetchedProducts = this._route.snapshot.data['products'] as IProduct[];
    
    if (preFetchedProducts && preFetchedProducts.length > 0) {
      this.handleProductsData(preFetchedProducts);
    } else {
      this.isProductsLoading = true;
      const prodSub = this._productCacheService.getProducts().subscribe({
        next: (activeProducts: IProduct[]) => {
          this.handleProductsData(activeProducts);
          this.isProductsLoading = false;
          this._cdr.markForCheck();
        },
        error: () => {
          this.isProductsLoading = false;
          this._cdr.markForCheck();
        }
      });
      this.subscriptions.add(prodSub);
    }

    // Fetch CMS Data (background update with zero layout delay)
    const cmsSub = this._cmsService.getPage('Home').subscribe({
      next: (res) => {
        const raw = res.data?.content ?? '';
        this.cmsData = parseCmsContent<HomePageData>(raw, DEFAULT_HOME);
        
        // Fix insecure localhost URL returned from DB in production
        if (this.cmsData.heroImage && this.cmsData.heroImage.includes('http://localhost:3000/uploads/')) {
          this.cmsData.heroImage = this.cmsData.heroImage.replace('http://localhost:3000/uploads/', this.staticURL);
        }

        // Apply Cloudinary optimizations if it's a Cloudinary URL
        if (this.cmsData.heroImage && this.cmsData.heroImage.includes('res.cloudinary.com')) {
          const baseUrl = this.cmsData.heroImage.includes('/upload/f_auto') 
            ? this.cmsData.heroImage.replace(/\/upload\/[^/]+\//, '/upload/') 
            : this.cmsData.heroImage;
          this.cmsData.heroImage = baseUrl.replace('/upload/', '/upload/f_auto,q_auto,w_400,c_limit/');
          this.heroImageSrcset = `
            ${baseUrl.replace('/upload/', '/upload/f_auto,q_auto,w_200,c_limit/')} 200w,
            ${baseUrl.replace('/upload/', '/upload/f_auto,q_auto,w_350,c_limit/')} 350w,
            ${baseUrl.replace('/upload/', '/upload/f_auto,q_auto,w_500,c_limit/')} 500w,
            ${baseUrl.replace('/upload/', '/upload/f_auto,q_auto,w_700,c_limit/')} 700w
          `.trim();
        }

        this._cdr.markForCheck();
      },
      error: () => {
        this._cdr.markForCheck();
      }
    });
    this.subscriptions.add(cmsSub);
  }

  handleProductsData(activeProducts: IProduct[]): void {
    this.newArrivals = activeProducts.filter(p => p.newArrived === true);
    if (this.newArrivals.length === 0) {
      this.newArrivals = activeProducts.slice(0, 4);
    }
    this.newArrivals.forEach(p => p.fullImgUrl = p.imgURL ? this.getImageUrl(p.imgURL) : '');

    this.mostPopular = activeProducts.filter(p => p.mostPopular === true);
    if (this.mostPopular.length === 0) {
      this.mostPopular = activeProducts.slice(4, 8).length ? activeProducts.slice(4, 8) : activeProducts.slice(0, 4);
    }
    this.mostPopular.forEach(p => p.fullImgUrl = p.imgURL ? this.getImageUrl(p.imgURL) : '');

    this._cdr.markForCheck();
  }

  addToCart(product: IProduct, event?: Event): void {
    if (!product || product.stock === 0) return;
    if (event) {
      event.stopPropagation();
      const cardEl = (event.target as HTMLElement).closest('.group') || (event.target as HTMLElement);
      const imgElement = cardEl.querySelector('img') as HTMLImageElement;
      const cartIconElement = document.querySelector('[data-cart-icon]') as HTMLElement || document.getElementById('cartIcon');
      
      if (imgElement && cartIconElement) {
        this._flyToCartService.fly(imgElement, cartIconElement).then(() => {
          cartIconElement.classList.add('animate-cart-pulse');
          setTimeout(() => cartIconElement.classList.remove('animate-cart-pulse'), 300);
        });
      } else {
        this._flyToCartService.fly(cardEl, event);
      }
    }
    this._cartService.addToCart(product, 1).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : this.staticURL + url;
  }
}
