import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: false,
  templateUrl: './loading-spinner.html'
})
export class LoadingSpinnerComponent {
  @Input() visible: boolean = false;
}
