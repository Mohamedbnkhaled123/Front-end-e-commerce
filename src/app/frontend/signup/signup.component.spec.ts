import { TestBed } from '@angular/core/testing';
import { Signup } from './signup.component';

describe('Signup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Signup);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
