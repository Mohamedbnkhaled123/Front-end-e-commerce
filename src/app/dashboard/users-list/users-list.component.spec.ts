import { TestBed } from '@angular/core/testing';
import { UsersList } from './users-list.component';

describe('UsersList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersList],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(UsersList);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
