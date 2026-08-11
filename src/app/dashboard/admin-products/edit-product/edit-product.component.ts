import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ModalService } from '../../../core/services/modal.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { env } from '../../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './edit-product.component.html'
})
export class EditProduct implements OnInit, OnDestroy {
  productId = '';
  editForm!: FormGroup;
  staticURL = env.staticURL;

  currentImgURL = '';
  existingCategory: any = null;
  existingSubCategory: any = null;
  selectedFile: File | null = null;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  private subscriptions = new Subscription();

  constructor(
    private _fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _productService: ProductService,
    private _modalService: ModalService,
    private _cloudinaryService: CloudinaryService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = this._route.snapshot.paramMap.get('id') || '';

    this.editForm = this._fb.group({
      name:        ['', Validators.required],
      desc:        ['', Validators.required],
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
    }
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
          this.existingCategory = found.category || null;
          this.existingSubCategory = found.subCategory || null;

          this.editForm.patchValue({
            name: found.name,
            desc: found.desc || '',
            price: found.price,
            discount: found.discount || 0,
            stock: found.stock,
            slug: found.slug || '',
            isActive: found.isActive !== false,
            newArrived: found.newArrived || false,
            mostPopular: found.mostPopular || false
          });
        } else {
          this.errorMessage = 'Product not found.';
        }
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load product details.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Handles image file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileNameLower = (file.name || '').toLowerCase();
      this.selectedFile = file;
    }
  }

  // Submits product updates
  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields (Name, Description, Price, Stock).';
      return;
    }

    const confirmed = await this._modalService.confirm({
      title: 'Confirm Save Changes',
      message: 'Are you sure you want to save the changes made to this product?',
      confirmText: 'Yes, Save Changes',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    this.isSaving = true;
    this._cdr.detectChanges();

    const updateProductData = (imgURL?: string) => {
      const payload: any = {
        name: this.editForm.get('name')?.value || '',
        desc: this.editForm.get('desc')?.value || '',
        price: this.editForm.get('price')?.value || 0,
        discount: this.editForm.get('discount')?.value || 0,
        stock: this.editForm.get('stock')?.value || 0,
        slug: this.editForm.get('slug')?.value || '',
        isActive: this.editForm.get('isActive')?.value,
        newArrived: this.editForm.get('newArrived')?.value,
        mostPopular: this.editForm.get('mostPopular')?.value
      };

      if (this.existingCategory) {
        const catId = typeof this.existingCategory === 'object' ? this.existingCategory._id : String(this.existingCategory);
        if (catId) payload.category = catId;
      }

      if (this.existingSubCategory) {
        const subCatId = typeof this.existingSubCategory === 'object' ? this.existingSubCategory._id : String(this.existingSubCategory);
        if (subCatId) payload.subCategory = subCatId;
      }

      if (imgURL) {
        payload.imgURL = imgURL;
      }

      const sub = this._productService.updateProduct(this.productId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Product updated successfully!';
          this._cdr.detectChanges();
          setTimeout(() => {
            this._router.navigate(['/admin/products']);
          }, 1200);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || 'Failed to update product.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(sub);
    };

    if (this.selectedFile) {
      const uploadSub = this._cloudinaryService.uploadImage(this.selectedFile, this.selectedFile.name).subscribe({
        next: (res) => {
          updateProductData(res.secure_url);
        },
        error: () => {
          this.isSaving = false;
          this.errorMessage = 'Failed to upload image to Cloudinary.';
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
    const confirmDelete = await this._modalService.confirm({
      title: 'Soft Delete Product',
      message: 'Are you sure you want to soft delete / disable this product?',
      confirmText: 'Yes, Delete',
      cancelText: 'No, Keep it',
      type: 'danger'
    });

    if (!confirmDelete) return;

    this.isSaving = true;
    this._cdr.detectChanges();
    const sub = this._productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.successMessage = 'Product soft-deleted / archived successfully!';
        this._cdr.detectChanges();
        setTimeout(() => {
          this._router.navigate(['/admin/products']);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete product.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
