import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { IProduct } from '../models/product.model';
import { env } from '../../../env/env';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private languageService = inject(LanguageService);

  private readonly defaultTitle = 'shoPRO | Premium Modern E-Commerce Platform';
  private readonly defaultDescription = 'Discover modern tech, accessories, and premium products built for supreme quality and effortless reliability on shoPRO.';
  private readonly defaultImage = '/og-image.png';

  /**
   * Dynamically update document title and social share meta tags for a specific product
   */
  setProductMeta(product: IProduct | null | undefined): void {
    if (!product) {
      this.resetDefaultMeta();
      return;
    }

    const currentLang = this.languageService.currentLang();
    const name = (currentLang === 'ar' ? product.name_ar : product.name_en) || product.name || 'Product Details';
    const rawDesc = (currentLang === 'ar' ? product.desc_ar : product.desc_en) || product.desc || this.defaultDescription;
    
    // Clean & truncate description to standard SEO snippet length
    const desc = rawDesc.length > 160 ? rawDesc.substring(0, 157) + '...' : rawDesc;
    const pageTitle = `${name} | shoPRO`;

    // Resolve full image URL
    let imageUrl = product.fullImgUrl || product.imgURL || this.defaultImage;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = env.staticURL + imageUrl;
    }

    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://shopro-store.vercel.app';

    // 1. Standard Title & Meta
    this.titleService.setTitle(pageTitle);
    this.updateTag('name', 'description', desc);

    // 2. Open Graph Meta Tags (Facebook, WhatsApp, LinkedIn, Telegram)
    this.updateTag('property', 'og:type', 'product');
    this.updateTag('property', 'og:title', pageTitle);
    this.updateTag('property', 'og:description', desc);
    this.updateTag('property', 'og:image', imageUrl);
    this.updateTag('property', 'og:image:secure_url', imageUrl);
    this.updateTag('property', 'og:image:alt', name);
    this.updateTag('property', 'og:url', currentUrl);
    this.updateTag('property', 'og:site_name', 'shoPRO');

    // 3. Twitter Card Meta Tags
    this.updateTag('name', 'twitter:card', 'summary_large_image');
    this.updateTag('name', 'twitter:title', pageTitle);
    this.updateTag('name', 'twitter:description', desc);
    this.updateTag('name', 'twitter:image', imageUrl);
    this.updateTag('name', 'twitter:image:alt', name);
  }

  /**
   * Reset meta tags back to default platform identity
   */
  resetDefaultMeta(): void {
    this.titleService.setTitle(this.defaultTitle);
    this.updateTag('name', 'description', this.defaultDescription);

    this.updateTag('property', 'og:type', 'website');
    this.updateTag('property', 'og:title', this.defaultTitle);
    this.updateTag('property', 'og:description', this.defaultDescription);
    this.updateTag('property', 'og:image', this.defaultImage);
    this.updateTag('property', 'og:image:secure_url', this.defaultImage);
    this.updateTag('property', 'og:image:alt', 'shoPRO Logo');
    this.updateTag('property', 'og:url', 'https://shopro-store.vercel.app');

    this.updateTag('name', 'twitter:card', 'summary_large_image');
    this.updateTag('name', 'twitter:title', this.defaultTitle);
    this.updateTag('name', 'twitter:description', this.defaultDescription);
    this.updateTag('name', 'twitter:image', this.defaultImage);
    this.updateTag('name', 'twitter:image:alt', 'shoPRO Logo');
  }

  private updateTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
    if (this.metaService.getTag(`${attrName}="${attrValue}"`)) {
      this.metaService.updateTag({ [attrName]: attrValue, content });
    } else {
      this.metaService.addTag({ [attrName]: attrValue, content });
    }
  }
}
