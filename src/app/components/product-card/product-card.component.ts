import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  standalone: false
})
export class ProductCardComponent {
  @Input() product: any;
  @Input() showingMarket: boolean = false;
  
  @Output() editProduct = new EventEmitter<any>();
  @Output() deleteProduct = new EventEmitter<any>();
  @Output() addPhoto = new EventEmitter<number>();
  @Output() removePhoto = new EventEmitter<number>();

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'En Stock': return 'success';
      case 'Bajo Stock': return 'warning';
      case 'Agotado': return 'danger';
      default: return 'medium';
    }
  }

  onEdit() {
    this.editProduct.emit(this.product);
  }

  onDelete() {
    this.deleteProduct.emit(this.product);
  }

  onAddPhoto() {
    this.addPhoto.emit(this.product.id);
  }

  onRemovePhoto() {
    this.removePhoto.emit(this.product.id);
  }
}