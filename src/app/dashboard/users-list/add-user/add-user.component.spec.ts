import { TestBed } from '@angular/core/testing';
import { AddUser } from './add-user.component';

describe('AddUser', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUser],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AddUser);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
