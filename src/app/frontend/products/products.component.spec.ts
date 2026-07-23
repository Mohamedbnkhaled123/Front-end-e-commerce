import { TestBed } from '@angular/core/testing';
import { Products } from './products.component';

describe('Products', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Products);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
