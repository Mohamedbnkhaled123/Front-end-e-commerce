import { Injectable, signal, effect } from '@angular/core';

export type SupportedLang = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'shoPRO_lang';

  // Signals for Reactive Language State
  currentLang = signal<SupportedLang>(this.getInitialLanguage());
  isRtl = signal<boolean>(this.currentLang() === 'ar');

  private dynamicDictionary = signal<Record<string, string>>({});
  private isLoaded = signal<boolean>(false);

  // Critical above-the-fold translations to prevent layout shift on first paint
  private criticalDictionary: Record<SupportedLang, Record<string, string>> = {
    en: {
      'brand.name': 'shoPRO',
      'nav.home': 'Home',
      'nav.products': 'Products',
      'nav.about': 'About Us',
      'nav.policy': 'Store Policy',
      'nav.faq': 'FAQ',
      'nav.contact': 'Contact Support',
      'nav.cart': 'Cart',
      'nav.admin_panel': 'Dashboard',
      'nav.login': 'Login',
      'nav.signup': 'Sign Up',
      'nav.logout': 'Logout',
      'home.hero_badge': 'New Collection 2026',
      'home.hero_title': 'Engineered For Premium Performance',
      'home.hero_desc': 'Discover modern tech, accessories, and premium products built for supreme quality and effortless reliability.',
      'home.shop_collection': 'Shop Collection',
      'home.shop_now': 'Shop Now',
      'home.learn_more': 'Learn More About shoPRO',
      'home.feat1_title': 'Free Fast Shipping',
      'home.feat1_desc': 'On all orders over 500 EGP',
      'home.feat2_title': 'Premium Quality',
      'home.feat2_desc': 'Genuine brands & materials 100%',
      'home.feat3_title': 'Secure Checkout',
      'home.feat3_desc': 'Safe & encrypted payment process',
      'home.new_arrivals': 'New Arrivals',
      'home.most_popular': 'Most Popular',
      'home.view_all': 'View All'
    },
    ar: {
      'brand.name': 'شوبرو',
      'nav.home': 'الرئيسية',
      'nav.products': 'المنتجات',
      'nav.about': 'من نحن',
      'nav.policy': 'سياسة المتجر',
      'nav.faq': 'الأسئلة الشائعة',
      'nav.contact': 'تواصل معنا',
      'nav.cart': 'عربة التسوق',
      'nav.admin_panel': 'لوحة التحكم',
      'nav.login': 'تسجيل الدخول',
      'nav.signup': 'إنشاء حساب',
      'nav.logout': 'تسجيل الخروج',
      'home.hero_badge': 'تشكيلة 2026 الجديدة',
      'home.hero_title': 'مصممة خصيصاً لأعلى مستويات الأداء',
      'home.hero_desc': 'اكتشف أحدث التقنيات والاكسسوارات المصنوعة بجودة فائقة واعتمادية لا مثيل لها.',
      'home.shop_collection': 'تسوق التشكيلة الآن',
      'home.shop_now': 'تسوق الآن',
      'home.learn_more': 'تعرف أكثر على شوبرو',
      'home.feat1_title': 'شحن مجاني وسريع',
      'home.feat1_desc': 'على جميع الطلبات فوق 500 ج.م',
      'home.feat2_title': 'جودة ممتازة',
      'home.feat2_desc': 'ماركات وخامات أصلية 100%',
      'home.feat3_title': 'دفع آمن',
      'home.feat3_desc': 'عملية دفع آمنة ومشفرة',
      'home.new_arrivals': 'أحدث المنتجات',
      'home.most_popular': 'الأكثر شعبية',
      'home.view_all': 'عرض الكل'
    }
  };

  constructor() {
    // Synchronize HTML dir & lang attributes dynamically whenever language changes
    effect(() => {
      const lang = this.currentLang();
      const isArabic = lang === 'ar';
      this.isRtl.set(isArabic);

      document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      localStorage.setItem(this.STORAGE_KEY, lang);
      
      this.loadDictionary(lang);
    });
  }

  private loadDictionary(lang: SupportedLang) {
    this.isLoaded.set(false);
    fetch(`/i18n/${lang}.json?v=${new Date().getTime()}`)
      .then(res => res.json())
      .then(data => {
        this.dynamicDictionary.set(data);
        this.isLoaded.set(true);
      })
      .catch(err => {
        console.error('Failed to load translations for ' + lang, err);
      });
  }

  private getInitialLanguage(): SupportedLang {
    const saved = localStorage.getItem(this.STORAGE_KEY) as SupportedLang;
    if (saved === 'en' || saved === 'ar') {
      return saved;
    }
    return navigator.language.startsWith('ar') ? 'ar' : 'en';
  }

  toggleLanguage(): void {
    const nextLang: SupportedLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
  }

  setLanguage(lang: SupportedLang): void {
    if (lang !== 'en' && lang !== 'ar') return;
    if (this.currentLang() === lang && document.documentElement.lang === lang) return;

    const applyLanguage = () => {
      this.currentLang.set(lang);
      const isArabic = lang === 'ar';
      this.isRtl.set(isArabic);

      document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      localStorage.setItem(this.STORAGE_KEY, lang);
      this.loadDictionary(lang);

      document.documentElement.classList.add('i18n-transitioning');
      setTimeout(() => {
        document.documentElement.classList.remove('i18n-transitioning');
      }, 350);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      (document as any).startViewTransition(() => {
        applyLanguage();
      });
    } else {
      applyLanguage();
    }
  }

  translate(key: string): string {
    const lang = this.currentLang();
    return this.criticalDictionary[lang]?.[key] || this.dynamicDictionary()?.[key] || key;
  }
}
