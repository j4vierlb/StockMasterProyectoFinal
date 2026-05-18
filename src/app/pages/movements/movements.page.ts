import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController, ActionSheetController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-movements',
  templateUrl: './movements.page.html',
  styleUrls: ['./movements.page.scss'],
  standalone: false,
})
export class MovementsPage implements OnInit {

  movements: any[] = [];
  filteredMovements: any[] = [];
  products: any[] = [];
  searchTerm: string = '';
  selectedType: string = 'all';
  isLoading: boolean = false;
  
  movementTypes = [
    { value: 'all', label: 'Todos los Movimientos' },
    { value: 'entrada', label: 'Entradas' },
    { value: 'salida', label: 'Salidas' },
    { value: 'ajuste', label: 'Ajustes' }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    const userData = this.storageService.getUserData();
    
    this.products = this.storageService.getUserInventory(userData.id) || [];
    this.movements = await this.storageService.getItem(`movements_${userData.id}`) || [];
    
    // Generar algunos movimientos de ejemplo si no existen
    if (this.movements.length === 0) {
      this.generateSampleMovements(userData.id);
    }
    
    this.filteredMovements = [...this.movements];
    this.isLoading = false;
  }

  generateSampleMovements(userId: string) {
    const sampleMovements = [
      {
        id: Date.now() - 86400000,
        type: 'entrada',
        productId: this.products[0]?.id || 1,
        productName: this.products[0]?.name || 'Producto Sample',
        quantity: 50,
        reason: 'Compra inicial',
        date: new Date(Date.now() - 86400000).toISOString(),
        userId: userId
      },
      {
        id: Date.now() - 43200000,
        type: 'salida',
        productId: this.products[1]?.id || 2,
        productName: this.products[1]?.name || 'Producto Sample 2',
        quantity: 5,
        reason: 'Venta',
        date: new Date(Date.now() - 43200000).toISOString(),
        userId: userId
      }
    ];
    
    this.movements = sampleMovements;
    this.storageService.setItem(`movements_${userId}`, this.movements);
  }

  filterMovements() {
    this.filteredMovements = this.movements.filter(movement => {
      const matchesSearch = movement.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           movement.reason.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           movement.type.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesType = this.selectedType === 'all' || movement.type === this.selectedType;
      
      return matchesSearch && matchesType;
    });

    // Ordenar por fecha (más recientes primero)
    this.filteredMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async addMovement() {
    if (this.products.length === 0) {
      this.showToast('Primero debes agregar productos al inventario', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Nuevo Movimiento',
      cssClass: 'glass-alert',
      inputs: [
        {
          name: 'productId',
          type: 'text',
          placeholder: 'ID del Producto'
        },
        {
          name: 'type',
          type: 'text',
          placeholder: 'Tipo: entrada, salida, ajuste'
        },
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Cantidad'
        },
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Motivo del movimiento'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Registrar',
          handler: (data) => {
            if (this.validateMovementData(data)) {
              this.createMovement(data);
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
  }

  validateMovementData(data: any): boolean {
    if (!data.productId || !data.type || !data.quantity || !data.reason) {
      this.showToast('Por favor, completa todos los campos', 'warning');
      return false;
    }

    const product = this.products.find(p => p.id == data.productId);
    if (!product) {
      this.showToast('Producto no encontrado', 'danger');
      return false;
    }

    if (!['entrada', 'salida', 'ajuste'].includes(data.type.toLowerCase())) {
      this.showToast('Tipo debe ser: entrada, salida o ajuste', 'warning');
      return false;
    }

    const quantity = parseInt(data.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      this.showToast('Cantidad debe ser un número positivo', 'warning');
      return false;
    }

    // Validar stock suficiente para salidas
    if (data.type.toLowerCase() === 'salida' && product.stock < quantity) {
      this.showToast('Stock insuficiente para esta salida', 'warning');
      return false;
    }

    return true;
  }

  createMovement(movementData: any) {
    const product = this.products.find(p => p.id == movementData.productId);
    const quantity = parseInt(movementData.quantity);
    const type = movementData.type.toLowerCase();

    const newMovement = {
      id: Date.now(),
      type: type,
      productId: parseInt(movementData.productId),
      productName: product.name,
      quantity: quantity,
      reason: movementData.reason,
      date: new Date().toISOString(),
      userId: this.storageService.getUserData().id
    };

    // Actualizar stock del producto
    this.updateProductStock(product, type, quantity);

    // Registrar movimiento
    this.movements.unshift(newMovement);
    this.saveMovements();
    this.filterMovements();
    
    this.showToast(`Movimiento de ${type} registrado exitosamente`, 'success');
    
    // Registrar actividad
    this.registerActivity(
      `${type.charAt(0).toUpperCase() + type.slice(1)} registrada`, 
      `${product.name} - ${quantity} unidades`
    );
  }

  updateProductStock(product: any, type: string, quantity: number) {
    const userData = this.storageService.getUserData();
    
    switch(type) {
      case 'entrada':
        product.stock += quantity;
        break;
      case 'salida':
        product.stock -= quantity;
        break;
      case 'ajuste':
        // Para ajuste, la cantidad es el nuevo stock total
        product.stock = quantity;
        break;
    }

    // Actualizar estado del producto
    if (product.stock < 10) {
      product.status = 'Bajo Stock';
    } else if (product.stock === 0) {
      product.status = 'Sin Stock';
    } else {
      product.status = 'Disponible';
    }

    // Guardar productos actualizados
    this.storageService.setUserInventory(userData.id, this.products);
  }

  async deleteMovement(movement: any) {
    const alert = await this.alertController.create({
      header: 'Eliminar Movimiento',
      message: `¿Estás seguro de que deseas eliminar este movimiento?`,
      cssClass: 'glass-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.removeMovement(movement.id);
          }
        }
      ]
    });

    await alert.present();
  }

  removeMovement(movementId: number) {
    this.movements = this.movements.filter(m => m.id !== movementId);
    this.saveMovements();
    this.filterMovements();
    
    this.showToast('Movimiento eliminado exitosamente', 'success');
    
    // Registrar actividad
    this.registerActivity('Movimiento eliminado', 'Registro de movimiento eliminado del historial');
  }

  getMovementIcon(type: string): string {
    switch(type) {
      case 'entrada': return 'arrow-down-circle-outline';
      case 'salida': return 'arrow-up-circle-outline';
      case 'ajuste': return 'create-outline';
      default: return 'swap-horizontal-outline';
    }
  }

  getMovementColor(type: string): string {
    switch(type) {
      case 'entrada': return 'success';
      case 'salida': return 'danger';
      case 'ajuste': return 'warning';
      default: return 'medium';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  }

  private saveMovements() {
    const userData = this.storageService.getUserData();
    this.storageService.setItem(`movements_${userData.id}`, this.movements);
  }

  private registerActivity(action: string, details: string) {
    const userData = this.storageService.getUserData();
    const activity = {
      id: Date.now(),
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
      userId: userData.id
    };
    
    this.storageService.addUserActivity(userData.id, activity);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'top',
      cssClass: 'glass-toast'
    });
    await toast.present();
  }

  getEntradasCount(): number {
    return this.filteredMovements.filter(m => m.type === 'entrada').length;
  }

  getSalidasCount(): number {
    return this.filteredMovements.filter(m => m.type === 'salida').length;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}