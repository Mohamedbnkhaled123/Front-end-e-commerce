import { TestBed } from '@angular/core/testing';
import { AddProduct } from './add-product.component';

describe('AddProduct', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProduct],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AddProduct);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
