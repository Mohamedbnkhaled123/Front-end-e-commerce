import { TestBed } from '@angular/core/testing';
import { Contact } from './contact.component';

describe('Contact', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Contact);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
