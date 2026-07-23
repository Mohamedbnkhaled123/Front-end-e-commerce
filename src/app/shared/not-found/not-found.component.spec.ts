import { TestBed } from '@angular/core/testing';
import { NotFound } from './not-found.component';

describe('NotFound', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFound],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotFound);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
