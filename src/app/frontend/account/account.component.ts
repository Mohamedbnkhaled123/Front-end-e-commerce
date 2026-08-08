import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-account',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './account.component.html'
})
export class Account {}

