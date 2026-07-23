import { TestBed } from '@angular/core/testing';
import { Frontend } from './frontend';

describe('Frontend', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Frontend],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Frontend);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
