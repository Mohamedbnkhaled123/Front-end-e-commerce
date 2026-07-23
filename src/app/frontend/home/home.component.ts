import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ReviewService, IReview } from '../../core/services/review.service';
import { CartService } from '../../core/services/cart.service';
import { IProduct } from '../../core/models/product.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class Home implements OnInit, OnDestroy {
  newArrivals: IProduct[] = [];
  mostPopular: IProduct[] = [];
  testimonials: IReview[] = [];
  staticURL = env.staticURL;

  private subscriptions = new Subscription();

  constructor(
    private _productService: ProductService,
    private _reviewService: ReviewService,
    private _cartService: CartService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const prodSub = this._productService.getAllProducts().subscribe({
      next: (res: any) => {
        const all: IProduct[] = res.data || [];
        const activeProducts = all.filter(p => p.isActive !== false && p.isDeleted !== true);

        this.newArrivals = activeProducts.filter(p => p.newArrived === true);
        if (this.newArrivals.length === 0) {
          this.newArrivals = activeProducts.slice(0, 4);
        }

        this.mostPopular = activeProducts.filter(p => p.mostPopular === true);
        if (this.mostPopular.length === 0) {
          this.mostPopular = activeProducts.slice(4, 8).length ? activeProducts.slice(4, 8) : activeProducts.slice(0, 4);
        }
        this._cdr.detectChanges();
      }
    });

    const reviewSub = this._reviewService.getApprovedReviews().subscribe({
      next: (res: any) => {
        this.testimonials = res.data || [];
        this._cdr.detectChanges();
      },
      error: () => {
        this.testimonials = [];
        this._cdr.detectChanges();
      }
    });

    this.subscriptions.add(prodSub);
    this.subscriptions.add(reviewSub);
  }

  addToCart(product: IProduct) {
    if (!product) return;
    this._cartService.addToCart(product, 1).subscribe();
  }

  getStars(rating: number): number[] {
    return Array(rating || 5).fill(0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
