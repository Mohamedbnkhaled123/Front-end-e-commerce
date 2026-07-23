import { TestBed } from '@angular/core/testing';
import { MyOrders } from './my-orders.component';

describe('MyOrders', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyOrders],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MyOrders);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
