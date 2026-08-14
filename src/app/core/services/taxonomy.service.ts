import { Injectable, inject } from '@angular/core';
import { ICategory } from '../models/category.model';
import { LanguageService } from './language.service';

export interface IMainTaxonomyGroup {
  id: string;
  name: string;
  name_ar: string;
  matchedCategoryNames: string[];
  categories: ICategory[];
}

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  private _langService = inject(LanguageService);

  private readonly TAXONOMY_DEFINITIONS: Omit<IMainTaxonomyGroup, 'categories'>[] = [
    {
      id: 'electronics',
      name: 'Electronics & Tech',
      name_ar: 'الإلكترونيات والتكنولوجيا',
      matchedCategoryNames: [
        'Smartphones',
        'Laptops',
        'Tablets',
        'Mobile Accessories',
        'Electronics'
      ]
    },
    {
      id: 'fashion',
      name: 'Fashion & Apparel',
      name_ar: 'الأزياء والموضة',
      matchedCategoryNames: [
        'Clothes',
        'Mens Shirts',
        'Tops',
        'Womens Dresses',
        'Mens Shoes',
        'Womens Shoes',
        'Shoes',
        'bags',
        'Womens Bags',
        'Men'
      ]
    },
    {
      id: 'beauty',
      name: 'Beauty & Personal Care',
      name_ar: 'الجمال والعناية الشخصية',
      matchedCategoryNames: [
        'Beauty',
        'Skin Care',
        'Fragrances'
      ]
    },
    {
      id: 'accessories',
      name: 'Watches & Jewelry',
      name_ar: 'الساعات والمجوهرات',
      matchedCategoryNames: [
        'Mens Watches',
        'Womens Watches',
        'Sunglasses',
        'Womens Jewellery'
      ]
    },
    {
      id: 'home',
      name: 'Home & Living',
      name_ar: 'المنزل والديكور',
      matchedCategoryNames: [
        'Furniture',
        'Home Decoration',
        'Kitchen Accessories'
      ]
    },
    {
      id: 'vehicles',
      name: 'Vehicles & Motors',
      name_ar: 'السيارات والدراجات',
      matchedCategoryNames: [
        'Vehicle',
        'Motorcycle'
      ]
    },
    {
      id: 'supermarket_sports',
      name: 'Supermarket & Sports',
      name_ar: 'سوبرماركت ورياضة',
      matchedCategoryNames: [
        'Groceries',
        'Sports Accessories',
        'Miscellaneous',
        'Uncategorized',
        'other'
      ]
    }
  ];

  /**
   * Groups a raw list of categories from the backend into 7 structured main groups.
   */
  groupCategories(rawCategories: ICategory[]): IMainTaxonomyGroup[] {
    if (!rawCategories || rawCategories.length === 0) {
      return [];
    }

    const groups: IMainTaxonomyGroup[] = this.TAXONOMY_DEFINITIONS.map(def => ({
      ...def,
      categories: []
    }));

    const assignedIds = new Set<string>();

    // 1. Assign categories based on defined matchedCategoryNames (case-insensitive)
    for (const group of groups) {
      const lowerNames = group.matchedCategoryNames.map(n => n.toLowerCase().trim());
      for (const cat of rawCategories) {
        if (!cat || !cat.name) continue;
        const catNameLower = cat.name.toLowerCase().trim();
        if (lowerNames.includes(catNameLower) && !assignedIds.has(cat._id)) {
          group.categories.push(cat);
          assignedIds.add(cat._id);
        }
      }
    }

    // 2. Put any unassigned categories into the last group (Supermarket & Sports / Miscellaneous)
    const fallbackGroup = groups[groups.length - 1];
    for (const cat of rawCategories) {
      if (cat && cat._id && !assignedIds.has(cat._id)) {
        fallbackGroup.categories.push(cat);
        assignedIds.add(cat._id);
      }
    }

    // 3. Sort subcategories alphabetically inside each group
    for (const group of groups) {
      group.categories.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Return only groups that have categories
    return groups.filter(g => g.categories.length > 0);
  }

  /**
   * Finds which taxonomy group contains the given category ID.
   */
  findGroupByCategoryId(categoryId: string, groups: IMainTaxonomyGroup[]): IMainTaxonomyGroup | undefined {
    if (!categoryId || !groups) return undefined;
    return groups.find(g => g.categories.some(c => c._id === categoryId));
  }

  /**
   * Gets the localized name of a taxonomy group based on active language.
   */
  getGroupName(group: IMainTaxonomyGroup): string {
    const isAr = this._langService.currentLang() === 'ar';
    return isAr ? (group.name_ar || group.name) : group.name;
  }
}
