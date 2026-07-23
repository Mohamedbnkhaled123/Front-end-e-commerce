import { TestBed } from '@angular/core/testing';
import { AdminCms } from './admin-cms.component';

describe('AdminCms', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCms],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminCms);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
