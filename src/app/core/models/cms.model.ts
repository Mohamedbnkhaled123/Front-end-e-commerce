// ─── CMS API Response Types ───────────────────────────────────────────────────

export interface ICmsPage {
  _id: string;
  pageName: string;
  content: string; // Stores serialized JSON
  createdAt: string;
  updatedAt: string;
}

export interface ICmsPageRes {
  status: string;
  data: ICmsPage;
}

export interface ICmsUpdateRes {
  status: string;
  message: string;
  data: ICmsPage;
}

export type CmsPageName = 'Home' | 'About' | 'Policy' | 'FAQ' | 'Contact';

// ─── Bilingual String Type ────────────────────────────────────────────────────

export interface LocalizedString {
  en: string;
  ar: string;
}

// ─── Structured Page Data Models ─────────────────────────────────────────────

/** Home Page */
export interface HomePageData {
  heroTitle: LocalizedString;
  heroSubtitle: LocalizedString;
  heroImage: string;
}

/** About Page */
export interface AboutStat {
  value: LocalizedString;
  label: LocalizedString;
}

export interface AboutFeature {
  icon: string; // SVG path 'd' attribute
  title: LocalizedString;
  description: LocalizedString;
}

export interface AboutPageData {
  heroTitle: LocalizedString;
  heroSubtitle: LocalizedString;
  storyTitle: LocalizedString;
  storyBody: LocalizedString;
  teamTitle: LocalizedString;
  teamBody: LocalizedString;
  missionTitle: LocalizedString;
  missionBody: LocalizedString;
  stats: AboutStat[];
  features: AboutFeature[];
}

/** FAQ Page */
export interface FaqItem {
  id: string;
  question: LocalizedString;
  answer: LocalizedString;
}

export interface FaqCategory {
  id: string;
  title: LocalizedString;
  items: FaqItem[];
}

export interface FaqPageData {
  heroTitle: LocalizedString;
  heroSubtitle: LocalizedString;
  categories: FaqCategory[];
}

/** Policy Page */
export interface PolicySection {
  id: string;
  title: LocalizedString;
  body: LocalizedString;
}

export interface PolicyPageData {
  heroTitle: LocalizedString;
  effectiveDate: LocalizedString;
  intro: LocalizedString;
  sections: PolicySection[];
}

/** Contact Page */
export interface ContactPageData {
  heroTitle: LocalizedString;
  heroSubtitle: LocalizedString;
  email: string;
  phone: string;
  address: LocalizedString;
  workingHours: LocalizedString;
  mapEmbedNote: LocalizedString; // A note/description about location shown below the address
}

// ─── Default Dummy Data (Fallbacks) ───────────────────────────────────────────

export const DEFAULT_HOME: HomePageData = {
  heroTitle: { en: 'Modern High-Performance E-Commerce', ar: 'متجر إلكتروني حديث بأداء عالي' },
  heroSubtitle: { en: 'Explore my services in creating a secure e-commerce store with a great user interface and seamless experience.', ar: 'استكشف خدماتي في إنشاء متجر إلكتروني آمن مع واجهة مستخدم رائعة وتجربة مستخدم عالية.' },
  heroImage: 'https://res.cloudinary.com/lntp2qny/image/upload/f_auto,q_auto,w_400,c_limit/v1786395122/rbeljlxnwbezppug3ae3.png'
};

export const DEFAULT_ABOUT: AboutPageData = {
  heroTitle: { en: 'About ShoProX', ar: 'عن شوب روكس' },
  heroSubtitle: { en: 'Your trusted destination for premium products, delivered with care and passion since 2020.', ar: 'وجهتك الموثوقة للمنتجات المتميزة، نقدمها لك بعناية وشغف منذ عام 2020.' },
  storyTitle: { en: 'Our Story', ar: 'قصتنا' },
  storyBody: { 
    en: `ShoProX was founded with a simple but powerful vision: make quality products accessible to everyone, everywhere. What started as a small passion project quickly grew into a full-fledged e-commerce platform trusted by thousands of customers across Egypt and beyond.\n\nWe believe that shopping should be delightful — from discovery to delivery. Every product in our catalog is carefully selected, and every order is handled with the utmost care to ensure you receive exactly what you expect.`, 
    ar: `تأسست شوب روكس برؤية بسيطة ولكنها قوية: جعل المنتجات عالية الجودة في متناول الجميع، في كل مكان. ما بدأ كمشروع شغف صغير نما بسرعة ليصبح منصة تجارة إلكترونية متكاملة يثق بها آلاف العملاء في جميع أنحاء مصر وخارجها.\n\nنحن نؤمن بأن التسوق يجب أن يكون ممتعاً - من الاستكشاف إلى التسليم. يتم اختيار كل منتج في الكتالوج الخاص بنا بعناية، ويتم التعامل مع كل طلب بأقصى قدر من العناية لضمان حصولك على ما تتوقعه بالضبط.`
  },
  teamTitle: { en: 'Our Team', ar: 'فريقنا' },
  teamBody: { 
    en: `We are a passionate, diverse team of designers, engineers, and customer-experience advocates united by our commitment to excellence. Our team works around the clock to bring you the best shopping experience possible.`, 
    ar: `نحن فريق شغوف ومتنوع من المصممين والمهندسين ودعاة تجربة العملاء متحدون بالتزامنا بالتميز. يعمل فريقنا على مدار الساعة لتقديم أفضل تجربة تسوق ممكنة لك.`
  },
  missionTitle: { en: 'Our Mission', ar: 'مهمتنا' },
  missionBody: { 
    en: `To empower shoppers with access to the finest products, the fairest prices, and the most seamless experience — built on a foundation of trust, transparency, and technology.`, 
    ar: `تمكين المتسوقين من الوصول إلى أفضل المنتجات، وبأعدل الأسعار، وتجربة أكثر سلاسة - مبنية على أساس من الثقة والشفافية والتكنولوجيا.`
  },
  stats: [
    { value: { en: '50K+', ar: '+50 ألف' }, label: { en: 'Happy Customers', ar: 'عميل سعيد' } },
    { value: { en: '100%', ar: '100%' }, label: { en: 'Quality Guarantee', ar: 'ضمان الجودة' } },
    { value: { en: '24/7', ar: '24/7' }, label: { en: 'Customer Support', ar: 'دعم العملاء' } },
    { value: { en: '14-Day', ar: '14 يوم' }, label: { en: 'Easy Returns', ar: 'إرجاع سهل' } }
  ],
  features: [
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: { en: 'Verified Quality', ar: 'جودة معتمدة' },
      description: { en: 'Every product passes our rigorous quality verification before reaching your door.', ar: 'كل منتج يمر بالتحقق الصارم من الجودة قبل الوصول إلى باب منزلك.' }
    },
    {
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      title: { en: 'Fast Delivery', ar: 'توصيل سريع' },
      description: { en: 'Nationwide delivery within 2–5 business days with real-time order tracking.', ar: 'توصيل لجميع أنحاء البلاد خلال 2-5 أيام عمل مع تتبع الطلب في الوقت الفعلي.' }
    },
    {
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      title: { en: 'Customer First', ar: 'العميل أولاً' },
      description: { en: 'Our support team is always one message away. Your satisfaction is our top priority.', ar: 'فريق الدعم لدينا دائماً على بعد رسالة واحدة. رضاك هو أولويتنا القصوى.' }
    }
  ]
};

export const DEFAULT_FAQ: FaqPageData = {
  heroTitle: { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
  heroSubtitle: { en: 'Everything you need to know about orders, shipping, returns, and your account.', ar: 'كل ما تحتاج لمعرفته حول الطلبات والشحن والمرتجعات وحسابك.' },
  categories: [
    {
      id: 'orders',
      title: { en: 'Orders & Payments', ar: 'الطلبات والمدفوعات' },
      items: [
        {
          id: 'faq-1',
          question: { en: 'How do I place an order?', ar: 'كيف يمكنني تقديم طلب؟' },
          answer: { en: 'Browse our catalog, add items to your cart, then proceed to checkout. You\'ll need to be logged in to complete your order. Follow the checkout steps to confirm your shipping address and payment details.', ar: 'تصفح الكتالوج الخاص بنا، وأضف العناصر إلى سلة التسوق الخاصة بك، ثم تابع إلى الخروج. ستحتاج إلى تسجيل الدخول لإكمال طلبك. اتبع خطوات الخروج لتأكيد عنوان الشحن وتفاصيل الدفع.' }
        },
        {
          id: 'faq-2',
          question: { en: 'What payment methods do you accept?', ar: 'ما هي طرق الدفع التي تقبلونها؟' },
          answer: { en: 'We currently accept cash on delivery (COD) for all orders within Egypt. Online payment options including credit/debit cards will be available soon.', ar: 'نقبل حالياً الدفع عند الاستلام لجميع الطلبات داخل مصر. ستتوفر خيارات الدفع عبر الإنترنت بما في ذلك بطاقات الائتمان/الخصم قريباً.' }
        },
        {
          id: 'faq-3',
          question: { en: 'Can I modify or cancel my order after placing it?', ar: 'هل يمكنني تعديل أو إلغاء طلبي بعد تقديمه؟' },
          answer: { en: 'You can request an order cancellation while it\'s in "Pending" or "Confirmed" status. Once it moves to "Shipped", cancellation is no longer available. Contact our support team as soon as possible for assistance.', ar: 'يمكنك طلب إلغاء الطلب بينما يكون في حالة "قيد الانتظار" أو "مؤكد". بمجرد أن ينتقل إلى "تم الشحن"، لم يعد الإلغاء متاحاً. اتصل بفريق الدعم في أقرب وقت ممكن للمساعدة.' }
        }
      ]
    },
    {
      id: 'shipping',
      title: { en: 'Shipping & Delivery', ar: 'الشحن والتوصيل' },
      items: [
        {
          id: 'faq-4',
          question: { en: 'How long does delivery take?', ar: 'كم يستغرق التوصيل؟' },
          answer: { en: 'Standard delivery takes 2–5 business days depending on your location. Cairo and Giza orders are typically delivered within 1–2 business days.', ar: 'يستغرق التوصيل العادي من 2-5 أيام عمل حسب موقعك. عادة ما يتم توصيل طلبات القاهرة والجيزة خلال 1-2 أيام عمل.' }
        },
        {
          id: 'faq-5',
          question: { en: 'How can I track my order?', ar: 'كيف يمكنني تتبع طلبي؟' },
          answer: { en: 'Log in to your account and visit "My Orders". You\'ll see the real-time status of each order including Confirmed, Shipped, Out for Delivery, and Delivered.', ar: 'قم بتسجيل الدخول إلى حسابك وقم بزيارة "طلباتي". سترى الحالة في الوقت الفعلي لكل طلب بما في ذلك مؤكد، وتم الشحن، وخرج للتوصيل، وتم التوصيل.' }
        },
        {
          id: 'faq-6',
          question: { en: 'Do you offer free shipping?', ar: 'هل تقدمون شحن مجاني؟' },
          answer: { en: 'Free shipping is available on orders above a certain amount. Check the current promotion banner on the homepage for details on our active free shipping threshold.', ar: 'يتوفر الشحن المجاني للطلبات التي تزيد عن مبلغ معين. تحقق من لافتة الترويج الحالية على الصفحة الرئيسية للحصول على تفاصيل حول الحد الأدنى للشحن المجاني النشط لدينا.' }
        }
      ]
    },
    {
      id: 'returns',
      title: { en: 'Returns & Refunds', ar: 'المرتجعات والمبالغ المستردة' },
      items: [
        {
          id: 'faq-7',
          question: { en: 'What is your return policy?', ar: 'ما هي سياسة الإرجاع الخاصة بكم؟' },
          answer: { en: 'We offer a 14-day return window from the date of delivery. Items must be in their original condition with packaging intact. Certain product categories may be exempt from returns for hygiene reasons.', ar: 'نقدم نافذة إرجاع لمدة 14 يوماً من تاريخ التسليم. يجب أن تكون العناصر في حالتها الأصلية مع التغليف السليم. قد تُعفى فئات معينة من المنتجات من المرتجعات لأسباب تتعلق بالنظافة.' }
        },
        {
          id: 'faq-8',
          question: { en: 'How do I request a refund?', ar: 'كيف أطلب استرداد الأموال؟' },
          answer: { en: 'Contact our customer support team via the Contact page with your order number and reason for the return. Once approved, refunds are typically processed within 3–7 business days.', ar: 'اتصل بفريق دعم العملاء عبر صفحة اتصل بنا مع ذكر رقم طلبك وسبب الإرجاع. بمجرد الموافقة، تتم معالجة المبالغ المستردة عادةً في غضون 3-7 أيام عمل.' }
        }
      ]
    },
    {
      id: 'account',
      title: { en: 'Account & Security', ar: 'الحساب والأمان' },
      items: [
        {
          id: 'faq-9',
          question: { en: 'How do I reset my password?', ar: 'كيف أعيد تعيين كلمة المرور الخاصة بي؟' },
          answer: { en: 'Click on "Forgot Password" on the login page. You\'ll receive a password reset email within a few minutes. If you don\'t see it, check your spam folder.', ar: 'انقر فوق "نسيت كلمة المرور" في صفحة تسجيل الدخول. ستتلقى بريداً إلكترونياً لإعادة تعيين كلمة المرور في غضون بضع دقائق. إذا لم تره، فتحقق من مجلد الرسائل غير المرغوب فيها.' }
        },
        {
          id: 'faq-10',
          question: { en: 'Is my personal data safe?', ar: 'هل بياناتي الشخصية آمنة؟' },
          answer: { en: 'Absolutely. We take data privacy seriously and never sell your information to third parties. All data is encrypted and stored securely. Please review our Privacy Policy for full details.', ar: 'بالتأكيد. نحن نأخذ خصوصية البيانات على محمل الجد ولا نبيع معلوماتك لأطراف ثالثة أبداً. يتم تشفير جميع البيانات وتخزينها بشكل آمن. يرجى مراجعة سياسة الخصوصية للحصول على التفاصيل الكاملة.' }
        }
      ]
    }
  ]
};

export const DEFAULT_POLICY: PolicyPageData = {
  heroTitle: { en: 'Privacy & Terms Policy', ar: 'سياسة الخصوصية والشروط' },
  effectiveDate: { en: 'January 1, 2026', ar: '1 يناير 2026' },
  intro: { en: 'Welcome to ShoProX. By accessing or using our platform, you agree to the following terms and conditions. We are committed to protecting your privacy and ensuring a transparent, trustworthy shopping experience.', ar: 'مرحباً بك في شوب روكس. من خلال الوصول إلى منصتنا أو استخدامها، فإنك توافق على الشروط والأحكام التالية. نحن ملتزمون بحماية خصوصيتك وضمان تجربة تسوق شفافة وجديرة بالثقة.' },
  sections: [
    {
      id: 'data-collection',
      title: { en: '1. Information We Collect', ar: '1. المعلومات التي نجمعها' },
      body: { en: 'We collect information you voluntarily provide during registration and checkout, including your name, email address, phone number, and delivery address. We also collect automatically generated data such as browser type, IP address, and browsing activity on our platform to improve your experience.', ar: 'نقوم بجمع المعلومات التي تقدمها طواعية أثناء التسجيل والخروج، بما في ذلك اسمك وعنوان بريدك الإلكتروني ورقم هاتفك وعنوان التوصيل. نقوم أيضاً بجمع البيانات التي تم إنشاؤها تلقائياً مثل نوع المتصفح وعنوان IP ونشاط التصفح على منصتنا لتحسين تجربتك.' }
    },
    {
      id: 'data-use',
      title: { en: '2. How We Use Your Information', ar: '2. كيف نستخدم معلوماتك' },
      body: { en: 'Your information is used to process and fulfill your orders, communicate order updates, provide customer support, and improve our services. We may also use anonymized, aggregated data for analytics purposes to understand shopping trends and enhance platform performance.', ar: 'يتم استخدام معلوماتك لمعالجة طلباتك وتلبيتها، وتوصيل تحديثات الطلب، وتوفير دعم العملاء، وتحسين خدماتنا. يجوز لنا أيضاً استخدام بيانات مجهولة المصدر ومجمعة لأغراض التحليلات لفهم اتجاهات التسوق وتحسين أداء المنصة.' }
    },
    {
      id: 'data-sharing',
      title: { en: '3. Sharing Your Information', ar: '3. مشاركة معلوماتك' },
      body: { en: 'We do not sell, trade, or rent your personal information to third parties. We may share your data with trusted logistics partners solely for the purpose of delivering your orders. All such partners are bound by strict confidentiality agreements.', ar: 'نحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك بياناتك مع شركاء لوجستيين موثوقين فقط لغرض توصيل طلباتك. جميع هؤلاء الشركاء ملزمون باتفاقيات سرية صارمة.' }
    },
    {
      id: 'data-security',
      title: { en: '4. Data Security', ar: '4. أمن البيانات' },
      body: { en: 'We implement industry-standard security measures including SSL encryption, secure servers, and access controls to protect your personal data from unauthorized access, disclosure, or misuse. Despite these measures, no online transmission is 100% secure, and we encourage you to use strong, unique passwords.', ar: 'ننفذ تدابير أمنية متوافقة مع معايير الصناعة بما في ذلك تشفير SSL والخوادم الآمنة وضوابط الوصول لحماية بياناتك الشخصية من الوصول غير المصرح به أو الكشف عنها أو إساءة استخدامها. على الرغم من هذه التدابير، لا يوجد نقل عبر الإنترنت آمن بنسبة 100٪، ونشجعك على استخدام كلمات مرور قوية وفريدة من نوعها.' }
    },
    {
      id: 'cookies',
      title: { en: '5. Cookies & Tracking', ar: '5. ملفات تعريف الارتباط والتتبع' },
      body: { en: 'Our platform uses cookies and similar tracking technologies to enhance functionality, remember your preferences, and analyze site traffic. You can manage cookie preferences through your browser settings. Disabling cookies may limit some features of our platform.', ar: 'تستخدم منصتنا ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتحسين الوظائف وتذكر تفضيلاتك وتحليل حركة مرور الموقع. يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك. قد يؤدي تعطيل ملفات تعريف الارتباط إلى تقييد بعض ميزات منصتنا.' }
    },
    {
      id: 'user-rights',
      title: { en: '6. Your Rights', ar: '6. حقوقك' },
      body: { en: 'You have the right to access, correct, or delete your personal information at any time. To exercise these rights, please contact our support team. We will respond to verified requests within 30 days. You also have the right to withdraw consent for marketing communications at any time.', ar: 'لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها في أي وقت. لممارسة هذه الحقوق، يرجى الاتصال بفريق الدعم الخاص بنا. سنرد على الطلبات التي تم التحقق منها في غضون 30 يوماً. لديك أيضاً الحق في سحب الموافقة على الاتصالات التسويقية في أي وقت.' }
    },
    {
      id: 'changes',
      title: { en: '7. Changes to This Policy', ar: '7. التغييرات في هذه السياسة' },
      body: { en: 'We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes by posting a notice on our platform or sending an email to registered users. Continued use of the platform after changes constitutes acceptance of the updated policy.', ar: 'قد نقوم بتحديث سياسة الخصوصية هذه بشكل دوري لتعكس التغييرات في ممارساتنا أو المتطلبات القانونية. سنخطرك بالتغييرات المهمة عن طريق نشر إشعار على منصتنا أو إرسال بريد إلكتروني إلى المستخدمين المسجلين. الاستمرار في استخدام المنصة بعد التغييرات يشكل قبولاً للسياسة المحدثة.' }
    }
  ]
};

export const DEFAULT_CONTACT: ContactPageData = {
  heroTitle: { en: 'Get in Touch', ar: 'تواصل معنا' },
  heroSubtitle: { en: 'We\'re here to help! Reach out to our support team and we\'ll get back to you as soon as possible.', ar: 'نحن هنا للمساعدة! تواصل مع فريق الدعم وسنرد عليك في أقرب وقت ممكن.' },
  email: 'support@shoprox.com',
  phone: '+20 100 000 0000',
  address: { en: 'Nasr City, Cairo, Egypt', ar: 'مدينة نصر، القاهرة، مصر' },
  workingHours: { en: 'Sunday – Thursday: 9:00 AM – 6:00 PM', ar: 'الأحد - الخميس: 9:00 صباحاً - 6:00 مساءً' },
  mapEmbedNote: { en: 'Our main office is located in the heart of Nasr City, Cairo. Walk-ins are welcome during working hours for product inquiries and support.', ar: 'يقع مكتبنا الرئيسي في قلب مدينة نصر، القاهرة. نرحب بالزيارات خلال ساعات العمل للاستفسارات عن المنتجات والدعم.' }
};

// ─── Parsing Utility ──────────────────────────────────────────────────────────

function deepMergeFallback(parsed: any, fallback: any): any {
  if (fallback === null || fallback === undefined) return parsed ?? fallback;

  // LocalizedString detection ({ en: string, ar: string })
  if (typeof fallback === 'object' && 'en' in fallback && 'ar' in fallback) {
    if (typeof parsed === 'string') {
      return { en: parsed, ar: fallback.ar || parsed };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        en: typeof parsed.en === 'string' ? parsed.en : fallback.en,
        ar: typeof parsed.ar === 'string' ? parsed.ar : fallback.ar
      };
    }
    return { ...fallback };
  }

  // Array fallback merging
  if (Array.isArray(fallback)) {
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    return parsed.map((item, idx) => {
      const templateItem = fallback[idx] || fallback[0];
      return deepMergeFallback(item, templateItem);
    });
  }

  // Object property merging
  if (typeof fallback === 'object') {
    if (typeof parsed !== 'object' || parsed === null) return { ...fallback };
    const result: any = {};
    for (const key of Object.keys(fallback)) {
      result[key] = deepMergeFallback(parsed[key], fallback[key]);
    }
    return result;
  }

  return parsed ?? fallback;
}

/** Safely parses CMS JSON content with fallback to default data and bilingual sanitization */
export function parseCmsContent<T>(rawContent: string, fallback: T): T {
  try {
    if (!rawContent || rawContent.trim() === '') return fallback;
    const parsed = JSON.parse(rawContent);
    if (typeof parsed !== 'object' || parsed === null) return fallback;
    return deepMergeFallback(parsed, fallback) as T;
  } catch (error) {
    console.warn('[CmsParser] JSON parse error — loaded fallback structure:', error);
    return fallback;
  }
}
