import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  messages: IContactMessage[] = [];
  isLoading = true;
  currentPage = 1;
  pageSize = 10;
  totalResults = 0;
  totalPages = 1;

  private socketSub!: Subscription;

  constructor(
    private _contactService: ContactService,
    private _socketService: SocketService,
    private _cdr: ChangeDetectorRef,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.fetchMessages();

    // Listen to real-time incoming messages via Socket.io
    this.socketSub = this._socketService.onEvent<IContactMessage>('new_contact_message').subscribe({
      next: (newMessage: IContactMessage) => {
        // Prepend the new message to the list
        this.messages.unshift(newMessage);
        this.totalResults++;
        
        // Remove the oldest if it exceeds page size
        if (this.messages.length > this.pageSize) {
          this.messages.pop();
        }
        
        this.totalPages = Math.ceil(this.totalResults / this.pageSize) || 1;
        this._cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  fetchMessages(): void {
    this.isLoading = true;
    this._contactService.getMessages(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.messages = res.data || [];
        this.totalResults = res.totalResults || 0;
        this.totalPages = res.totalPages || 1;
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.messages = [];
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }

  markAsRead(msg: IContactMessage): void {
    if (msg.isRead) return;

    this._contactService.markAsRead(msg._id).subscribe({
      next: () => {
        msg.isRead = true;
        this._cdr.detectChanges();
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchMessages();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
