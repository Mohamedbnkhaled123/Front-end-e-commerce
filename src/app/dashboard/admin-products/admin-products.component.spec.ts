import { TestBed } from '@angular/core/testing';
import { AdminProducts } from './admin-products.component';

describe('AdminProducts', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProducts],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminProducts);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
