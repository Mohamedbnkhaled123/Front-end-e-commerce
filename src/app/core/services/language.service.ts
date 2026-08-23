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
      'admin.coupon_discount': 'Coupon Discount',
      'admin.permanent_delete': 'Delete Permanently',
      'action.search': 'Search',
      'navbar.search': 'Search',
      'catalog.advanced_filters': 'Advanced Filters',
      'catalog.subcategory': 'Subcategory',
      'catalog.any_subcategory': 'Any Subcategory',
      'catalog.price_range': 'Price Range',
      'catalog.min': 'Min',
      'catalog.max': 'Max',
      'catalog.calculating': 'Calculating...',
      'catalog.found_prefix': 'Found',
      'catalog.found_suffix': 'products matching these criteria',
      'admin.accounts': 'Admin accounts',
      'admin.analytics_title': 'Analytics',
      'admin.analytics_subtitle': 'Real-time store performance & business intelligence',
      'admin.last_sync': 'Last updated',
      'admin.range_today': 'Today',
      'admin.range_week': '7 Days',
      'admin.range_month': '30 Days',
      'admin.range_year': '1 Year',
      'admin.range_custom': 'Custom',
      'admin.refresh_data': 'Refresh Data',
      'admin.export_csv': 'Export CSV',
      'admin.csv': 'CSV',
      'admin.print_pdf': 'Print PDF',
      'admin.pdf_report': 'PDF Report',
      'admin.date_from': 'From',
      'admin.date_to': 'To',
      'admin.financial_overview': 'Financial Overview',
      'admin.product_performance': 'Product Performance',
      'admin.audit_log_tab': 'Audit Log',
      'admin.customer_sentiment': 'Customer Sentiment',
      'admin.gross_sales': 'Gross Sales',
      'admin.before_discounts': 'Before discounts',
      'admin.orders_count': 'orders',
      'admin.total_discounts': 'Discounts Applied',
      'admin.product_savings': 'Savings & Vouchers',
      'admin.promotional': 'Promotional',
      'admin.net_revenue': 'Net Revenue',
      'admin.gross_revenue': 'Gross Revenue',
      'admin.net_profit_base': 'Net Revenue',
      'admin.gross_minus_disc': 'Gross minus discounts',
      'admin.revenue_trend': 'Revenue Trend',
      'admin.top_sellers': 'Top Selling Products',
      'admin.units_sold': 'Units Sold',
      'admin.category_share': 'Category Share',
      'admin.approved': 'Approved',
      'admin.pending': 'Pending',
      'admin.cancelled': 'Cancelled',
      'admin.returned': 'Returned',
      'admin.audit_log': 'Order Audit Log',
      'admin.all_status': 'All Statuses',
      'admin.order_id': 'Order ID',
      'admin.customer': 'Customer',
      'admin.date': 'Date',
      'admin.total': 'Total',
      'admin.status': 'Status',
      'admin.audit_empty_title': 'No Transaction Records Found',
      'admin.audit_empty_desc': 'There are no transactions recorded for the selected time window.',
      'admin.view_all_logs': 'View All Records',
      'admin.rating': 'Store Rating',
      'admin.total_reviews': 'verified reviews',
      'admin.sentiment_empty_title': 'No Customer Reviews Yet',
      'admin.sentiment_empty_desc': 'Customer reviews and star breakdown will appear here once submitted.',
      'admin.expand_date_range': 'Expand Date Range',
      'admin.user_mgmt_title': 'Users & Admin Governance',
      'admin.user_mgmt_subtitle': 'Manage registered users and system administrators',
      'admin.add_new_admin_btn': 'Add New Admin',
      'admin.search_user_placeholder': 'Search by name or email...',
      'admin.registered_accounts': 'Registered Accounts'
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
      'cart.total': 'إجمالي الطلب',
      'cart.final_total': 'المبلغ الإجمالي',
      'cart.subtotal': 'المجموع الفرعي',
      'cart.shipping': 'تكلفة الشحن',
      'cart.apply_coupon': 'تطبيق',
      'cart.remove_coupon': 'إزالة',
      'cart.coupon_applied': 'تم تطبيق الكوبون بنجاح',
      'admin.discount': 'خصم الكوبون',
      'admin.coupon_discount': 'خصم الكوبون',
      'admin.permanent_delete': 'حذف نهائي',
      'action.search': 'بحث',
      'navbar.search': 'بحث',
      'catalog.advanced_filters': 'فلاتر متقدمة',
      'catalog.subcategory': 'التصنيف الفرعي',
      'catalog.any_subcategory': 'أي تصنيف فرعي',
      'catalog.price_range': 'نطاق السعر',
      'catalog.min': 'أدنى',
      'catalog.max': 'أقصى',
      'catalog.calculating': 'جاري الحساب...',
      'catalog.found_prefix': 'تم العثور على',
      'catalog.found_suffix': 'منتج مطابق لهذه المعايير',
      'admin.accounts': 'حسابات مسجلة',
      'admin.analytics_title': 'التحليلات',
      'admin.analytics_subtitle': 'مؤشرات الأداء اللحظية والتقارير المالية',
      'admin.last_sync': 'آخر تحديث',
      'admin.range_today': 'اليوم',
      'admin.range_week': '7 أيام',
      'admin.range_month': '30 يوم',
      'admin.range_year': 'سنة',
      'admin.range_custom': 'مخصص',
      'admin.refresh_data': 'تحديث البيانات',
      'admin.export_csv': 'تصدير ملف CSV',
      'admin.csv': 'CSV',
      'admin.print_pdf': 'طباعة تقرير PDF',
      'admin.pdf_report': 'تقرير PDF',
      'admin.date_from': 'من',
      'admin.date_to': 'إلى',
      'admin.financial_overview': 'النظرة المالية',
      'admin.product_performance': 'أداء المنتجات',
      'admin.audit_log_tab': 'سجل العمليات',
      'admin.customer_sentiment': 'آراء العملاء',
      'admin.gross_sales': 'إجمالي المبيعات',
      'admin.before_discounts': 'قبل الخصومات',
      'admin.orders_count': 'طلبات',
      'admin.total_discounts': 'إجمالي الخصومات',
      'admin.product_savings': 'وفر العروض والكوبونات',
      'admin.promotional': 'عروض ترويجية',
      'admin.net_revenue': 'صافي الإيرادات',
      'admin.gross_revenue': 'الإيرادات الإجمالية',
      'admin.net_profit_base': 'صافي الإيرادات',
      'admin.gross_minus_disc': 'المبيعات بعد الخصم',
      'admin.revenue_trend': 'اتجاه الإيرادات',
      'admin.top_sellers': 'المنتجات الأكثر مبيعاً',
      'admin.units_sold': 'القطع المباعة',
      'admin.category_share': 'نسبة مبيعات الفئات',
      'admin.approved': 'مكتملة',
      'admin.pending': 'قيد الانتظار',
      'admin.cancelled': 'ملغاة',
      'admin.returned': 'مرتجعة',
      'admin.audit_log': 'سجل تدقيق الطلبات',
      'admin.all_status': 'جميع الحالات',
      'admin.order_id': 'رقم الطلب',
      'admin.customer': 'العميل',
      'admin.date': 'التاريخ',
      'admin.total': 'الإجمالي',
      'admin.status': 'الحالة',
      'admin.audit_empty_title': 'لا توجد عمليات مسجلة',
      'admin.audit_empty_desc': 'لا توجد أي معاملات مسجلة في النطاق الزمني المحدد.',
      'admin.view_all_logs': 'عرض كل السجلات',
      'admin.rating': 'تقييم المتجر',
      'admin.total_reviews': 'تقييم موثق',
      'admin.sentiment_empty_title': 'لا توجد تقييمات للعملاء بعد',
      'admin.sentiment_empty_desc': 'ستظهر تقييمات المشترين وآراؤهم هنا فور إرسالها.',
      'admin.expand_date_range': 'توسيع النطاق الزمني',
      'admin.user_mgmt_title': 'إدارة المستخدمين والأدمن',
      'admin.user_mgmt_subtitle': 'إدارة حسابات المشترين ومسؤولي النظام وصلاحياتهم',
      'admin.add_new_admin_btn': 'إضافة أدمن جديد',
      'admin.search_user_placeholder': 'البحث بالاسم أو البريد الإلكتروني...',
      'admin.registered_accounts': 'الحسابات المسجلة'
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
    if (!key) return '';
    const lang = this.currentLang();
    const val = this.criticalDictionary[lang]?.[key] || this.dynamicDictionary()?.[key];
    if (val) return val;

    // Fallback: If a key is missing, format it cleanly without any '.' or '_' characters
    if (typeof key === 'string' && (key.includes('.') || key.includes('_'))) {
      const parts = key.split('.');
      const cleanKey = parts[parts.length - 1] || key;
      return cleanKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return key;
  }
}
