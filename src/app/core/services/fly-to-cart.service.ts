import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class FlyToCartService {
  private cartBadgePulseSubject = new Subject<void>();
  cartBadgePulse$ = this.cartBadgePulseSubject.asObservable();

  constructor(private _authService: AuthService) {}

  triggerBadgePulse() {
    this.cartBadgePulseSubject.next();
  }

  // New Promise-based implementation requested by user
  fly(startImgElement: HTMLImageElement, targetCartElement: HTMLElement): Promise<void>;
  // Legacy implementation used by product-details
  fly(sourceElement: HTMLElement | Element | null, event?: Event): void;
  fly(arg1: any, arg2?: any): any {
    const role = this._authService.isUser();
    if (role === 'admin' || role === 'superadmin') {
      if (arg1 instanceof HTMLImageElement && arg2 instanceof HTMLElement) {
        return Promise.resolve();
      }
      return;
    }

    // Check if called with (HTMLImageElement, HTMLElement)
    if (arg1 instanceof HTMLImageElement && arg2 instanceof HTMLElement) {
      return new Promise<void>((resolve) => {
        const startImgElement = arg1;
        const targetCartElement = arg2;
        const startRect = startImgElement.getBoundingClientRect();
        const targetRect = targetCartElement.getBoundingClientRect();

        // Create clone element
        const flyingImg = startImgElement.cloneNode(true) as HTMLImageElement;
        flyingImg.style.position = 'fixed';
        flyingImg.style.left = String(startRect.left) + 'px';
        flyingImg.style.top = String(startRect.top) + 'px';
        flyingImg.style.width = String(startRect.width) + 'px';
        flyingImg.style.height = String(startRect.height) + 'px';
        flyingImg.style.opacity = '0.9';
        flyingImg.style.pointerEvents = 'none';
        flyingImg.style.zIndex = '9999';
        flyingImg.style.borderRadius = '1rem';
        flyingImg.style.objectFit = 'cover';
        flyingImg.style.transition = 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)';

        document.body.appendChild(flyingImg);

        // Trigger animation on next animation frame
        requestAnimationFrame(() => {
          flyingImg.style.left = String(targetRect.left + targetRect.width / 2 - 15) + 'px';
          flyingImg.style.top = String(targetRect.top + targetRect.height / 2 - 15) + 'px';
          flyingImg.style.width = '30px';
          flyingImg.style.height = '30px';
          flyingImg.style.opacity = '0';
          flyingImg.style.transform = 'scale(0.2) rotate(360deg)';
        });

        // Cleanup & trigger cart badge pulse
        setTimeout(() => {
          if (document.body.contains(flyingImg)) {
            flyingImg.remove();
          }
          resolve();
        }, 800);
      });
    }

    // Legacy implementation
    const sourceElement = arg1;
    const event = arg2;
    if (event) {
      event.stopPropagation();
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.triggerBadgePulse();
      return;
    }

    requestAnimationFrame(() => {
      const target = document.querySelector('[data-cart-icon]');
      if (!target || !sourceElement) {
        this.triggerBadgePulse();
        return;
      }

      const targetRect = target.getBoundingClientRect();
      const isTargetVisible =
        targetRect.top >= -50 &&
        targetRect.left >= -50 &&
        targetRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
        targetRect.right <= (window.innerWidth || document.documentElement.clientWidth) + 50 &&
        targetRect.width > 0;

      if (!isTargetVisible) {
        this.triggerBadgePulse();
        return;
      }

      const sourceRect = sourceElement.getBoundingClientRect();
      if (sourceRect.width === 0 || sourceRect.height === 0) {
        this.triggerBadgePulse();
        return;
      }

      const clone = document.createElement('div');
      clone.style.position = 'fixed';
      clone.style.zIndex = '99999';
      clone.style.left = String(sourceRect.left) + 'px';
      clone.style.top = String(sourceRect.top) + 'px';
      clone.style.width = String(sourceRect.width) + 'px';
      clone.style.height = String(sourceRect.height) + 'px';
      clone.style.borderRadius = '12px';
      clone.style.pointerEvents = 'none';
      clone.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
      clone.style.transition = 'transform 480ms cubic-bezier(0.2, 1, 0.3, 1), opacity 480ms ease-in, border-radius 480ms';
      clone.style.willChange = 'transform, opacity';

      let imgSrc = '';
      if (sourceElement.tagName === 'IMG') {
        imgSrc = (sourceElement as HTMLImageElement).src;
      } else {
        const childImg = sourceElement.querySelector('img');
        if (childImg) imgSrc = childImg.src;
      }

      if (imgSrc) {
        clone.style.backgroundImage = 'url("' + imgSrc + '")';
        clone.style.backgroundSize = 'cover';
        clone.style.backgroundPosition = 'center';
      } else {
        clone.style.backgroundColor = '#2563EB';
      }

      document.body.appendChild(clone);

      const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
      const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

      Promise.resolve().then(() => {
        clone.style.transform = 'translate3d(' + deltaX + 'px, ' + deltaY + 'px, 0) scale(0.12)';
        clone.style.opacity = '0.15';
        clone.style.borderRadius = '50%';
      });

      setTimeout(() => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
        this.triggerBadgePulse();
      }, 480);
    });
  }
}
