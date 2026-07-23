import { TestBed } from '@angular/core/testing';
import { Faq } from './faq.component';

describe('Faq', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Faq],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Faq);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
