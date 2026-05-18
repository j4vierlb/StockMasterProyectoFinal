import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { StorageService } from './services/storage.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  
  private hasCheckedAuth = false;

  constructor(
    private router: Router,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    // Esperar a que el router termine de navegar antes de verificar auth
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (!this.hasCheckedAuth) {
        this.checkAuthenticationState();
        this.hasCheckedAuth = true;
      }
    });
  }

  private checkAuthenticationState() {
    console.log('🚀 Verificando estado de autenticación al iniciar la app...');
    
    const currentUrl = this.router.url;
    console.log('🚀 URL actual:', currentUrl);
    
    // No redirigir si estamos en not-found o rutas públicas
    if (currentUrl.includes('not-found') || 
        currentUrl.includes('register') || 
        currentUrl.includes('reset-password')) {
      console.log('🚀 Ruta pública o 404, no redirigir');
      return;
    }
    
    // Verificar si hay un usuario logueado
    const userData = this.storageService.getUserData();
    const authToken = this.storageService.getAuthToken();
    const isLoggedIn = this.storageService.isLoggedIn();
    
    console.log('🚀 Estado actual:', {
      userData: !!userData,
      authToken: !!authToken,
      isLoggedIn,
      userRole: userData?.role
    });

    if (isLoggedIn && userData && authToken) {
      // Usuario autenticado
      console.log('🚀 Usuario autenticado encontrado, rol:', userData.role);
      
      // Solo redirigir si estamos en login o raíz
      if (currentUrl === '/login' || currentUrl === '/' || currentUrl === '') {
        if (userData.role === 'admin') {
          console.log('🚀 Redirigiendo admin a /admin');
          this.router.navigate(['/admin']);
        } else {
          console.log('🚀 Redirigiendo usuario normal a /home');
          this.router.navigate(['/home']);
        }
      }
    } else {
      // No hay usuario autenticado
      console.log('🚀 No hay usuario autenticado');
      
      // Solo redirigir a login si no estamos en rutas públicas
      if (currentUrl !== '/login' && 
          currentUrl !== '/register' && 
          currentUrl !== '/reset-password' &&
          !currentUrl.includes('not-found')) {
        console.log('🚀 Redirigiendo a /login');
        this.storageService.logout();
        this.router.navigate(['/login']);
      }
    }
  }
}
