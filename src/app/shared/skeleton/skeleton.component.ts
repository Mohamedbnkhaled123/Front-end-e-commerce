import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html'
})
export class SkeletonComponent {
  @Input() type: 'product' | 'order' = 'product';
}
