import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CmsService } from '../../core/services/cms.service';
import { CmsPageName } from '../../core/models/cms.model';
import {
  HomePageData, DEFAULT_HOME,
  AboutPageData, DEFAULT_ABOUT,
  FaqPageData, DEFAULT_FAQ, FaqCategory, FaqItem,
  PolicyPageData, DEFAULT_POLICY, PolicySection,
  ContactPageData, DEFAULT_CONTACT,
  parseCmsContent
} from '../../core/models/cms.model';

import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { sanitizeImageFile, validateImageUrl } from '../../core/utils/image-upload-sanitizer';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-cms.component.html'
})
export class AdminCms implements OnInit {

  constructor(private _cmsService: CmsService, private _cdr: ChangeDetectorRef) {}

  readonly pages: CmsPageName[] = ['Home', 'About', 'Policy', 'FAQ', 'Contact'];
  activeTab: CmsPageName = 'Home';

  isLoading = false;
  isSaving = false;
  successMsg = '';
  errorMsg = '';

  // Hero Image Manager State
  heroImageMode: 'file' | 'url' = 'file';
  heroUploadState: 'idle' | 'dragging' | 'validating' | 'sanitizing' | 'uploading' | 'success' | 'error' = 'idle';
  heroUploadError = '';
  heroUploadProgress = 0;
  selectedFile: File | null = null;
  sanitizedBlob: Blob | null = null;
  sanitizedPreviewUrl = '';
  private currentUploadSub: Subscription | null = null;

  // Structured page data
  homeData: HomePageData = structuredClone(DEFAULT_HOME);
  aboutData: AboutPageData = structuredClone(DEFAULT_ABOUT);
  faqData: FaqPageData = structuredClone(DEFAULT_FAQ);
  policyData: PolicyPageData = structuredClone(DEFAULT_POLICY);
  contactData: ContactPageData = structuredClone(DEFAULT_CONTACT);

  // FAQ UI state
  openFaqCategoryId: string | null = null;

  ngOnInit(): void {
    this.loadPage(this.activeTab);
  }

  selectTab(page: CmsPageName): void {
    this.activeTab = page;
    this.successMsg = '';
    this.errorMsg = '';
    this.loadPage(page);
  }

  private loadPage(page: CmsPageName): void {
    this.isLoading = true;
    this._cmsService.getPage(page).subscribe({
      next: (res) => {
        const raw = res.data?.content ?? '';
        switch (page) {
          case 'Home':
            this.homeData = parseCmsContent<HomePageData>(raw, structuredClone(DEFAULT_HOME));
            break;
          case 'About':
            this.aboutData = parseCmsContent<AboutPageData>(raw, structuredClone(DEFAULT_ABOUT));
            break;
          case 'FAQ':
            this.faqData = parseCmsContent<FaqPageData>(raw, structuredClone(DEFAULT_FAQ));
            break;
          case 'Policy':
            this.policyData = parseCmsContent<PolicyPageData>(raw, structuredClone(DEFAULT_POLICY));
            break;
          case 'Contact':
            this.contactData = parseCmsContent<ContactPageData>(raw, structuredClone(DEFAULT_CONTACT));
            break;
        }
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }

  // Confirmation Modal state
  showConfirmModal = false;

  openSaveConfirmModal(): void {
    this.showConfirmModal = true;
  }

  cancelSave(): void {
    this.showConfirmModal = false;
  }

  confirmSave(): void {
    this.showConfirmModal = false;
    this.executeSave();
  }

  saveContent(): void {
    this.openSaveConfirmModal();
  }

  private executeSave(): void {
    this.isSaving = true;
    this.successMsg = '';
    this.errorMsg = '';

    let payload: string;
    switch (this.activeTab) {
      case 'Home':    payload = JSON.stringify(this.homeData);    break;
      case 'About':   payload = JSON.stringify(this.aboutData);   break;
      case 'FAQ':     payload = JSON.stringify(this.faqData);     break;
      case 'Policy':  payload = JSON.stringify(this.policyData);  break;
      case 'Contact': payload = JSON.stringify(this.contactData); break;
      default:        payload = '';
    }

    this._cmsService.updatePage(this.activeTab, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.successMsg = res.message || `'${this.activeTab}' page saved successfully.`;
        this._cdr.detectChanges();
        setTimeout(() => { this.successMsg = ''; this._cdr.detectChanges(); }, 4000);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMsg = err.error?.message || 'Failed to save. Please try again.';
        this._cdr.detectChanges();
      }
    });
  }

  activeLang: 'en' | 'ar' = 'en';

  setLang(lang: 'en' | 'ar'): void {
    this.activeLang = lang;
  }

  resetToDefaults(): void {
    switch (this.activeTab) {
      case 'Home':
        this.homeData = structuredClone(DEFAULT_HOME);
        break;
      case 'About':
        this.aboutData = structuredClone(DEFAULT_ABOUT);
        break;
      case 'FAQ':
        this.faqData = structuredClone(DEFAULT_FAQ);
        break;
      case 'Policy':
        this.policyData = structuredClone(DEFAULT_POLICY);
        break;
      case 'Contact':
        this.contactData = structuredClone(DEFAULT_CONTACT);
        break;
    }
    this.successMsg = `Loaded rich default bilingual content for '${this.activeTab}'. Make your edits and click Save.`;
    this._cdr.detectChanges();
    setTimeout(() => { this.successMsg = ''; this._cdr.detectChanges(); }, 4000);
  }

  // ── About helpers ──────────────────────────────────────────────────────────

  addAboutStat(): void {
    this.aboutData = {
      ...this.aboutData,
      stats: [...this.aboutData.stats, { value: { en: 'New', ar: 'جديد' }, label: { en: 'Label', ar: 'تسمية' } }]
    };
  }

  removeAboutStat(index: number): void {
    this.aboutData = {
      ...this.aboutData,
      stats: this.aboutData.stats.filter((_, i) => i !== index)
    };
  }

  addAboutFeature(): void {
    this.aboutData = {
      ...this.aboutData,
      features: [...this.aboutData.features, {
        icon: 'M12 4v16m8-8H4',
        title: { en: 'New Feature', ar: 'ميزة جديدة' },
        description: { en: 'Describe this feature...', ar: 'وصف هذه الميزة...' }
      }]
    };
  }

  removeAboutFeature(index: number): void {
    this.aboutData = {
      ...this.aboutData,
      features: this.aboutData.features.filter((_, i) => i !== index)
    };
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────────

  toggleFaqCategory(id: string): void {
    this.openFaqCategoryId = this.openFaqCategoryId === id ? null : id;
  }

  addFaqCategory(): void {
    const newId = 'cat-' + Date.now();
    this.faqData = {
      ...this.faqData,
      categories: [...this.faqData.categories, {
        id: newId,
        title: { en: 'New Category', ar: 'قسم جديد' },
        items: [{ id: 'faq-' + Date.now(), question: { en: 'New question?', ar: 'سؤال جديد؟' }, answer: { en: 'Write the answer here...', ar: 'اكتب الإجابة هنا...' } }]
      }]
    };
    this.openFaqCategoryId = newId;
  }

  removeFaqCategory(catId: string): void {
    this.faqData = {
      ...this.faqData,
      categories: this.faqData.categories.filter(c => c.id !== catId)
    };
  }

  addFaqItem(catId: string): void {
    this.faqData = {
      ...this.faqData,
      categories: this.faqData.categories.map(cat =>
        cat.id === catId
          ? { ...cat, items: [...cat.items, { id: 'faq-' + Date.now(), question: { en: 'New question?', ar: 'سؤال جديد؟' }, answer: { en: 'Write the answer here...', ar: 'اكتب الإجابة هنا...' } }] }
          : cat
      )
    };
  }

  removeFaqItem(catId: string, itemId: string): void {
    this.faqData = {
      ...this.faqData,
      categories: this.faqData.categories.map(cat =>
        cat.id === catId
          ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
          : cat
      )
    };
  }

  // ── Policy helpers ─────────────────────────────────────────────────────────

  addPolicySection(): void {
    this.policyData = {
      ...this.policyData,
      sections: [...this.policyData.sections, {
        id: 'sec-' + Date.now(),
        title: { en: `${this.policyData.sections.length + 1}. New Section`, ar: `${this.policyData.sections.length + 1}. قسم جديد` },
        body: { en: 'Write the section content here...', ar: 'اكتب محتوى القسم هنا...' }
      }]
    };
  }

  removePolicySection(id: string): void {
    this.policyData = {
      ...this.policyData,
      sections: this.policyData.sections.filter(s => s.id !== id)
    };
  }

  // ── Textarea auto-expand helper (field-sizing: content fallback) ───────────

  autoExpand(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // ── Hero Image Manager Handlers ────────────────────────────────────────────

  setHeroMode(mode: 'file' | 'url'): void {
    this.heroImageMode = mode;
    this.heroUploadError = '';
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.heroUploadState === 'idle' || this.heroUploadState === 'error') {
      this.heroUploadState = 'dragging';
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.heroUploadState === 'dragging') {
      this.heroUploadState = 'idle';
    }
  }

  async onFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) {
      this.heroUploadState = 'idle';
      return;
    }
    await this.processFile(event.dataTransfer.files[0]);
  }

  async processFile(file: File): Promise<void> {
    this.selectedFile = file;
    this.heroUploadError = '';
    this.heroUploadState = 'validating';
    this._cdr.detectChanges();

    try {
      this.heroUploadState = 'sanitizing';
      this._cdr.detectChanges();

      const result = await sanitizeImageFile(file);
      this.sanitizedBlob = result.blob;
      this.sanitizedPreviewUrl = result.objectUrl;

      // Automatically trigger upload once sanitized
      this.uploadSanitizedFile(file.name);
    } catch (err: any) {
      this.heroUploadState = 'error';
      this.heroUploadError = err?.message || 'Failed to process image.';
      this._cdr.detectChanges();
    }
  }

  uploadSanitizedFile(originalName: string): void {
    if (!this.sanitizedBlob) return;

    this.heroUploadState = 'uploading';
    this.heroUploadProgress = 30;
    this._cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = () => {
      this.heroUploadProgress = 100;
      this.homeData.heroImage = reader.result as string; // Embed as Base64 string directly
      this.heroUploadState = 'success';
      this.heroUploadError = '';
      this._cdr.detectChanges();
    };
    reader.onerror = () => {
      this.heroUploadState = 'error';
      this.heroUploadError = 'Failed to process image locally. Please try again.';
      this._cdr.detectChanges();
    };
    reader.readAsDataURL(this.sanitizedBlob);
  }

  cancelUpload(): void {
    if (this.currentUploadSub) {
      this.currentUploadSub.unsubscribe();
      this.currentUploadSub = null;
    }
    this.clearHeroUpload();
  }

  retryUpload(): void {
    if (this.selectedFile) {
      this.processFile(this.selectedFile);
    }
  }

  clearHeroUpload(): void {
    this.heroUploadState = 'idle';
    this.heroUploadError = '';
    this.selectedFile = null;
    this.sanitizedBlob = null;
    if (this.sanitizedPreviewUrl) {
      URL.revokeObjectURL(this.sanitizedPreviewUrl);
      this.sanitizedPreviewUrl = '';
    }
    this._cdr.detectChanges();
  }

  onUrlInputChange(): void {
    if (!this.homeData.heroImage) return;
    const urlValidation = validateImageUrl(this.homeData.heroImage);
    if (!urlValidation.valid) {
      this.heroUploadError = urlValidation.error!;
    } else {
      this.heroUploadError = '';
    }
  }
}
