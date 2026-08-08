import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css'
})
export class LogoComponent {
  @Input() customLink: string = '/';
  @Input() isAdmin: boolean = false;
  @Input() ariaLabel: string = 'shoPRO Home';
  @Input() lightText: boolean = false;
}
