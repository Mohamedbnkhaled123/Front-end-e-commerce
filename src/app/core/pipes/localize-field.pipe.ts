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
    const currentLang = this._languageService.currentLang();
    
    // Check if the localized field exists (e.g. name_ar or name_en)
    const localizedKey = `${fieldName}_${currentLang}`;
    const localizedValue = item[localizedKey];

    if (localizedValue && typeof localizedValue === 'string' && localizedValue.trim() !== '') {
        return localizedValue;
    }

    // Fallback to the base field (e.g. name)
    const baseValue = item[fieldName];
    return baseValue || '';
  }
}
