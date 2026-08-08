import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../core/services/cms.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AboutPageData, DEFAULT_ABOUT, parseCmsContent } from '../../core/models/cms.model';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './about.component.html'
})
export class About implements OnInit {
  pageData: AboutPageData = DEFAULT_ABOUT;
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
    this._cmsService.getPage('About').subscribe({
      next: (res) => {
        this.pageData = parseCmsContent<AboutPageData>(res.data?.content ?? '', DEFAULT_ABOUT);
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.pageData = DEFAULT_ABOUT;
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }
}
