import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../core/services/cms.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { FaqPageData, DEFAULT_FAQ, parseCmsContent } from '../../core/models/cms.model';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './faq.component.html'
})
export class Faq implements OnInit {
  pageData: FaqPageData = DEFAULT_FAQ;
  isLoading = true;
  openItemId: string | null = null;
  langService = inject(LanguageService);

  constructor(private _cmsService: CmsService, private _cdr: ChangeDetectorRef) {}

  get localized() {
    const lang = this.langService.currentLang();
    return (val: any) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      return val[lang] || val['en'] || '';
    };
  }

  ngOnInit(): void {
    this._cmsService.getPage('FAQ').subscribe({
      next: (res) => {
        this.pageData = parseCmsContent<FaqPageData>(res.data?.content ?? '', DEFAULT_FAQ);
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.pageData = DEFAULT_FAQ;
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }

  toggleItem(id: string): void {
    this.openItemId = this.openItemId === id ? null : id;
  }
}
