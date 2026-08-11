import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IProduct } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ReviewService, IReview } from '../../core/services/review.service';
import { IProductReviewSummary } from '../../core/models/review.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

import { FlyToCartService } from '../../core/services/fly-to-cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, LocalizeFieldPipe, TranslatePipe],
  templateUrl: './product-details.component.html'
})
export class ProductDetails implements OnInit, OnDestroy {
  clickedRelId = signal<string | null>(null);
  product: IProduct | null = null;
  relatedProducts: IProduct[] = [];
  staticURL = env.staticURL;
  isAddedToCart = false;
  addedMessage = '';
  activeImageURL: string | null = null;
  isImageFading = false;
  selectedColor: string = 'Black';

  // Product Reviews State
  reviews: IReview[] = [];
  reviewSummary: IProductReviewSummary = { averageRating: 0, totalReviews: 0, starCounts: {} };
  isLoadingReviews = false;

  availableColorSwatches = [
    { name: 'Black', hex: '#0f172a' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Amber', hex: '#d97706' },
    { name: 'Navy', hex: '#1e3a8a' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private _route: ActivatedRoute,
    private _productService: ProductService,
    private _cartService: CartService,
    private _reviewService: ReviewService,
    private _flyToCartService: FlyToCartService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const routeDataSub = this._route.data.subscribe({
      next: (data) => {
        const res = data['productData'];
        if (res && res.data) {
          this.product = res.data;
          this.activeImageURL = this.product?.imgURL || null;
          if (this.product && this.product._id) {
            this.loadProductReviews(this.product._id);
          }
          if (this.product && this.product.slug) {
            this.loadRelatedProducts(this.product.slug);
          }
        } else {
          this.product = null;
        }
      }
    });

    this.subscriptions.add(routeDataSub);
  }

  loadProductReviews(productId: string): void {
    if (!productId) return;
    this.isLoadingReviews = true;
    this._cdr.detectChanges();

    const sub = this._reviewService.getProductReviews(productId).subscribe({
      next: (res) => {
        this.reviews = res.data || [];
        this.reviewSummary = res.summary || { averageRating: 0, totalReviews: 0, starCounts: {} };
        this.isLoadingReviews = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.isLoadingReviews = false;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  getStarArray(rating: number): number[] {
    return Array(Math.min(5, Math.max(1, Math.round(rating || 5)))).fill(0);
  }

  getPercentage(star: number): number {
    if (!this.reviewSummary || this.reviewSummary.totalReviews === 0) return 0;
    const count = this.reviewSummary.starCounts?.[star] || 0;
    return Math.round((count / this.reviewSummary.totalReviews) * 100);
  }

  selectColor(colorName: string): void {
    if (!this.product) return;
    this.selectedColor = colorName;

    const colorImages = (this.product as any).colors || (this.product as any).colorImages;
    if (!colorImages || !colorImages[colorName]) {
      return;
    }

    const newImg = colorImages[colorName];
    if (this.activeImageURL === newImg) return;

    this.isImageFading = true;
    setTimeout(() => {
      this.activeImageURL = newImg;
      this.isImageFading = false;
    }, 150);
  }

  loadRelatedProducts(slug: string) {
    if (!slug) return;
    const sub = this._productService.getRelatedProducts(slug).subscribe({
      next: (res) => {
        this.relatedProducts = res.data || [];
        this._cdr.detectChanges();
      },
      error: () => {
        this.relatedProducts = [];
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  addToCart(event?: Event) {
    if (!this.product || this.product.stock === 0) return;

    if (event) {
      const imgEl = document.querySelector('.aspect-square img') || (event.target as HTMLElement);
      this._flyToCartService.fly(imgEl, event);
    }

    this._cartService.addToCart(this.product, 1).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.showSuccessFeedback();
        }
      }
    });
  }

  addRelatedToCart(relProduct: IProduct, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!relProduct || relProduct.stock === 0) return;

    if (event) {
      const cardEl = (event.target as HTMLElement).closest('.border') || (event.target as HTMLElement);
      this._flyToCartService.fly(cardEl, event);
    }

    this._cartService.addToCart(relProduct, 1).subscribe();
  }

  private showSuccessFeedback() {
    this.isAddedToCart = true;
    this.addedMessage = 'Product added to cart successfully! ';
    setTimeout(() => {
      this.isAddedToCart = false;
    }, 3000);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

