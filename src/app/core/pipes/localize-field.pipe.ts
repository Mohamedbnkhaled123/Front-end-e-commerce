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
    if (!item) return '';

    // 1. Primary canonical database field (e.g. name or desc) updated by admin
    const baseValue = item[fieldName];
    if (baseValue !== undefined && baseValue !== null && typeof baseValue === 'string') {
      return baseValue;
    }

    // 2. Fallback to localized key if base field is not present
    const currentLang = this._languageService.currentLang();
    const localizedKey = `${fieldName}_${currentLang}`;
    const localizedValue = item[localizedKey];

    if (localizedValue && typeof localizedValue === 'string') {
      return localizedValue;
    }

    return baseValue || '';
  }
}
