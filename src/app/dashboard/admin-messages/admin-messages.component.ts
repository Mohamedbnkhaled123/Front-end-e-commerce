import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, IContactMessage } from '../../core/services/contact.service';
import { SocketService } from '../../core/services/socket.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Subscription } from 'rxjs';

import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-messages.component.html'
})
export class AdminMessages implements OnInit, OnDestroy {
  messages = signal<IContactMessage[]>([]);
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(1);
  pageSize = 10;
  totalResults = signal<number>(0);
  totalPages = signal<number>(1);

  pageNumbers = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  private socketSub!: Subscription;

  constructor(
    private _contactService: ContactService,
    private _socketService: SocketService,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.fetchMessages();

    // Listen to real-time incoming messages via Socket.io
    this.socketSub = this._socketService.onEvent<IContactMessage>('new_contact_message').subscribe({
      next: (newMessage: IContactMessage) => {
        // Prepend the new message to the list
        const updated = [newMessage, ...this.messages()];
        if (updated.length > this.pageSize) {
          updated.pop();
        }
        this.messages.set(updated);
        const newTotal = this.totalResults() + 1;
        this.totalResults.set(newTotal);
        this.totalPages.set(Math.ceil(newTotal / this.pageSize) || 1);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  fetchMessages(): void {
    this.isLoading.set(true);
    this._contactService.getMessages(this.currentPage(), this.pageSize).subscribe({
      next: (res: any) => {
        this.messages.set(res.data || []);
        this.totalResults.set(res.totalResults || 0);
        this.totalPages.set(res.totalPages || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.messages.set([]);
        this.isLoading.set(false);
      }
    });
  }

  markAsRead(msg: IContactMessage): void {
    if (msg.isRead) return;

    this._contactService.markAsRead(msg._id).subscribe({
      next: () => {
        this.messages.update(list => list.map(m => m._id === msg._id ? { ...m, isRead: true } : m));
      }
    });
  }

  deleteMessage(msgId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this._contactService.deleteMessage(msgId).subscribe({
        next: () => {
          this.fetchMessages(); // Reload list after deletion
        }
      });
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.fetchMessages();
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
