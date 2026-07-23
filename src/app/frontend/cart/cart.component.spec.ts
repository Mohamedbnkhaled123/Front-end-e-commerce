import { TestBed } from '@angular/core/testing';
import { Cart } from './cart.component';

describe('Cart', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cart],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Cart);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
