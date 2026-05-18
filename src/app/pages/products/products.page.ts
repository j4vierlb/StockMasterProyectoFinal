import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';
import { CameraService } from '../../services/camera.service';
import { ApiService } from '../../services/api.service';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false,
})
export class ProductsPage implements OnInit {

  products: any[] = [];
  filteredProducts: any[] = [];
  localProducts: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  selectedCategory: string = 'all';
  showingMarket = false;
  currentStorageType: 'sqlite' | 'localstorage' = 'sqlite';
  
  categories = [
    { value: 'all', label: 'Todas las Categorías' },
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Periféricos', label: 'Periféricos' },
    { value: 'Pantallas', label: 'Pantallas' },
    { value: 'Accesorios', label: 'Accesorios' },
    { value: 'Software', label: 'Software' }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private toastController: ToastController,
    private storageService: StorageService,
    private cameraService: CameraService,
    private apiService: ApiService,
    private emailService: EmailService
  ) { }

  ngOnInit() {
    this.loadProducts();
  }

  ionViewWillEnter() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    
    console.log('🔄 loadProducts - Cargando datos locales por defecto');
    
    // Siempre cargar datos locales al inicializar
    this.loadLocalProducts();
  }  // 🌐 MÉTODO  PARA CARGAR PRODUCTOS DESDE API CON SQLITE
  private async loadProductsFromApi() {
    try {
      const loading = await this.loadingController.create({
        message: 'Sincronizando con servidor...',
        spinner: 'crescent'
      });
      await loading.present();

      this.apiService.getProducts().subscribe({
        next: async (apiProducts) => {
          // Transformar datos reales de FakeStore API
          const transformedProducts = apiProducts.slice(0, 15).map((product: any) => ({
            id: product.id,
            name: product.title, // Título real del producto
            category: this.mapApiCategory(product.category), // Mapear categoría
            stock: Math.floor(Math.random() * 50) + 5, // Stock simulado (consistente con productos locales)
            quantity: Math.floor(Math.random() * 50) + 5, // Para compatibilidad
            price: Math.round(product.price * 1000), // Convertir a pesos chilenos aprox
            description: product.description, // Descripción real
            photo: product.image, // ✅ Imagen real del producto (consistente con productos locales)
            barcode: this.generateBarcode(),
            location: `Estante ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 10) + 1}`,
            status: Math.floor(Math.random() * 50) + 5 < 10 ? 'Bajo Stock' : 'Disponible',
            lastUpdated: new Date().toISOString(),
            source: 'api-fakestore',
            rating: product.rating || { rate: 0, count: 0 } // Rating del producto
          }));

          // 💾 GUARDAR EN SQLITE PARA CACHE OFFLINE
          await this.storageService.setItem('api_products_cache', transformedProducts);
          await this.storageService.setItem('api_last_sync', new Date().toISOString());
          
          this.products = transformedProducts;
          this.filteredProducts = [...transformedProducts]; // ✅ Actualizar productos filtrados
          this.applyFilters(); // ✅ Aplicar filtros actuales
          
          loading.dismiss();
          
          // Toast de éxito
          const toast = await this.toastController.create({
            message: `✅ ${transformedProducts.length} productos del mercado cargados`,
            duration: 2000,
            color: 'success',
            position: 'bottom'
          });
          toast.present();
        },
        error: async (error) => {
          loading.dismiss();
          console.error('Error cargando desde API:', error);
          
          // 🔄 FALLBACK: Cargar desde SQLite 
          const cachedProducts = await this.storageService.getItem('api_products_cache');
          if (cachedProducts && Array.isArray(cachedProducts)) {
            this.products = cachedProducts;
            this.filteredProducts = [...cachedProducts]; // ✅ Actualizar productos filtrados
            this.applyFilters(); // ✅ Aplicar filtros actuales
            
            const toast = await this.toastController.create({
              message: '📱 Cargando datos guardados (sin conexión)',
              duration: 3000,
              color: 'warning',
              position: 'bottom'
            });
            toast.present();
          } else {
            // Si no hay cache, mostrar error
            const alert = await this.alertController.create({
              header: '🚫 Error de Conexión',
              message: 'No se pudo conectar al servidor y no hay datos guardados.',
              buttons: ['OK']
            });
            alert.present();
          }
        }
      });
    } catch (error) {
      console.error('Error en loadProductsFromApi:', error);
    }
  }

  // 🏠 MÉTODO PARA CARGAR PRODUCTOS LOCALES
  private async loadLocalProducts() {
    try {
      // Intentar cargar desde SQLite primero
      if (this.storageService.isSQLiteAvailable()) {
        console.log('📱 Cargando productos desde SQLite...');
        this.currentStorageType = 'sqlite';
        this.products = await this.storageService.getProducts();
        
        // Si no hay productos en SQLite, cargar datos por defecto
        if (this.products.length === 0) {
          await this.loadDefaultProducts();
        }
        
        this.showToast(`📱 ${this.products.length} productos cargados desde SQLite`, 'success');
      } else {
        // Fallback a localStorage
        console.log('💾 Cargando productos desde localStorage...');
        this.currentStorageType = 'localstorage';
        const userData = this.storageService.getUserData();
        this.products = this.storageService.getUserInventory(userData.id) || [];
        
        // Si no hay productos en localStorage, cargar datos por defecto
        if (this.products.length === 0) {
          this.loadDefaultProductsLocal();
        }
        
        this.showToast(`💾 ${this.products.length} productos cargados desde localStorage`, 'secondary');
      }
    } catch (error) {
      console.error('Error cargando productos locales:', error);
      // Fallback final a localStorage
      this.currentStorageType = 'localstorage';
      const userData = this.storageService.getUserData();
      this.products = this.storageService.getUserInventory(userData.id) || [];
      
      if (this.products.length === 0) {
        this.loadDefaultProductsLocal();
      }
    }
    
    // Guardar una copia en localProducts para uso posterior
    this.localProducts = [...this.products];
    this.filteredProducts = [...this.products];
    this.isLoading = false;
  }

  // Cargar productos por defecto en SQLite
  private async loadDefaultProducts() {
    const defaultProducts = [
      {
        name: 'Monitor LED 24"',
        category: 'Pantallas',
        quantity: 15,
        price: 299.99,
        location: 'Estante A-1',
        description: 'Monitor LED Full HD con tecnología IPS',
        photo: null
      },
      {
        name: 'Teclado Mecánico',
        category: 'Periféricos',
        quantity: 8,
        price: 89.99,
        location: 'Estante B-2',
        description: 'Teclado mecánico RGB con switches azules',
        photo: null
      },
      {
        name: 'Mouse Gaming',
        category: 'Periféricos',
        quantity: 12,
        price: 45.99,
        location: 'Estante B-3',
        description: 'Mouse óptico gaming con DPI ajustable',
        photo: null
      }
    ];

    for (const product of defaultProducts) {
      try {
        await this.storageService.saveProduct(product);
      } catch (error) {
        console.error('Error guardando producto por defecto:', error);
      }
    }

    // Recargar productos después de guardar
    this.products = await this.storageService.getProducts();
  }

  // Cargar productos por defecto en localStorage (fallback)
  private loadDefaultProductsLocal() {
    const userData = this.storageService.getUserData();
    const defaultProducts = [
      {
        id: 1,
        name: 'Monitor LED 24"',
        category: 'Pantallas',
        quantity: 15,
        price: 299.99,
        location: 'Estante A-1',
        description: 'Monitor LED Full HD con tecnología IPS',
        photo: null,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Teclado Mecánico',
        category: 'Periféricos',
        quantity: 8,
        price: 89.99,
        location: 'Estante B-2',
        description: 'Teclado mecánico RGB con switches azules',
        photo: null,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Mouse Gaming',
        category: 'Periféricos',
        quantity: 12,
        price: 45.99,
        location: 'Estante B-3',
        description: 'Mouse óptico gaming con DPI ajustable',
        photo: null,
        lastUpdated: new Date().toISOString()
      }
    ];

    this.storageService.setUserInventory(userData.id, defaultProducts);
    this.products = defaultProducts;
  }

  // 🎲 MÉTODO AUXILIAR PARA CATEGORÍAS ALEATORIAS
  private getRandomCategory(): string {
    const availableCategories = ['Hardware', 'Periféricos', 'Pantallas', 'Accesorios', 'Software'];
    return availableCategories[Math.floor(Math.random() * availableCategories.length)];
  }

  // 🏷️ MAPEAR CATEGORÍAS DE FAKESTORE API A NUESTRAS CATEGORÍAS
  private mapApiCategory(apiCategory: string): string {
    const categoryMap: { [key: string]: string } = {
      'electronics': 'Hardware',
      'jewelery': 'Accesorios',
      'men\'s clothing': 'Accesorios',
      'women\'s clothing': 'Accesorios'
    };
    
    return categoryMap[apiCategory] || 'Hardware';
  }

  // 🔄 MÉTODO PARA CAMBIAR FUENTE DE DATOS
  // Métodos para cambiar entre vista local y mercado
  showLocalProducts() {
    console.log('Cambiando a vista local');
    this.showingMarket = false;
    this.products = this.localProducts || [];
    this.filteredProducts = [...this.products];
    this.applyFilters();
    
    // Toast informativo
    this.showToast(`📱 Mostrando ${this.products.length} productos de tu inventario`, 'primary');
  }

  showMarketProducts() {
    console.log('Cambiando a vista de mercado');
    this.showingMarket = true;
    
    // Toast informativo mientras carga
    this.showToast('🌐 Cargando productos del mercado...', 'secondary');
    
    this.loadProductsFromApi();
  }

  // Getter para información del storage
  get storageInfo() {
    if (this.showingMarket) {
      return {
        icon: 'storefront',
        label: 'Productos del Mercado',
        description: 'Datos desde FakeStore API',
        color: 'secondary'
      };
    } else {
      return this.currentStorageType === 'sqlite' ? {
        icon: 'phone-portrait',
        label: 'Inventario SQLite',
        description: 'Base de datos nativa del dispositivo',
        color: 'success'
      } : {
        icon: 'archive',
        label: 'Inventario LocalStorage',
        description: 'Almacenamiento del navegador',
        color: 'warning'
      };
    }
  }

  // Para compatibilidad, mantener el método toggleDataSource aunque ya no se use
  toggleDataSource() {
    console.log('toggleDataSource() - método deprecated, usar showLocalProducts() o showMarketProducts()');
  }

  // Alias para filterProducts
  applyFilters() {
    this.filterProducts();
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           product.location.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.selectedCategory === 'all' || product.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }

  async addProduct() {
    const alert = await this.alertController.create({
      header: 'Nuevo Producto',
      cssClass: 'glass-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre del producto'
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Categoría'
        },
        {
          name: 'stock',
          type: 'number',
          placeholder: 'Stock inicial'
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Precio unitario'
        },
        {
          name: 'location',
          type: 'text',
          placeholder: 'Ubicación (ej: A-001)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Agregar',
          handler: (data) => {
            if (data.name && data.category && data.stock && data.price && data.location) {
              this.createProduct(data);
              return true;
            } else {
              this.showToast('Por favor, completa todos los campos', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async createProduct(productData: any) {
    try {
      const newProduct = {
        name: productData.name,
        category: productData.category,
        stock: parseInt(productData.stock),
        price: parseFloat(productData.price),
        location: productData.location,
        description: `${productData.name} - ${productData.category}`,
        image_url: null
      };

      if (this.storageService.isSQLiteAvailable()) {
        // Guardar en SQLite
        const productId = await this.storageService.saveProduct(newProduct);
        console.log(`✅ Producto guardado en SQLite con ID: ${productId}`);
        
        // Recargar productos desde SQLite
        await this.loadLocalProducts();
        this.showToast('✅ Producto guardado en SQLite', 'success');
        
        // 📧 Enviar notificación por email
        await this.sendProductNotificationEmail(newProduct);
      } else {
        // Fallback a localStorage
        const productWithId = {
          id: Date.now(),
          ...newProduct,
          quantity: newProduct.stock, // Compatibilidad con formato anterior
          lastUpdated: new Date().toISOString()
        };
        
        this.products.push(productWithId);
        this.saveProductsLocal();
        this.filterProducts();
        this.showToast('💾 Producto guardado en localStorage', 'secondary');
        
        // 📧 Enviar notificación por email
        await this.sendProductNotificationEmail(newProduct);
      }
      
      // Registrar actividad
      this.registerActivity('Producto creado', `${newProduct.name} - ${newProduct.stock} unidades`);
    } catch (error) {
      console.error('Error creando producto:', error);
      this.showToast('❌ Error guardando producto', 'danger');
    }
  }

  // Método para guardar en localStorage (fallback)
  private saveProductsLocal() {
    const userData = this.storageService.getUserData();
    if (userData && userData.id) {
      this.storageService.setUserInventory(userData.id, this.products);
    }
  }

  async editProduct(product: any) {
    const alert = await this.alertController.create({
      header: 'Editar Producto',
      cssClass: 'glass-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre del producto',
          value: product.name
        },
        {
          name: 'category',
          type: 'text',
          placeholder: 'Categoría',
          value: product.category
        },
        {
          name: 'stock',
          type: 'number',
          placeholder: 'Stock',
          value: product.stock
        },
        {
          name: 'price',
          type: 'number',
          placeholder: 'Precio unitario',
          value: product.price
        },
        {
          name: 'location',
          type: 'text',
          placeholder: 'Ubicación',
          value: product.location
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.name && data.category && data.stock !== null && data.price && data.location) {
              this.updateProduct(product.id, data);
              return true;
            } else {
              this.showToast('Por favor, completa todos los campos', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  updateProduct(productId: number, updatedData: any) {
    const index = this.products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const oldStock = this.products[index].stock;
      
      this.products[index] = {
        ...this.products[index],
        name: updatedData.name,
        category: updatedData.category,
        stock: parseInt(updatedData.stock),
        price: parseFloat(updatedData.price),
        location: updatedData.location,
        status: parseInt(updatedData.stock) < 10 ? 'Bajo Stock' : 'Disponible',
        updatedAt: new Date().toISOString()
      };

      this.saveProducts();
      this.filterProducts();
      this.showToast('Producto actualizado exitosamente', 'success');
      
      // Registrar actividad si cambió el stock
      if (oldStock !== parseInt(updatedData.stock)) {
        const difference = parseInt(updatedData.stock) - oldStock;
        const action = difference > 0 ? 'Stock aumentado' : 'Stock reducido';
        this.registerActivity(action, `${this.products[index].name} - ${Math.abs(difference)} unidades`);
      }
    }
  }

  async deleteProduct(product: any) {
    const alert = await this.alertController.create({
      header: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`,
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
            this.removeProduct(product.id);
          }
        }
      ]
    });

    await alert.present();
  }

  removeProduct(productId: number) {
    const productToDelete = this.products.find(p => p.id === productId);
    this.products = this.products.filter(p => p.id !== productId);
    this.saveProducts();
    this.filterProducts();
    
    this.showToast('Producto eliminado exitosamente', 'success');
    
    // Registrar actividad
    if (productToDelete) {
      this.registerActivity('Producto eliminado', `${productToDelete.name}`);
    }
  }

  private async saveProducts() {
    try {
      if (this.storageService.isSQLiteAvailable()) {
        // En SQLite los productos ya se guardan individualmente
        // Este método se mantiene para compatibilidad con localStorage
        console.log('📱 Productos ya guardados en SQLite');
      } else {
        // Fallback a localStorage
        const userData = this.storageService.getUserData();
        this.storageService.setUserInventory(userData.id, this.products);
        console.log('💾 Productos guardados en localStorage');
      }
    } catch (error) {
      console.error('Error guardando productos:', error);
    }
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Disponible': return 'success';
      case 'Bajo Stock': return 'warning';
      case 'Crítico': return 'danger';
      default: return 'medium';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  }

  getLowStockCount(): number {
    return this.filteredProducts.filter(p => p.status === 'Bajo Stock').length;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  getInventoryValue(): number {
    return this.filteredProducts.reduce((total, p) => total + (p.price * p.stock), 0);
  }

  //  FUNCIONALIDADES DE CÁMARA PARA PRODUCTOS
  async addProductPhoto(productId: number) {
    try {
      const photoData = await this.cameraService.showImageOptions();
      
      if (photoData) {
        // Buscar el producto y agregar la foto
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          this.products[productIndex].photo = photoData;
          
          // Guardar en storage
          const userData = this.storageService.getUserData();
          this.storageService.setUserInventory(userData.id, this.products);
          
          // Actualizar vista
          this.filteredProducts = [...this.products];
          
          // Mostrar confirmación
          this.showToast('✅ Foto del producto agregada correctamente', 'success');
        }
      }
    } catch (error) {
      console.error('Error al agregar foto:', error);
      this.showToast('❌ Error al tomar la foto', 'danger');
    }
  }

  async removeProductPhoto(productId: number) {
    const productIndex = this.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      this.products[productIndex].photo = null;
      
      // Guardar en storage
      const userData = this.storageService.getUserData();
      this.storageService.setUserInventory(userData.id, this.products);
      
      // Actualizar vista
      this.filteredProducts = [...this.products];
      
      this.showToast('🗑️ Foto del producto eliminada', 'warning');
    }
  }

  // 🔧 MÉTODOS AUXILIARES QUE FALTABAN
  private generateBarcode(): string {
    return '789' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  }

  // 📧 Método para enviar notificación de nuevo producto por email
  private async sendProductNotificationEmail(product: any) {
    try {
      const userData = this.storageService.getUserData();
      const userName = userData?.fullName || userData?.username || 'Usuario';
      const userEmail = userData?.email || 'no-reply@stockmaster.com';
      
      // Crear mensaje con información del producto
      const productInfo = `
Producto: ${product.name}
Categoría: ${product.category}
Stock: ${product.stock} unidades
Precio: $${product.price}
Ubicación: ${product.location}
Descripción: ${product.description}
      `.trim();
      
      // Enviar email usando el servicio
      const result = await this.emailService.sendAttendanceEmail(
        productInfo,
        userName,
        userEmail
      );
      
      if (result.success) {
        console.log('✅ Notificación de producto enviada por email');
      } else {
        console.warn('⚠️ No se pudo enviar notificación por email:', result.error);
      }
    } catch (error) {
      console.error('❌ Error al enviar notificación por email:', error);
      // No mostramos error al usuario para no interrumpir el flujo
    }
  }
}