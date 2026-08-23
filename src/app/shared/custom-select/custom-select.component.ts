import { Component, Input, Output, EventEmitter, forwardRef, signal, ElementRef, HostListener, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full custom-select-wrapper select-none" [class.opacity-60]="disabled" [class.pointer-events-none]="disabled">
      <!-- Trigger Button -->
      <button
        #triggerBtn
        type="button"
        (click)="toggleOpen()"
        (keydown)="onKeyDown($event)"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        [disabled]="disabled"
        [ngClass]="triggerClasses"
        class="w-full flex items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer text-left rtl:text-right"
      >
        <span class="truncate block flex-1 font-semibold text-xs sm:text-sm">
          {{ selectedLabel() }}
        </span>

        <!-- Distinct Down Chevron Arrow (generously padded from border) -->
        <svg 
          class="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ease-out" 
          [class.rotate-180]="isOpen()" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Smooth Floating Menu Dropdown -->
      <div
        class="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto text-xs sm:text-sm font-medium transition-all duration-200 ease-out origin-top"
        [class.opacity-100]="isOpen()"
        [class.scale-100]="isOpen()"
        [class.translate-y-0]="isOpen()"
        [class.pointer-events-auto]="isOpen()"
        [class.opacity-0]="!isOpen()"
        [class.scale-95]="!isOpen()"
        [class.-translate-y-2]="!isOpen()"
        [class.pointer-events-none]="!isOpen()"
        role="listbox"
      >
        @for (opt of options; track $index) {
          <div
            (click)="selectOption(opt)"
            [class.opacity-40]="opt.disabled"
            [class.pointer-events-none]="opt.disabled"
            [class.bg-blue-50]="opt.value === selectedValue() && !opt.disabled"
            [class.dark:bg-slate-800]="opt.value === selectedValue() && !opt.disabled"
            [class.text-blue-600]="opt.value === selectedValue() && !opt.disabled"
            [class.dark:text-blue-400]="opt.value === selectedValue() && !opt.disabled"
            [class.font-bold]="opt.value === selectedValue()"
            [class.bg-slate-100]="highlightedIndex() === $index && opt.value !== selectedValue()"
            [class.dark:bg-slate-800/60]="highlightedIndex() === $index && opt.value !== selectedValue()"
            class="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 cursor-pointer flex items-center justify-between gap-2"
            role="option"
            [attr.aria-selected]="opt.value === selectedValue()"
          >
            <span class="truncate">{{ opt.label }}</span>
            @if (opt.value === selectedValue()) {
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            }
          </div>
        }
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() disabled: boolean = false;
  @Input() triggerClasses: string = 'px-3.5 py-2 min-h-[38px]';

  @Input() 
  set value(val: any) {
    this.selectedValue.set(val);
  }
  get value(): any {
    return this.selectedValue();
  }

  @Output() valueChange = new EventEmitter<any>();

  isOpen = signal<boolean>(false);
  selectedValue = signal<any>(null);
  highlightedIndex = signal<number>(-1);

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  selectedLabel = computed(() => {
    const val = this.selectedValue();
    const found = this.options.find(o => o.value === val);
    return found ? found.label : this.placeholder;
  });

  writeValue(val: any): void {
    this.selectedValue.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleOpen(): void {
    if (this.disabled) return;
    const newState = !this.isOpen();
    this.isOpen.set(newState);
    if (newState) {
      const idx = this.options.findIndex(o => o.value === this.selectedValue());
      this.highlightedIndex.set(idx >= 0 ? idx : 0);
    } else {
      this.onTouched();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.onTouched();
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (!this.isOpen()) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.toggleOpen();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightPrev();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const current = this.options[this.highlightedIndex()];
        if (current && !current.disabled) {
          this.selectOption(current);
        }
        break;
      case 'Escape':
      case 'Tab':
        this.close();
        break;
    }
  }

  private highlightNext(): void {
    let next = this.highlightedIndex() + 1;
    while (next < this.options.length && this.options[next].disabled) {
      next++;
    }
    if (next < this.options.length) {
      this.highlightedIndex.set(next);
    }
  }

  private highlightPrev(): void {
    let prev = this.highlightedIndex() - 1;
    while (prev >= 0 && this.options[prev].disabled) {
      prev--;
    }
    if (prev >= 0) {
      this.highlightedIndex.set(prev);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.close();
      }
    }
  }
}
