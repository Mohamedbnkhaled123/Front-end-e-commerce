import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../core/services/cms.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { PolicyPageData, DEFAULT_POLICY, parseCmsContent } from '../../core/models/cms.model';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './policy.component.html'
})
export class Policy implements OnInit {
  pageData: PolicyPageData = DEFAULT_POLICY;
  isLoading = true;
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
    this._cmsService.getPage('Policy').subscribe({
      next: (res) => {
        this.pageData = parseCmsContent<PolicyPageData>(res.data?.content ?? '', DEFAULT_POLICY);
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.pageData = DEFAULT_POLICY;
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }
}
