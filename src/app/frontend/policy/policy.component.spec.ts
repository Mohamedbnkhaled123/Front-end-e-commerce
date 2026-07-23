import { TestBed } from '@angular/core/testing';
import { Policy } from './policy.component';

describe('Policy', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Policy],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Policy);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
