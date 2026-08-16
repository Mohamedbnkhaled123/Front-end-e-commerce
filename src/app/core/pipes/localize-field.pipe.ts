import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'localizeField',
  standalone: true,
  pure: false
})
export class LocalizeFieldPipe implements PipeTransform {
  private _languageService = inject(LanguageService);

  transform(item: any, fieldName: string): string {
    if (!item || !fieldName) return '';

    const currentLang = this._languageService.currentLang();
    const localizedKey = `${fieldName}_${currentLang}`;
    const localizedValue = item[localizedKey];

    // 1. If localized field for current language exists and is non-empty, use it
    if (localizedValue !== undefined && localizedValue !== null && typeof localizedValue === 'string' && localizedValue.trim() !== '') {
      return localizedValue;
    }

    // 2. Fallback to primary canonical database field (e.g. name or desc)
    const baseValue = item[fieldName];
    if (baseValue !== undefined && baseValue !== null && typeof baseValue === 'string') {
      return baseValue;
    }

    return '';
  }
}
