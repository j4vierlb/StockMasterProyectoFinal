import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.css'],
  standalone: false,
})
export class CategoriesPage implements OnInit {

  categories: any[] = [];
  isLoading: boolean = false;
  
  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    this.loadCategories();
  }

  ionViewWillEnter() {
    this.loadCategories();
  }

  async loadCategories() {
    this.isLoading = true;
    const userData = this.storageService.getUserData();
    
    // Cargar categorías del usuario o crear categorías por defecto
    let userCategories = await this.storageService.getItem(`categories_${userData.id}`);
    
    if (!userCategories || (Array.isArray(userCategories) && userCategories.length === 0)) {
      // Crear categorías por defecto
      userCategories = [
        {
          id: 1,
          name: 'Hardware',
          description: 'Componentes de hardware y equipos informáticos',
          color: 'primary',
          productCount: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Periféricos',
          description: 'Dispositivos de entrada y salida',
          color: 'secondary',
          productCount: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Pantallas',
          description: 'Monitores y dispositivos de visualización',
          color: 'tertiary',
          productCount: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Accesorios',
          description: 'Cables, adaptadores y accesorios diversos',
          color: 'success',
          productCount: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Software',
          description: 'Licencias y productos de software',
          color: 'warning',
          productCount: 0,
          createdAt: new Date().toISOString()
        }
      ];
      
      await this.storageService.setItem(`categories_${userData.id}`, userCategories);
    }
    
    // Actualizar conteo de productos por categoría
    if (Array.isArray(userCategories)) {
      this.updateProductCounts(userCategories, userData.id);
      this.categories = userCategories;
    } else {
      this.categories = [];
    }
    this.isLoading = false;
  }

  updateProductCounts(categories: any[], userId: string) {
    const products = this.storageService.getUserInventory(userId);
    
    categories.forEach(category => {
      category.productCount = products.filter(product => 
        product.category === category.name
      ).length;
    });
  }

  async addCategory() {
    const alert = await this.alertController.create({
      header: 'Nueva Categoría',
      cssClass: 'glass-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la categoría'
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Descripción (opcional)'
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
            if (data.name && data.name.trim()) {
              this.createCategory(data);
              return true;
            } else {
              this.showToast('Por favor, ingresa un nombre para la categoría', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  createCategory(categoryData: any) {
    const colors = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'danger'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCategory = {
      id: Date.now(),
      name: categoryData.name.trim(),
      description: categoryData.description || '',
      color: randomColor,
      productCount: 0,
      createdAt: new Date().toISOString()
    };

    this.categories.push(newCategory);
    this.saveCategories();
    
    this.showToast('Categoría creada exitosamente', 'success');
    
    // Registrar actividad
    this.registerActivity('Categoría creada', `${newCategory.name}`);
  }

  async editCategory(category: any) {
    const alert = await this.alertController.create({
      header: 'Editar Categoría',
      cssClass: 'glass-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la categoría',
          value: category.name
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Descripción',
          value: category.description
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
            if (data.name && data.name.trim()) {
              this.updateCategory(category.id, data);
              return true;
            } else {
              this.showToast('Por favor, ingresa un nombre para la categoría', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  updateCategory(categoryId: number, updatedData: any) {
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      const oldName = this.categories[index].name;
      
      this.categories[index] = {
        ...this.categories[index],
        name: updatedData.name.trim(),
        description: updatedData.description || '',
        updatedAt: new Date().toISOString()
      };

      // Si cambió el nombre, actualizar productos que usan esta categoría
      if (oldName !== updatedData.name.trim()) {
        this.updateProductsCategory(oldName, updatedData.name.trim());
      }

      this.saveCategories();
      this.showToast('Categoría actualizada exitosamente', 'success');
      
      // Registrar actividad
      this.registerActivity('Categoría actualizada', `${this.categories[index].name}`);
    }
  }

  async deleteCategory(category: any) {
    if (category.productCount > 0) {
      this.showToast('No se puede eliminar una categoría que tiene productos asignados', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar Categoría',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
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
            this.removeCategory(category.id);
          }
        }
      ]
    });

    await alert.present();
  }

  removeCategory(categoryId: number) {
    const categoryToDelete = this.categories.find(c => c.id === categoryId);
    this.categories = this.categories.filter(c => c.id !== categoryId);
    this.saveCategories();
    
    this.showToast('Categoría eliminada exitosamente', 'success');
    
    // Registrar actividad
    if (categoryToDelete) {
      this.registerActivity('Categoría eliminada', `${categoryToDelete.name}`);
    }
  }

  updateProductsCategory(oldCategory: string, newCategory: string) {
    const userData = this.storageService.getUserData();
    const products = this.storageService.getUserInventory(userData.id);
    
    const updatedProducts = products.map(product => {
      if (product.category === oldCategory) {
        return { ...product, category: newCategory };
      }
      return product;
    });
    
    this.storageService.setUserInventory(userData.id, updatedProducts);
  }

  viewCategoryProducts(category: any) {
    // Navegar a productos filtrado por esta categoría
    this.router.navigate(['/products'], { queryParams: { category: category.name } });
  }

  private saveCategories() {
    const userData = this.storageService.getUserData();
    this.storageService.setItem(`categories_${userData.id}`, this.categories);
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

  goBack() {
    this.router.navigate(['/home']);
  }

  getTotalProducts(): number {
    return this.categories.reduce((total, c) => total + c.productCount, 0);
  }

  getCategoriesWithProducts(): number {
    return this.categories.filter(c => c.productCount > 0).length;
  }
}