import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class App implements OnInit {
  protected readonly title = signal('velora-frontend');

  constructor(private _authService: AuthService) {}

  ngOnInit(): void {
    this._authService.onInitAuth();
  }
}
