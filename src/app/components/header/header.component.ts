import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent {
  @Input() title: string = 'StockMaster';
  @Input() subtitle: string = '';
  @Input() description: string = '';
  @Input() showBackButton: boolean = false;
  @Input() backUrl: string = '/';
  @Input() showLogo: boolean = true;
  @Input() showWelcomeCard: boolean = false;
  @Input() userName: string = '';
  @Input() headerType: 'login' | 'home' | 'generic' | 'admin' = 'generic';
  
  @Output() logout = new EventEmitter<void>();

  onLogout() {
    console.log('🔥 Header: Botón logout presionado');
    this.logout.emit();
  }
}