import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

export interface IModalActive {
  data: IModalData;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  activeModal$ = new BehaviorSubject<IModalActive | null>(null);

  /**
   * Shows a styled confirmation dialog and returns a Promise<boolean>
   */
  confirm(data: IModalData): Promise<boolean> {
    return new Promise((resolve) => {
      this.activeModal$.next({
        data: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'warning',
          ...data
        },
        resolve
      });
    });
  }

  /**
   * Shows a styled alert dialog (without cancel button)
   */
  alert(data: IModalData): Promise<boolean> {
    return new Promise((resolve) => {
      this.activeModal$.next({
        data: {
          confirmText: 'OK',
          cancelText: '',
          type: 'info',
          ...data
        },
        resolve
      });
    });
  }

  close(result: boolean) {
    const current = this.activeModal$.value;
    if (current) {
      current.resolve(result);
      this.activeModal$.next(null);
    }
  }
}
