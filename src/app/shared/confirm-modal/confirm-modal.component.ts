import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, IModalActive } from '../../core/services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  modal: IModalActive | null = null;
  private sub = new Subscription();

  constructor(
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this._modalService.activeModal$.subscribe(modal => {
      this.modal = modal;
      this._cdr.detectChanges();
    });
  }

  onResponse(result: boolean) {
    this._modalService.close(result);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
