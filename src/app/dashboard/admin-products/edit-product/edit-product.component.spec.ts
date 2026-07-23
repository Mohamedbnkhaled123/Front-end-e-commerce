import { TestBed } from '@angular/core/testing';
import { EditProduct } from './edit-product.component';

describe('EditProduct', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProduct],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EditProduct);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
