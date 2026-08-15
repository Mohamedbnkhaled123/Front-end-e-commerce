import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, ICategory } from '../../../core/services/category.service';
import { SubCategoryService, ISubCategory } from '../../../core/services/subcategory.service';
import { TaxonomyService, IMainTaxonomyGroup } from '../../../core/services/taxonomy.service';
import { ModalService } from '../../../core/services/modal.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { env } from '../../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './edit-product.component.html'
})
export class EditProduct implements OnInit, OnDestroy {
  productId = '';
  editForm!: FormGroup;
  staticURL = env.staticURL;

  currentImgURL = '';
  selectedFile: File | null = null;

  categories: ICategory[] = [];
  taxonomyGroups: IMainTaxonomyGroup[] = [];
  selectedMainGroupId = '';
  subCategories: ISubCategory[] = [];
  selectedCategoryId = '';
  selectedSubCategoryId = '';
  isLoadingCategories = false;
  isLoadingSubCategories = false;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // === Add Category Modal ===
  showCategoryModal = false;
  newCategoryName = '';
  newSubCategoryName = '';
  newCategoryFile: File | null = null;
  isAddingCategory = false;
  categoryModalError = '';

  // === Add SubCategory Modal ===
  showSubCategoryModal = false;
  newSubCatName = '';
  targetCategoryIdForSub = '';
  isAddingSubCategory = false;
  subCategoryModalError = '';

  public langService = inject(LanguageService);
  private subscriptions = new Subscription();

  constructor(
    private _fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _productService: ProductService,
    private _categoryService: CategoryService,
    private _subCategoryService: SubCategoryService,
    public taxonomyService: TaxonomyService,
    private _modalService: ModalService,
    private _cloudinaryService: CloudinaryService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = this._route.snapshot.paramMap.get('id') || '';

    this.editForm = this._fb.group({
      name:        ['', Validators.required],
      desc:        [''],
      price:       [null, [Validators.required, Validators.min(0)]],
      discount:    [0, [Validators.min(0), Validators.max(100)]],
      stock:       [null, [Validators.required, Validators.min(0)]],
      slug:        [''],
      isActive:    [true],
      newArrived:  [false],
      mostPopular: [false]
    });

    if (this.productId) {
      this.loadProductDetails();
      this.loadCategories();
    }
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
        }

        this.isLoadingCategories = false;
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
    if (!this.selectedMainGroupId) return [];
    const group = this.taxonomyGroups.find(g => g.id === this.selectedMainGroupId);
    return group ? group.categories : [];
  }

  onMainGroupChange(groupId: string) {
    this.selectedMainGroupId = groupId;
    const group = this.taxonomyGroups.find(g => g.id === groupId);
    if (group && group.categories.length > 0) {
      const firstCat = group.categories[0];
      this.selectCategory(firstCat._id);
    } else {
      this.selectedCategoryId = '';
      this.selectedSubCategoryId = '';
      this.subCategories = [];
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
      next: (res: any) => {
        this.subCategories = res.data || [];
        if (this.selectedSubCategoryId) {
          const exists = this.subCategories.some(s => s._id === this.selectedSubCategoryId);
          if (!exists) {
            this.selectedSubCategoryId = this.subCategories.length > 0 ? this.subCategories[0]._id : '';
          }
        }
        this.isLoadingSubCategories = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.subCategories = [];
        this.isLoadingSubCategories = false;
        this._cdr.detectChanges();
      }
    });
  }

  selectCategory(id: string) {
    if (this.selectedCategoryId !== id) {
      this.selectedCategoryId = id;
      this.selectedSubCategoryId = '';
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

  // Loads existing product details
  loadProductDetails() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._productService.getProductById(this.productId).subscribe({
      next: (res) => {
        const found = res.data;
        if (found) {
          this.currentImgURL = found.imgURL || '';
          this.selectedCategoryId = (typeof found.category === 'object' ? found.category?._id : found.category) || '';
          this.selectedSubCategoryId = (typeof found.subCategory === 'object' ? found.subCategory?._id : found.subCategory) || '';
          
          if (this.selectedCategoryId) {
            const foundGroup = this.taxonomyService.findGroupByCategoryId(this.selectedCategoryId, this.taxonomyGroups);
            if (foundGroup) {
              this.selectedMainGroupId = foundGroup.id;
            }
            this.loadSubCategories(this.selectedCategoryId);
          }

          const isAr = this.langService.currentLang() === 'ar';
          const activeName = found.name || (isAr ? found.name_ar : found.name_en) || '';
          const activeDesc = (found.desc !== undefined && found.desc !== null) ? found.desc : (isAr ? (found.desc_ar || '') : (found.desc_en || ''));

          this.editForm.patchValue({
            name: activeName,
            desc: activeDesc,
            price: found.price,
            discount: found.discount || 0,
            stock: found.stock,
            slug: found.slug || '',
            isActive: found.isActive !== false,
            newArrived: found.newArrived || false,
            mostPopular: found.mostPopular || false
          });
        } else {
          this.errorMessage = this.langService.currentLang() === 'ar' ? 'المنتج غير موجود.' : 'Product not found.';
        }
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = this.langService.currentLang() === 'ar' ? 'فشل تحميل بيانات المنتج.' : 'Failed to load product details.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
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
      this.categoryModalError = this.langService.currentLang() === 'ar' ? 'يرجى إدخال اسم التصنيف.' : 'Please enter a category name.';
      return;
    }
    this.isAddingCategory = true;
    this._cdr.detectChanges();

    const addCat = (imgURL?: string) => {
      const payload = { name: this.newCategoryName.trim(), imgURL };
      const sub = this._categoryService.addCategory(payload).subscribe({
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
          this.categoryModalError = err?.error?.message || (this.langService.currentLang() === 'ar' ? 'فشل إضافة التصنيف.' : 'Failed to add category.');
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
          this.categoryModalError = this.langService.currentLang() === 'ar' ? 'فشل رفع صورة التصنيف.' : 'Failed to upload category image.';
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
      this.subCategoryModalError = this.langService.currentLang() === 'ar' ? 'يرجى إدخال اسم التصنيف الفرعي.' : 'Please enter a subcategory name.';
      return;
    }
    if (!this.targetCategoryIdForSub) {
      this.subCategoryModalError = this.langService.currentLang() === 'ar' ? 'يرجى اختيار التصنيف الرئيسي.' : 'Please select a parent category.';
      return;
    }

    this.isAddingSubCategory = true;
    this._cdr.detectChanges();

    const payload = {
      name: this.newSubCatName.trim(),
      categoryId: this.targetCategoryIdForSub
    };

    const sub = this._subCategoryService.addSubCategory(payload).subscribe({
      next: (res: any) => {
        this.isAddingSubCategory = false;
        this.showSubCategoryModal = false;
        const newSub = res?.data;

        if (this.selectedCategoryId !== this.targetCategoryIdForSub) {
          this.selectedCategoryId = this.targetCategoryIdForSub;
        }

        this._subCategoryService.getSubCategoriesByMain(this.targetCategoryIdForSub).subscribe({
          next: (subRes: any) => {
            this.subCategories = subRes.data || [];
            if (newSub?._id) {
              this.selectedSubCategoryId = newSub._id;
            }
            this._cdr.detectChanges();
          }
        });
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        this.isAddingSubCategory = false;
        this.subCategoryModalError = err?.error?.message || (this.langService.currentLang() === 'ar' ? 'فشل إنشاء التصنيف الفرعي.' : 'Failed to create subcategory.');
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Handles image file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Submits product updates
  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    const isAr = this.langService.currentLang() === 'ar';

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.errorMessage = isAr ? 'يرجى ملء جميع الحقول المطلوبة (الاسم، الوصف، السعر، المخزون).' : 'Please fill in all required fields (Name, Description, Price, Stock).';
      return;
    }

    const confirmed = await this._modalService.confirm({
      title: isAr ? 'تأكيد حفظ التعديلات' : 'Confirm Save Changes',
      message: isAr ? 'هل أنت متأكد من حفظ التعديلات على هذا المنتج؟' : 'Are you sure you want to save the changes made to this product?',
      confirmText: isAr ? 'نعم، حفظ التعديلات' : 'Yes, Save Changes',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    this.isSaving = true;
    this._cdr.detectChanges();

    const updateProductData = (imgURL?: string) => {
      const formName = (this.editForm.get('name')?.value || '').trim();
      const formDesc = (this.editForm.get('desc')?.value || '').trim();
      const formSlug = (this.editForm.get('slug')?.value || '').trim();

      const payload: any = {
        name: formName,
        desc: formDesc,
        name_ar: formName,
        name_en: formName,
        desc_ar: formDesc,
        desc_en: formDesc,
        price: Number(this.editForm.get('price')?.value) || 0,
        discount: Number(this.editForm.get('discount')?.value) || 0,
        stock: Number(this.editForm.get('stock')?.value) || 0,
        isActive: this.editForm.get('isActive')?.value !== false,
        newArrived: !!this.editForm.get('newArrived')?.value,
        mostPopular: !!this.editForm.get('mostPopular')?.value
      };

      if (formSlug) {
        payload.slug = formSlug;
      }

      if (this.selectedCategoryId) {
        payload.category = this.selectedCategoryId;
      }

      if (this.selectedSubCategoryId) {
        payload.subCategory = this.selectedSubCategoryId;
      }

      payload.imgURL = imgURL || this.currentImgURL;

      const sub = this._productService.updateProduct(this.productId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = isAr ? 'تم تحديث بيانات المنتج بنجاح!' : 'Product updated successfully!';
          this._cdr.detectChanges();
          setTimeout(() => {
            this._router.navigate(['/admin/products']);
          }, 1200);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || (isAr ? 'فشل تحديث المنتج.' : 'Failed to update product.');
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(sub);
    };

    if (this.selectedFile) {
      const uploadSub = this._cloudinaryService.uploadImage(this.selectedFile, this.selectedFile.name).subscribe({
        next: (res: any) => {
          updateProductData(res.secure_url);
        },
        error: () => {
          this.isSaving = false;
          this.errorMessage = isAr ? 'فشل رفع الصورة إلى Cloudinary.' : 'Failed to upload image to Cloudinary.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(uploadSub);
    } else {
      updateProductData();
    }
  }

  // Soft deletes product by ID
  async onSoftDelete() {
    const isAr = this.langService.currentLang() === 'ar';
    const confirmDelete = await this._modalService.confirm({
      title: isAr ? 'حذف المنتج' : 'Soft Delete Product',
      message: isAr ? 'هل أنت متأكد من حذف هذا المنتج ونقله للأرشيف؟' : 'Are you sure you want to soft delete / disable this product?',
      confirmText: isAr ? 'نعم، حذف' : 'Yes, Delete',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      type: 'danger'
    });

    if (!confirmDelete) return;

    this.isSaving = true;
    this._cdr.detectChanges();
    const sub = this._productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.successMessage = isAr ? 'تم حذف المنتج بنجاح!' : 'Product soft-deleted / archived successfully!';
        this._cdr.detectChanges();
        setTimeout(() => {
          this._router.navigate(['/admin/products']);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || (isAr ? 'فشل حذف المنتج.' : 'Failed to delete product.');
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
