import { TestBed } from '@angular/core/testing';
import { DashboardLogin } from './dashboard-login.component';

describe('DashboardLogin', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLogin],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardLogin);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
