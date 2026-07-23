import { TestBed } from '@angular/core/testing';
import { Product } from './product.component';

describe('Product', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Product],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Product);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
