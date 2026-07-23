import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CmsService } from '../../core/services/cms.service';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.component.html'
})
export class Contact implements OnInit {
  content = '';

  constructor(private _cmsService: CmsService, private _cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._cmsService.getPage('Contact').subscribe({
      next: (res) => {
        this.content = res.data ? res.data.content : '';
        this._cdr.detectChanges();
      },
      error: () => {
        this.content = '';
        this._cdr.detectChanges();
      }
    });
  }
}
