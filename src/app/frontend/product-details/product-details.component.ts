import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IProduct } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.component.html'
})
export class ProductDetails implements OnInit, OnDestroy {
  product: IProduct | null = null;
  relatedProducts: IProduct[] = [];
  staticURL = env.staticURL;
  isAddedToCart = false;
  addedMessage = '';
  private subscriptions = new Subscription();

  constructor(
    private _route: ActivatedRoute,
    private _productService: ProductService,
    private _cartService: CartService
  ) {}

  ngOnInit(): void {
    const routeDataSub = this._route.data.subscribe({
      next: (data) => {
        const res = data['productData'];
        if (res && res.data) {
          this.product = res.data;
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

  // Loads related category products
  loadRelatedProducts(slug: string) {
    if (!slug) return;
    const sub = this._productService.getRelatedProducts(slug).subscribe({
      next: (res) => {
        this.relatedProducts = res.data || [];
      }
    });
    this.subscriptions.add(sub);
  }

  // Adds product to cart
  addToCart() {
    if (!this.product) return;

    this._cartService.addToCart(this.product, 1).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.showSuccessFeedback();
        }
      }
    });
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
