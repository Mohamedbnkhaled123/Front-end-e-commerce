import { TestBed } from '@angular/core/testing';
import { AdminReviews } from './admin-reviews.component';

describe('AdminReviews', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReviews],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminReviews);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
