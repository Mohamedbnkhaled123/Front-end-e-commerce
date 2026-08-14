import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, ICategory } from '../../../core/services/category.service';
import { SubCategoryService, ISubCategory } from '../../../core/services/subcategory.service';
import { TaxonomyService, IMainTaxonomyGroup } from '../../../core/services/taxonomy.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { Subscription, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-product.component.html'
})
export class AddProduct implements OnInit {

  // === Product Form State ===
  productForm!: FormGroup;
  selectedFile: File | null = null;
  selectedCategoryId = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // === Categories & Taxonomy State ===
  categories: ICategory[] = [];
  taxonomyGroups: IMainTaxonomyGroup[] = [];
  selectedMainGroupId = '';
  isLoadingCategories = true;

  // === SubCategories State ===
  subCategories: ISubCategory[] = [];
  selectedSubCategoryId = '';
  isLoadingSubCategories = false;

  // === Add Category Modal ===
  showCategoryModal = false;
  newCategoryName = '';
  newSubCategoryName = ''; // Optional initial subcategory
  newCategoryFile: File | null = null;
  isAddingCategory = false;
  categoryModalError = '';

  // === Add SubCategory Modal ===
  showSubCategoryModal = false;
  newSubCatName = '';
  targetCategoryIdForSub = '';
  isAddingSubCategory = false;
  subCategoryModalError = '';

  private subscriptions = new Subscription();

  constructor(
    private _fb: FormBuilder,
    private _productService: ProductService,
    private _categoryService: CategoryService,
    private _subCategoryService: SubCategoryService,
    public taxonomyService: TaxonomyService,
    private _cloudinaryService: CloudinaryService,
    private _router: Router,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.productForm = this._fb.group({
      name:        ['', Validators.required],
      slug:        ['', Validators.required],
      desc:        ['', Validators.required],
      price:       [null, [Validators.required, Validators.min(0)]],
      discount:    [0, [Validators.min(0), Validators.max(100)]],
      stock:       [null, [Validators.required, Validators.min(0)]],
      newArrived:  [false],
      mostPopular: [false],
    });

    // Auto-generate slug from name
    this.productForm.get('name')!.valueChanges.subscribe((val: string) => {
      if (val && !this.productForm.get('slug')!.dirty) {
        const generated = val.toLowerCase().trim()
          .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        this.productForm.get('slug')!.setValue(generated, { emitEvent: false });
      }
    });

    this.loadCategories();
  }

  loadCategories() {
    this.isLoadingCategories = true;
    this._categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.taxonomyGroups = this.taxonomyService.groupCategories(this.categories);

        if (this.selectedCategoryId) {
          const foundGroup = this.taxonomyService.findGroupByCategoryId(this.selectedCategoryId, this.taxonomyGroups);
          this.selectedMainGroupId = foundGroup ? foundGroup.id : (this.taxonomyGroups[0]?.id || '');
        } else if (this.taxonomyGroups.length > 0) {
          this.selectedMainGroupId = this.taxonomyGroups[0].id;
          this.selectedCategoryId = this.taxonomyGroups[0].categories[0]?._id || '';
        }

        this.isLoadingCategories = false;
        if (this.selectedCategoryId) {
          this.loadSubCategories(this.selectedCategoryId);
        }
        this._cdr.detectChanges();
      },
      error: () => {
        this.categories = [];
        this.taxonomyGroups = [];
        this.isLoadingCategories = false;
        this._cdr.detectChanges();
      }
    });
  }

  get currentGroupCategories(): ICategory[] {
    const group = this.taxonomyGroups.find(g => g.id === this.selectedMainGroupId);
    return group ? group.categories : this.categories;
  }

  onMainGroupChange(groupId: string) {
    this.selectedMainGroupId = groupId;
    const group = this.taxonomyGroups.find(g => g.id === groupId);
    if (group && group.categories.length > 0) {
      this.selectedCategoryId = group.categories[0]._id;
      this.loadSubCategories(this.selectedCategoryId);
    }
    this._cdr.detectChanges();
  }

  loadSubCategories(categoryId: string) {
    if (!categoryId) {
      this.subCategories = [];
      this.selectedSubCategoryId = '';
      return;
    }
    this.isLoadingSubCategories = true;
    this._subCategoryService.getSubCategoriesByMain(categoryId).subscribe({
      next: (res) => {
        this.subCategories = res.data || [];
        this.selectedSubCategoryId = this.subCategories.length > 0 ? this.subCategories[0]._id : '';
        this.isLoadingSubCategories = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.subCategories = [];
        this.selectedSubCategoryId = '';
        this.isLoadingSubCategories = false;
        this._cdr.detectChanges();
      }
    });
  }

  selectCategory(id: string) {
    if (this.selectedCategoryId !== id) {
      this.selectedCategoryId = id;
      const foundGroup = this.taxonomyService.findGroupByCategoryId(id, this.taxonomyGroups);
      if (foundGroup && foundGroup.id !== this.selectedMainGroupId) {
        this.selectedMainGroupId = foundGroup.id;
      }
      this.loadSubCategories(id);
      this._cdr.detectChanges();
    }
  }

  selectSubCategory(id: string) {
    this.selectedSubCategoryId = id;
    this._cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileNameLower = (file.name || '').toLowerCase();
      this.selectedFile = file;
    }
  }

  // === Category Modal ===
  openCategoryModal() {
    this.showCategoryModal = true;
    this.newCategoryName = '';
    this.newSubCategoryName = '';
    this.newCategoryFile = null;
    this.categoryModalError = '';
    this._cdr.detectChanges();
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this._cdr.detectChanges();
  }

  onCategoryFileSelected(event: any) {
    this.newCategoryFile = event.target.files[0] || null;
  }

  submitNewCategory() {
    this.categoryModalError = '';
    if (!this.newCategoryName.trim()) {
      this.categoryModalError = 'Please enter a category name.';
      return;
    }
    this.isAddingCategory = true;
    this._cdr.detectChanges();

    const addCat = (imgURL?: string) => {
      const payload = { name: this.newCategoryName.trim(), imgURL };
      const sub = this._categoryService.addCategory(payload).pipe(
        switchMap(res => {
          const cat = res.data;
          if (cat?._id && this.newSubCategoryName.trim()) {
            const subPayload = {
              name: this.newSubCategoryName.trim(),
              slug: this.newSubCategoryName.trim().toLowerCase().replace(/[\s_]+/g, '-'),
              categoryId: cat._id
            };
            return this._subCategoryService.addSubCategory(subPayload).pipe(
              tap(() => {
                return res; // Forward category response
              }),
              catchError(err => {
                console.error('Failed to add initial subcategory', err);
                return of(res); // Still return category success even if subcat fails
              })
            );
          }
          return of(res);
        })
      ).subscribe({
        next: (res: any) => {
          this.isAddingCategory = false;
          this.showCategoryModal = false;
          const cat = res?.data;
          if (cat?._id) {
            this.categories = [...this.categories, cat];
            this.selectedCategoryId = cat._id;
            this.loadSubCategories(cat._id);
          } else {
            this.loadCategories();
          }
          this._cdr.detectChanges();
        },
        error: (err: any) => {
          this.isAddingCategory = false;
          this.categoryModalError = err?.error?.message || 'Failed to add category.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(sub);
    };

    if (this.newCategoryFile) {
      const uploadSub = this._cloudinaryService.uploadImage(this.newCategoryFile, this.newCategoryFile.name).subscribe({
        next: (res: any) => {
          addCat(res.secure_url);
        },
        error: () => {
          this.isAddingCategory = false;
          this.categoryModalError = 'Failed to upload category image to Cloudinary.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(uploadSub);
    } else {
      addCat();
    }
  }

  // === SubCategory Modal ===
  openSubCategoryModal() {
    this.showSubCategoryModal = true;
    this.targetCategoryIdForSub = this.selectedCategoryId || (this.categories.length > 0 ? this.categories[0]._id : '');
    this.newSubCatName = '';
    this.subCategoryModalError = '';
    this._cdr.detectChanges();
  }

  closeSubCategoryModal() {
    this.showSubCategoryModal = false;
    this._cdr.detectChanges();
  }

  submitNewSubCategory() {
    this.subCategoryModalError = '';
    if (!this.newSubCatName.trim()) {
      this.subCategoryModalError = 'Please enter a subcategory name.';
      return;
    }
    if (!this.targetCategoryIdForSub) {
      this.subCategoryModalError = 'Please select a parent category for this subcategory.';
      return;
    }

    this.isAddingSubCategory = true;
    this._cdr.detectChanges();

    const payload = {
      name: this.newSubCatName.trim(),
      slug: this.newSubCatName.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
      categoryId: this.targetCategoryIdForSub,
      category: this.targetCategoryIdForSub
    };

    const sub = this._subCategoryService.addSubCategory(payload).subscribe({
      next: (res: any) => {
        this.isAddingSubCategory = false;
        this.showSubCategoryModal = false;
        const newSub = res?.data;

        // Switch to the target category if not already active
        this.selectedCategoryId = this.targetCategoryIdForSub;
        
        // Reload subcategories for this category and select the newly added one
        this.isLoadingSubCategories = true;
        this._subCategoryService.getSubCategoriesByMain(this.targetCategoryIdForSub).subscribe({
          next: (subRes) => {
            this.subCategories = subRes.data || [];
            if (newSub?._id) {
              this.selectedSubCategoryId = newSub._id;
            } else if (this.subCategories.length > 0) {
              this.selectedSubCategoryId = this.subCategories[this.subCategories.length - 1]._id;
            }
            this.isLoadingSubCategories = false;
            this._cdr.detectChanges();
          },
          error: () => {
            this.isLoadingSubCategories = false;
            this._cdr.detectChanges();
          }
        });
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        this.isAddingSubCategory = false;
        this.subCategoryModalError = err?.error?.message || 'Failed to create subcategory.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // === Submit Product ===
  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.productForm.invalid) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة.';
      return;
    }
    if (!this.selectedCategoryId) {
      this.errorMessage = 'يرجى تحديد قسم للمنتج.';
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = 'يرجى اختيار صورة للمنتج.';
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    const submitProductData = (imgURL: string) => {
      const vals = this.productForm.value;
      const payload = {
        name: vals.name,
        slug: vals.slug || '',
        desc: vals.desc,
        price: vals.price,
        discount: vals.discount || 0,
        stock: vals.stock,
        newArrived: vals.newArrived ? true : false,
        mostPopular: vals.mostPopular ? true : false,
        category: this.selectedCategoryId,
        subCategory: this.selectedSubCategoryId || undefined,
        imgURL: imgURL
      };

      const sub = this._productService.addProduct(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'تمت إضافة المنتج بنجاح!';
          this.productForm.reset({ discount: 0, newArrived: false, mostPopular: false });
          this.selectedFile = null;
          this._cdr.detectChanges();
          
          setTimeout(() => {
            this._router.navigate(['/admin/products']);
          }, 1500);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'حدث خطأ أثناء إضافة المنتج.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(sub);
    };

    if (this.selectedFile) {
      const uploadSub = this._cloudinaryService.uploadImage(this.selectedFile, this.selectedFile.name).subscribe({
        next: (res: any) => {
          submitProductData(res.secure_url);
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'حدث خطأ أثناء رفع الصورة إلى Cloudinary.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(uploadSub);
    } else {
      // Should not be reached because of the validation above
      this.isLoading = false;
      this.errorMessage = 'يرجى اختيار صورة للمنتج.';
      this._cdr.detectChanges();
    }
  }
}
