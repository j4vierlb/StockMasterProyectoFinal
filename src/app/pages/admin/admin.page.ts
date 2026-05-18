import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {

  adminData: any;
  registeredUsers: any[] = [];
  allUsers: any[] = [];
  systemStats = {
    totalUsers: 0,
    registeredUsers: 0,
    predefinedUsers: 1
  };

  // 🔧 Debug y información de almacenamiento
  storageInfo = {
    sqliteStatus: 'Verificando...',
    sqliteData: [] as any[],
    localStorageData: [] as any[],
    totalLocalStorageSize: '0 KB'
  };

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    console.log('🔧 Admin Page - ngOnInit ejecutándose');
    console.log('🔧 URL actual:', window.location.href);
    this.loadAdminData();
    this.loadSystemStats();
  }

  loadAdminData() {
    this.adminData = this.storageService.getUserData();
    console.log('Admin data loaded:', this.adminData);
  }

  async loadSystemStats() {
    // Cargar usuarios registrados
    this.registeredUsers = await this.storageService.getItem('registeredUsers') || [];
    
    // Usuarios predefinidos
    const predefinedUsers = ['admin'];
    
    // Combinar todos los usuarios
    this.allUsers = [
      ...predefinedUsers.map(username => ({
        username,
        type: 'predefined',
        name: this.getUserDisplayName(username),
        registrationDate: 'Sistema'
      })),
      ...this.registeredUsers.map(user => ({
        ...user,
        type: 'registered'
      }))
    ];

    // Calcular estadísticas de usuarios únicamente
    this.systemStats.totalUsers = this.allUsers.length;
    this.systemStats.registeredUsers = this.registeredUsers.length;
  }

  getUserDisplayName(username: string): string {
    const names: { [key: string]: string } = {
      'admin': 'Administrador'
    };
    return names[username] || username;
  }

  async deleteUser(user: any) {
    if (user.type === 'predefined') {
      const alert = await this.alertController.create({
        header: 'Acción No Permitida',
        message: 'No se pueden eliminar usuarios predefinidos del sistema.',
        buttons: ['Entendido']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar al usuario "${user.name}" (${user.username})?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.performDeleteUser(user);
          }
        }
      ]
    });
    await alert.present();
  }

  async performDeleteUser(user: any) {
    const loading = await this.loadingController.create({
      message: 'Eliminando usuario...',
      spinner: 'crescent'
    });
    await loading.present();

    // Eliminar usuario de la lista
    const updatedUsers = this.registeredUsers.filter(u => u.username !== user.username);
    this.storageService.setItem('registeredUsers', updatedUsers);
    
    // Eliminar inventario del usuario
    this.storageService.removeItem(`inventory_${user.username}`);
    
    await loading.dismiss();
    
    // Recargar datos
    this.loadSystemStats();
    
    const successAlert = await this.alertController.create({
      header: 'Usuario Eliminado',
      message: `El usuario "${user.name}" ha sido eliminado exitosamente.`,
      buttons: ['OK']
    });
    await successAlert.present();
  }

  async clearAllData() {
    const alert = await this.alertController.create({
      header: '⚠️ PELIGRO',
      message: 'Esta acción eliminará TODOS los usuarios registrados y sus datos asociados. Los usuarios del sistema se mantendrán. ¿Estás absolutamente seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'ELIMINAR TODO',
          role: 'destructive',
          handler: async () => {
            await this.performClearAllData();
          }
        }
      ]
    });
    await alert.present();
  }

  async performClearAllData() {
    const loading = await this.loadingController.create({
      message: 'Limpiando sistema...',
      spinner: 'crescent'
    });
    await loading.present();

    // Limpiar todos los datos excepto la sesión del admin
    const currentAdminData = this.storageService.getUserData();
    const currentToken = this.storageService.getAuthToken();
    
    // Limpiar localStorage
    this.storageService.clear();
    
    // Restaurar sesión del admin
    this.storageService.setUserData(currentAdminData);
    this.storageService.setAuthToken(currentToken);
    
    await loading.dismiss();
    
    // Recargar datos
    this.loadSystemStats();
    
    const successAlert = await this.alertController.create({
      header: 'Usuarios Eliminados',
      message: 'Todos los usuarios registrados han sido eliminados exitosamente. Los usuarios del sistema se mantienen activos.',
      buttons: ['OK']
    });
    await successAlert.present();
  }

  async changeUserRole(user: any) {
    if (user.type === 'predefined') {
      const alert = await this.alertController.create({
        header: 'Acción No Permitida',
        message: 'No se puede cambiar el rol de usuarios predefinidos del sistema.',
        buttons: ['Entendido']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cambiar Rol de Usuario',
      message: `Selecciona el nuevo rol para ${user.name || user.username}:`,
      inputs: [
        {
          name: 'role',
          type: 'radio',
          label: 'Usuario',
          value: 'user',
          checked: user.role === 'user'
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Administrador',
          value: 'admin',
          checked: user.role === 'admin'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cambiar',
          handler: async (data) => {
            if (data && data !== user.role) {
              await this.performRoleChange(user, data);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async performRoleChange(user: any, newRole: string) {
    const loading = await this.loadingController.create({
      message: 'Cambiando rol...'
    });
    await loading.present();

    try {
      // Obtener usuarios registrados
      const registeredUsers = await this.storageService.getItem('registeredUsers') || [];
      
      // Encontrar y actualizar el usuario
      const userIndex = Array.isArray(registeredUsers) ? registeredUsers.findIndex((u: any) => u.id === user.id) : -1;
      if (userIndex !== -1 && Array.isArray(registeredUsers)) {
        registeredUsers[userIndex].role = newRole;
        
        // Guardar cambios
        await this.storageService.setItem('registeredUsers', registeredUsers);
        
        // Recargar datos para reflejar cambios
        this.loadSystemStats();
        
        await loading.dismiss();
        
        const successAlert = await this.alertController.create({
          header: 'Rol Actualizado',
          message: `El rol de ${user.name || user.username} ha sido cambiado a ${this.getRoleDisplayName(newRole)}.`,
          buttons: ['OK']
        });
        await successAlert.present();
      } else {
        await loading.dismiss();
        
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: 'No se pudo encontrar el usuario para actualizar.',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
    } catch (error) {
      await loading.dismiss();
      
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Ocurrió un error al cambiar el rol.',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  private getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'user': 'Usuario',
      'admin': 'Administrador'
    };
    return roleNames[role] || role;
  }

  async logout() {
    await this.storageService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

}
