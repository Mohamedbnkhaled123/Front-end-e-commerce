import { TestBed } from '@angular/core/testing';
import { Checkout } from './checkout.component';

describe('Checkout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkout],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Checkout);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
