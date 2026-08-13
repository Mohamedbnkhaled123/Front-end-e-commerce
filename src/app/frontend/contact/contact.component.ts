import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../core/services/cms.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ContactPageData, DEFAULT_CONTACT, parseCmsContent } from '../../core/models/cms.model';
import { ContactService } from '../../core/services/contact.service';
import { AuthService } from '../../core/services/auth-service';
import { validateEmail } from '../../core/validators/email.validator';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormsModule],
  templateUrl: './contact.component.html'
})
export class Contact implements OnInit {
  pageData: ContactPageData = DEFAULT_CONTACT;
  isLoading = true;
  langService = inject(LanguageService);

  formName: string = '';
  formEmail: string = '';
  formSubject: string = '';
  formMessage: string = '';
  isSubmitting: boolean = false;
  submitSuccess: string = '';
  submitError: string = '';


  onSubmit(): void {
    this.submitSuccess = '';
    this.submitError = '';

    if (!this.formName || !this.formEmail || !this.formSubject || !this.formMessage) {
      this.submitError = this.langService.currentLang() === 'ar' ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields.';
      return;
    }

    const emailCheck = validateEmail(this.formEmail);
    if (!emailCheck.valid) {
      this.submitError = this.langService.currentLang() === 'ar' 
        ? 'يرجى إدخال بريد إلكتروني صحيح' 
        : emailCheck.error || 'Please enter a valid email address.';
      return;
    }
    this.formEmail = emailCheck.sanitized;

    const userRole = this._authService.isUser();
    if (userRole === 'admin' || userRole === 'superadmin') {
      this.submitError = this.langService.currentLang() === 'ar' 
        ? 'لا يمكن للمسؤولين إرسال رسائل تواصل، يمكن للزوار والمستخدمين العاديين فقط الإرسال.' 
        : 'Admins cannot send contact messages. Only guests and regular users are allowed.';
      return;
    }

    this.isSubmitting = true;
    
    this._contactService.sendMessage({
      name: this.formName,
      email: this.formEmail,
      subject: this.formSubject,
      message: this.formMessage
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitSuccess = this.langService.currentLang() === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!';
        this.formName = '';
        this.formEmail = '';
        this.formSubject = '';
        this.formMessage = '';
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = err.error?.message || (this.langService.currentLang() === 'ar' ? 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.' : 'An error occurred. Please try again later.');
        this._cdr.detectChanges();
      }
    });
  }

  constructor(
    private _cmsService: CmsService, 
    private _cdr: ChangeDetectorRef,
    private _contactService: ContactService,
    private _authService: AuthService
  ) {}

  get localized() {
    const lang = this.langService.currentLang();
    return (val: any) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      return val[lang] || val['en'] || '';
    };
  }

  ngOnInit(): void {
    this._cmsService.getPage('Contact').subscribe({
      next: (res) => {
        this.pageData = parseCmsContent<ContactPageData>(res.data?.content ?? '', DEFAULT_CONTACT);
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.pageData = DEFAULT_CONTACT;
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }
}
