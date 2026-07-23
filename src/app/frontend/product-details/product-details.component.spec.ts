import { TestBed } from '@angular/core/testing';
import { ProductDetails } from './product-details.component';

describe('ProductDetails', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetails],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProductDetails);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
