import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { CmsService } from '../../core/services/cms.service';
import { CmsPageName } from '../../core/models/cms.model';

@Component({
  selector: 'app-admin-cms',
  imports: [],
  templateUrl: './admin-cms.component.html'
})
export class AdminCms implements OnInit {

  constructor(private _cmsService: CmsService, private _cdr: ChangeDetectorRef) {}

  readonly pages: CmsPageName[] = ['About', 'Policy', 'FAQ', 'Contact'];
  activeTab: CmsPageName = 'About';
  currentContent = '';
  isLoading = false;
  isSaving = false;
  successMsg = '';
  errorMsg = '';

  ngOnInit(): void {
    this.loadPage(this.activeTab);
  }

  // Switches active CMS tab
  selectTab(page: CmsPageName): void {
    this.activeTab = page;
    this.successMsg = '';
    this.errorMsg = '';
    this.loadPage(page);
  }

  // Fetches CMS page content
  private loadPage(page: CmsPageName): void {
    this.isLoading = true;
    this.currentContent = '';

    this._cmsService.getPage(page).subscribe({
      next: (res) => {
        this.currentContent = res.data ? res.data.content : '';
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('[CMS Component] loadPage error:', err);
        this.currentContent = '';
        this.isLoading = false;
        this._cdr.detectChanges();
      },
    });
  }

  saveContent(): void {
    this.onSave();
  }

  // Saves CMS page content
  onSave(): void {
    this.isSaving = true;
    this.successMsg = '';
    this.errorMsg = '';

    this._cmsService.updatePage(this.activeTab, this.currentContent).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.successMsg = res.message || `Page '${this.activeTab}' updated successfully.`;
        this._cdr.detectChanges();
        setTimeout(() => {
          this.successMsg = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMsg = err.error?.message || 'Failed to update page.';
        this._cdr.detectChanges();
      },
    });
  }
}
