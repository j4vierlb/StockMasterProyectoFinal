import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  async logout() {
    // Limpiar datos y redirigir al login de inmediato
    await this.storageService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  goToAdvancedFeatures() {
    console.log('🔧 Accediendo a funcionalidades avanzadas...');
    console.log('❌ Redirigiendo a página 404');
    this.router.navigate(['/not-found']);
  }
  
  userName: string = 'Usuario';
  userRole: string = '';
  userInventory: any[] = [];
  
  metrics = {
    totalProducts: 0,
    lowStock: 0,
    inventoryValue: 0,
    totalMovements: 0
  };

  quickActions = [
    { title: 'Productos', icon: 'cube-outline', route: '/products', color: 'primary' },
    { title: 'Categorías', icon: 'pricetag-outline', route: '/categories', color: 'secondary' },
    { title: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movements', color: 'tertiary' },
    { title: 'Ajustes', icon: 'settings-outline', route: '/settings', color: 'success' }
  ];

  recentActivities: any[] = [];

  constructor(
    private router: Router,
    private animationCtrl: AnimationController,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    // La verificación se hace en ionViewWillEnter
  }

  ionViewWillEnter() {
    console.log('=== Entrando al Home ==='); // Debug
    console.log('✅ Guard validó sesión, cargando datos del usuario'); // Debug
    this.loadUserData();
  }

  private loadUserData() {
    // Obtener datos del usuario desde localStorage
    const userData = this.storageService.getUserData();
    if (userData) {
      this.userName = userData.name || userData.username;
      this.userRole = userData.role || 'Usuario';
      
      // Cargar inventario específico del usuario
      this.userInventory = this.storageService.getUserInventory(userData.id);
      
      // Cargar actividades específicas del usuario
      this.recentActivities = this.storageService.getUserActivities(userData.id);
      
      // Si no hay actividades, usar algunas por defecto
      if (this.recentActivities.length === 0) {
        this.recentActivities = [
          { action: 'Entrada de stock', product: 'Monitor LG 24"', quantity: 10, time: 'Hace 2 horas', icon: 'arrow-down-circle', color: 'success' },
          { action: 'Producto actualizado', product: 'Teclado Mecánico', quantity: 0, time: 'Hace 5 horas', icon: 'create', color: 'warning' },
          { action: 'Nuevo producto', product: 'Mouse Inalámbrico', quantity: 15, time: 'Ayer', icon: 'add-circle', color: 'primary' }
        ];
      }
      
      // Calcular métricas basadas en el inventario del usuario
      this.calculateMetrics();
    }
  }

  private calculateMetrics() {
    if (this.userInventory.length > 0) {
      this.metrics.totalProducts = this.userInventory.length;
      this.metrics.lowStock = this.userInventory.filter(item => item.stock < 10).length;
      this.metrics.inventoryValue = this.userInventory.reduce((total, item) => total + (item.price * item.stock), 0);
      this.metrics.totalMovements = Math.floor(Math.random() * 50) + 20; // Simulado por ahora
    }
    
    // Animar elementos después de calcular métricas
    setTimeout(() => {
      this.animateElements();
    }, 500);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0 
    }).format(amount);
  }

  animateElements() {
    const elements = [
      '.welcome-card',
      '.metrics-grid',
      '.actions-grid',
      '.activities-card'
    ];

    elements.forEach((selector, index) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const animation = this.animationCtrl.create()
          .addElement(element)
          .duration(600)
          .delay(100 * index)
          .fromTo('opacity', '0', '1')
          .fromTo('transform', 'translateY(20px)', 'translateY(0)');
        animation.play();
      }
    });
  }

  doRefresh(event?: any) {
    setTimeout(() => {
      // Simular actualización de datos
      this.metrics.totalMovements += 1;
      if (event && event.target && event.target.complete) {
        event.target.complete();
      }
    }, 1500);
  }

  // Nuevas funciones para el header mejorado
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Buenos días';
    } else if (hour < 18) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  }

  getUserInitials(): string {
    return this.userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  showNotifications() {
    // Implementar lógica de notificaciones
    console.log('Mostrar notificaciones');
  }
}