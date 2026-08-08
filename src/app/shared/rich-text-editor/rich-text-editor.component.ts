import {
  Component,
  ElementRef,
  ViewChild,
  forwardRef,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.css'
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
  @ViewChild('editorArea') editorArea!: ElementRef<HTMLDivElement>;
  @Input() placeholder = 'Write clean HTML content here...';
  @Input() minHeight = '280px';

  htmlValue = '';
  isDisabled = false;

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.editorArea && this.htmlValue) {
      this.editorArea.nativeElement.innerHTML = this.htmlValue;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['htmlValue'] && this.editorArea) {
      this.editorArea.nativeElement.innerHTML = this.htmlValue || '';
    }
  }

  // --- ControlValueAccessor Methods ---
  writeValue(val: string): void {
    this.htmlValue = val || '';
    if (this.editorArea?.nativeElement) {
      this.editorArea.nativeElement.innerHTML = this.htmlValue;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // --- Editor Input Handlers ---
  onContentInput(): void {
    if (!this.editorArea) return;
    const content = this.editorArea.nativeElement.innerHTML;
    this.htmlValue = content;
    this.onChange(content);
  }

  onBlur(): void {
    this.onTouched();
  }

  // --- Toolbar Commands ---
  exec(command: string, value: string | undefined = undefined): void {
    if (this.isDisabled) return;
    document.execCommand(command, false, value);
    this.onContentInput();
  }

  promptLink(): void {
    if (this.isDisabled) return;
    const url = prompt('Enter Hyperlink URL (e.g. https://example.com):');
    if (url) {
      this.exec('createLink', url);
    }
  }

  insertHeading(): void {
    this.exec('formatBlock', '<h2>');
  }

  insertBlockquote(): void {
    this.exec('formatBlock', '<blockquote>');
  }
}
