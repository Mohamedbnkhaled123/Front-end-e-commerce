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
    <div class="relative inline-block w-full custom-select-wrapper select-none" [class.opacity-60]="disabled" [class.pointer-events-none]="disabled">
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
        class="w-full flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 cursor-pointer text-left rtl:text-right shadow-2xs"
      >
        <span class="block font-semibold text-xs sm:text-sm whitespace-nowrap">
          {{ selectedLabel() }}
        </span>

        <!-- Distinct Down Chevron Arrow (generously padded from border) -->
        <svg 
          class="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ease-out ms-2" 
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
        class="absolute left-0 rtl:left-auto rtl:right-0 mt-2 min-w-full w-max max-w-[calc(100vw-2rem)] sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 max-h-64 overflow-y-auto custom-select-scrollbar text-xs sm:text-sm font-medium transition-all duration-200 ease-out origin-top"
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
            (mouseenter)="highlightedIndex.set($index)"
            [class.opacity-40]="opt.disabled"
            [class.pointer-events-none]="opt.disabled"
            [class.bg-blue-600]="opt.value === selectedValue() && !opt.disabled"
            [class.text-white]="opt.value === selectedValue() && !opt.disabled"
            [class.font-bold]="opt.value === selectedValue()"
            [class.shadow-xs]="opt.value === selectedValue()"
            [class.bg-blue-50]="highlightedIndex() === $index && opt.value !== selectedValue() && !opt.disabled"
            [class.dark:bg-slate-800]="highlightedIndex() === $index && opt.value !== selectedValue() && !opt.disabled"
            [class.text-blue-600]="highlightedIndex() === $index && opt.value !== selectedValue() && !opt.disabled"
            [class.dark:text-blue-400]="highlightedIndex() === $index && opt.value !== selectedValue() && !opt.disabled"
            [class.translate-x-1]="highlightedIndex() === $index && !opt.disabled"
            [class.rtl:-translate-x-1]="highlightedIndex() === $index && !opt.disabled"
            [class.text-slate-700]="opt.value !== selectedValue() && highlightedIndex() !== $index"
            [class.dark:text-slate-200]="opt.value !== selectedValue() && highlightedIndex() !== $index"
            class="px-4 py-2.5 mx-1.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all duration-150 ease-out whitespace-nowrap"
            role="option"
            [attr.aria-selected]="opt.value === selectedValue()"
          >
            <span class="whitespace-nowrap">{{ opt.label }}</span>
            @if (opt.value === selectedValue()) {
              <svg class="w-4 h-4 shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .custom-select-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-select-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-select-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(148, 163, 184, 0.4);
      border-radius: 9999px;
    }
    .custom-select-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(148, 163, 184, 0.7);
    }
  `],
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
