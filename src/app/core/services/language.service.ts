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
      'home.view_all': 'View All',
      'admin.edit_product': 'Edit Product',
      'admin.add_new_product_title': 'Add New Product',
      'admin.back_to_products': 'Back to Products',
      'admin.category_label': 'Category',
      'admin.subcategory_label': 'Subcategory',
      'admin.main_category_label': 'Main Category',
      'admin.add_category_btn': 'Add Category',
      'admin.add_subcategory_btn': 'Add Subcategory',
      'admin.select_main_category': 'Select main category...',
      'admin.select_subcategory': 'Select subcategory...',
      'admin.product_name': 'Product Name',
      'admin.product_name_placeholder': 'Product Name',
      'admin.product_slug': 'Slug',
      'admin.product_description': 'Description',
      'admin.product_image': 'Product Image',
      'admin.product_image_hint': 'Leave empty to keep existing image, or choose a new file to replace it',
      'admin.stock_quantity': 'Stock Qty',
      'admin.discount_percent': 'Discount (%)',
      'admin.price_egp': 'Price (EGP)',
      'admin.active_visible_catalog': 'Active / Visible in Catalog',
      'admin.new_arrivals_home': 'New Arrivals (Home Page)',
      'admin.most_popular_home': 'Most Popular (Home Page)',
      'admin.save_changes': 'Save Changes',
      'admin.saving_changes': 'Saving Changes...',
      'admin.publish_product': 'Publish Product',
      'admin.publishing': 'Publishing...',
      'admin.soft_delete_product': 'Soft Delete Product',
      'admin.cancel': 'Cancel',
      'admin.choose_file': 'Choose File',
      'admin.no_file_chosen': 'No file chosen',
      'admin.disabled_badge': 'Disabled',
      'admin.active_badge': 'Active',
      'admin.modal_add_category_title': 'Add New Category',
      'admin.modal_add_category_desc': 'Categories help customers find products faster',
      'admin.modal_category_name': 'Category Name',
      'admin.modal_category_name_placeholder': 'e.g. Leather Bags, Accessories...',
      'admin.modal_first_subcat_optional': 'First Subcategory Name (Optional)',
      'admin.modal_first_subcat_placeholder': 'e.g. Wallets, Belts...',
      'admin.modal_category_image_optional': 'Category Image (Optional)',
      'admin.modal_save_select_category': 'Save & Select Category',
      'admin.modal_adding': 'Adding...',
      'admin.modal_add_subcategory_title': 'Add New Subcategory',
      'admin.modal_belongs_under': 'Belongs Under Main Category',
      'admin.modal_select_parent_category': 'Select parent category...',
      'admin.modal_subcategory_name': 'Subcategory Name',
      'admin.modal_subcategory_name_placeholder': 'e.g. Smart Watches, Leather Boots...',
      'admin.modal_save_select_subcategory': 'Save & Select Subcategory',
      'admin.modal_creating': 'Creating...',
      'cart.total': 'Total Amount',
      'cart.final_total': 'Total Amount',
      'cart.subtotal': 'Subtotal Amount',
      'cart.shipping': 'Shipping Fee',
      'cart.apply_coupon': 'Apply',
      'cart.remove_coupon': 'Remove',
      'cart.coupon_applied': 'Coupon applied successfully',
      'admin.discount': 'Coupon Discount',
      'admin.coupon_discount': 'Coupon Discount'
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
      'home.view_all': 'عرض الكل',
      'admin.edit_product': 'تعديل المنتج',
      'admin.add_new_product_title': 'إضافة منتج جديد',
      'admin.back_to_products': 'العودة للمنتجات',
      'admin.category_label': 'التصنيف',
      'admin.subcategory_label': 'التصنيف الفرعي',
      'admin.main_category_label': 'التصنيف الرئيسي',
      'admin.add_category_btn': 'إضافة تصنيف',
      'admin.add_subcategory_btn': 'إضافة تصنيف فرعي',
      'admin.select_main_category': 'اختر التصنيف الرئيسي...',
      'admin.select_subcategory': 'اختر التصنيف الفرعي...',
      'admin.product_name': 'اسم المنتج',
      'admin.product_name_placeholder': 'اسم المنتج',
      'admin.product_slug': 'الرابط الدائم (Slug)',
      'admin.product_description': 'وصف المنتج',
      'admin.product_image': 'صورة المنتج',
      'admin.product_image_hint': 'اتركه فارغاً للاحتفاظ بالصورة الحالية، أو اختر ملفاً جديداً لاستبدالها',
      'admin.stock_quantity': 'كمية المخزون',
      'admin.discount_percent': 'نسبة الخصم (%)',
      'admin.price_egp': 'السعر (جنيه)',
      'admin.active_visible_catalog': 'نشط / ظاهر في المتجر',
      'admin.new_arrivals_home': 'وصل حديثاً (الصفحة الرئيسية)',
      'admin.most_popular_home': 'الأكثر شعبية (الصفحة الرئيسية)',
      'admin.save_changes': 'حفظ التعديلات',
      'admin.saving_changes': 'جاري الحفظ...',
      'admin.publish_product': 'نشر المنتج',
      'admin.publishing': 'جاري النشر...',
      'admin.soft_delete_product': 'حذف المنتج',
      'admin.cancel': 'إلغاء',
      'admin.choose_file': 'اختيار ملف',
      'admin.no_file_chosen': 'لم يتم اختيار ملف',
      'admin.disabled_badge': 'معطل',
      'admin.active_badge': 'نشط',
      'admin.modal_add_category_title': 'إضافة تصنيف جديد',
      'admin.modal_add_category_desc': 'تساعد التصنيفات العملاء على العثور على المنتجات بشكل أسرع',
      'admin.modal_category_name': 'اسم التصنيف',
      'admin.modal_category_name_placeholder': 'مثال: حقائب جلدية، إكسسوارات...',
      'admin.modal_first_subcat_optional': 'اسم أول تصنيف فرعي (اختياري)',
      'admin.modal_first_subcat_placeholder': 'مثال: محافظ، أحزمة...',
      'admin.modal_category_image_optional': 'صورة التصنيف (اختياري)',
      'admin.modal_save_select_category': 'حفظ واختيار التصنيف',
      'admin.modal_adding': 'جاري الإضافة...',
      'admin.modal_add_subcategory_title': 'إضافة تصنيف فرعي جديد',
      'admin.modal_belongs_under': 'تابع للتصنيف الرئيسي',
      'admin.modal_select_parent_category': 'اختر التصنيف الرئيسي...',
      'admin.modal_subcategory_name': 'اسم التصنيف الفرعي',
      'admin.modal_subcategory_name_placeholder': 'مثال: ساعات ذكية، أحذية جلدية...',
      'admin.modal_save_select_subcategory': 'حفظ واختيار التصنيف الفرعي',
      'admin.modal_creating': 'جاري الإنشاء...',
      'cart.total': 'المبلغ الإجمالي',
      'cart.final_total': 'المبلغ الإجمالي',
      'cart.subtotal': 'إجمالي المنتجات',
      'cart.shipping': 'رسوم الشحن',
      'cart.apply_coupon': 'تطبيق',
      'cart.remove_coupon': 'إلغاء',
      'cart.coupon_applied': 'تم تطبيق الكوبون بنجاح',
      'admin.discount': 'خصم الكوبون',
      'admin.coupon_discount': 'خصم الكوبون'
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
