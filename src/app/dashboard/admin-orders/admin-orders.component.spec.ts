import { TestBed } from '@angular/core/testing';
import { AdminOrders } from './admin-orders.component';

describe('AdminOrders', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrders],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminOrders);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
