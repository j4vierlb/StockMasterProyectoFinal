import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home-metrics',
  templateUrl: './home-metrics.component.html',
  styleUrls: ['./home-metrics.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush // Optimización: Solo detectar cambios cuando sea necesario
})
export class HomeMetricsComponent {
  // Datos de métricas optimizados - podrían venir de un servicio
  readonly metricsData = {
    products: { value: 1247, trend: 5.2, status: 'positive' },
    lowStock: { value: 23, trend: 0, status: 'warning' },
    totalValue: { value: 485290, trend: 12.3, status: 'positive' },
    movements: { value: 156, trend: 0, status: 'neutral' }
  } as const;

  constructor() {
    // Constructor optimizado sin OnInit innecesario
  }

  // Método helper para formatear números si se necesita en el futuro
  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value);
  }

  // Método helper para formatear moneda si se necesita en el futuro  
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  }
}
