import { TestBed } from '@angular/core/testing';
import { Account } from './account.component';

describe('Account', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Account],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Account);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
