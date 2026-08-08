import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth-service';
import { ToastContainerComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly title = signal('shoPRO');

  constructor(
    private _authService: AuthService
  ) {}

  ngOnInit(): void {
    this._authService.onInitAuth();
  }
}
