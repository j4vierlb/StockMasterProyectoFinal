import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
  standalone: false
})
export class LoginFormComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      remember: [false]
    });
    console.log('🔥 LoginFormComponent inicializado');
    console.log('🔥 Formulario creado:', this.loginForm);
  }

  async login() {
    console.log('🔥 Método login() llamado desde componente');
    console.log('🔥 Formulario válido:', this.loginForm.valid);
    console.log('🔥 Valores del formulario:', this.loginForm.value);
    
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Iniciando sesión...',
        spinner: 'crescent'
      });
      
      await loading.present();
      
      setTimeout(async () => {
        await loading.dismiss();
        
        const { username, password } = this.loginForm.value;
        console.log('🔥 Datos extraídos:', { username, password });
        
        // Usuarios predefinidos del sistema
        const validUsers: { [key: string]: string } = {
          'admin': 'admin123'
        };
        
        // Obtener usuarios registrados desde localStorage
        const registeredUsers = await this.storageService.getItem('registeredUsers') || [];
        const registeredUser = Array.isArray(registeredUsers) ? registeredUsers.find((user: any) => 
          user.username.toLowerCase() === username.toLowerCase() && user.password === password
        ) : null;
        
        // Verificar si es usuario predefinido
        const isValidPredefinedUser = validUsers[username.toLowerCase()] && validUsers[username.toLowerCase()] === password;
        
        // Si no es usuario predefinido ni registrado, mostrar error
        if (!isValidPredefinedUser && !registeredUser) {
          console.log('🔥 Usuario no encontrado - predefinido:', !!isValidPredefinedUser, 'registrado:', !!registeredUser);
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Usuario o contraseña incorrectos.',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        
        console.log('🔥 Usuario válido encontrado - predefinido:', !!isValidPredefinedUser, 'registrado:', !!registeredUser);
        
        // Crear datos personalizados para cada usuario
        console.log('🔥 Creando perfil para usuario:', username);
        let userData;
        
        if (registeredUser) {
          // Si es usuario registrado, usar sus datos
          userData = {
            ...registeredUser,
            loginTime: new Date().toISOString()
          };
          console.log('🔥 Usando datos de usuario registrado:', userData);
        } else {
          // Si es usuario predefinido, crear perfil personalizado
          userData = this.createUserProfile(username);
          console.log('🔥 Datos de usuario predefinido creados:', userData);
        }
        
        if (!userData || !userData.id) {
          console.error('🔥 Error: no se pudieron crear los datos del usuario');
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Error interno. Inténtalo de nuevo.',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
        
        try {
          // Guardar datos del usuario y token
          this.storageService.setUserData(userData);
          const token = `token_${username}_${Date.now()}`;
          this.storageService.setAuthToken(token);
          console.log('🔥 Datos y token guardados en storage');
          
          // Verificar que se guardó correctamente
          const savedUser = this.storageService.getUserData();
          const savedToken = this.storageService.getAuthToken();
          console.log('🔥 Verificación guardado:', { savedUser, savedToken });
          
          // Generar inventario y configuraciones específicas para el usuario
          if (registeredUser) {
            // Para usuarios registrados, verificar si ya tienen inventario
            const existingInventory = this.storageService.getUserInventory(userData.id);
            if (!existingInventory || existingInventory.length === 0) {
              this.generateDefaultInventoryForRegisteredUser(userData.id, userData.role);
              console.log('🔥 Inventario por defecto generado para usuario registrado:', userData.name);
            } else {
              console.log('🔥 Usuario registrado ya tiene inventario:', userData.name);
            }
          } else {
            // Para usuarios predefinidos, usar inventario específico
            this.generateUserSpecificInventory(userData.id);
            console.log('🔥 Inventario específico generado para usuario predefinido:', userData.name);
          }
          
        } catch (error) {
          console.error('🔥 Error guardando en storage:', error);
          return;
        }
        
        // Esperar un poco más para asegurar que el storage esté actualizado
        setTimeout(() => {
          console.log('🔥 Verificando rol para navegación...');
          if (userData.role === 'admin') {
            console.log('🔥 ADMIN DETECTADO - navegando a /admin');
            this.router.navigate(['/admin']).then(success => {
              console.log('🔥 Navegación a /admin resultado:', success);
            });
          } else {
            console.log('🔥 USUARIO NORMAL - navegando a /home');
            this.router.navigate(['/home']).then(success => {
              console.log('🔥 Navegación a /home resultado:', success);
            });
          }
        }, 100); // Pequeña pausa para asegurar que el storage esté listo
      }, 1500);
    } else {
      console.log('🔥 Formulario NO es válido');
      console.log('🔥 Errores del formulario:', this.loginForm.errors);
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        console.log(`🔥 ${key}:`, control?.value, 'válido:', control?.valid, 'errores:', control?.errors);
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  navigateToResetPassword() {
    this.router.navigate(['/reset-password']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  // Crear perfil personalizado para cada usuario
  private createUserProfile(username: string): any {
    console.log('🔥 createUserProfile llamado con username:', username);
    const profiles: { [key: string]: any } = {
      'admin': {
        id: 'admin',
        username: 'admin',
        name: 'Administrador General',
        email: 'admin@stockmaster.com',
        role: 'admin',
        department: 'Administración',
        position: 'Administrador del Sistema',
        phone: '+1 555-0100',
        avatar: 'assets/avatars/admin.png',
        permissions: ['read', 'write', 'delete', 'admin'],
        preferences: {
          theme: 'dark',
          language: 'es',
          notifications: true,
          dashboard: 'advanced'
        },
        stats: {
          loginCount: 0,
          lastLogin: new Date().toISOString(),
          totalInventoryValue: 0
        }
      }
    };

    const userProfile = profiles[username.toLowerCase()];
    console.log('🔥 Perfil encontrado para', username, ':', !!userProfile);
    
    if (userProfile) {
      // Actualizar estadísticas de login
      userProfile.stats.loginCount += 1;
      userProfile.stats.lastLogin = new Date().toISOString();
      userProfile.loginTime = new Date().toISOString();
      
      console.log('🔥 Perfil personalizado creado:', userProfile);
      return userProfile;
    } else {
      // Usuario por defecto si no está en los perfiles
      console.log('🔥 Usando perfil por defecto para:', username);
      const defaultProfile = {
        id: username,
        username: username,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        email: `${username}@stockmaster.com`,
        role: 'user',
        department: 'General',
        position: 'Usuario',
        loginTime: new Date().toISOString()
      };
      console.log('🔥 Perfil por defecto creado:', defaultProfile);
      return defaultProfile;
    }
  }

  // Generar inventario específico para cada usuario
  private generateUserSpecificInventory(userId: string): void {
    const inventories: { [key: string]: any[] } = {
      'admin': [
        { id: 1, name: 'Laptop Dell XPS 15', category: 'Electrónicos', stock: 15, price: 1250.99, location: 'A-001', status: 'Disponible' },
        { id: 2, name: 'Mouse Inalámbrico Logitech', category: 'Accesorios', stock: 50, price: 35.99, location: 'B-012', status: 'Disponible' },
        { id: 3, name: 'Monitor 4K 27"', category: 'Pantallas', stock: 8, price: 399.99, location: 'A-015', status: 'Bajo Stock' },
        { id: 4, name: 'Servidor HP ProLiant', category: 'Hardware', stock: 3, price: 2500.00, location: 'C-001', status: 'Crítico' },
        { id: 5, name: 'Switch Cisco 24 Puertos', category: 'Red', stock: 6, price: 450.00, location: 'C-005', status: 'Disponible' }
      ]
    };
    
    const userInventory = inventories[userId] || [];
    this.storageService.setUserInventory(userId, userInventory);
    
    // Guardar configuraciones adicionales específicas del usuario
    const userConfig = {
      userId: userId,
      workspace: `workspace_${userId}`,
      lastAccess: new Date().toISOString(),
      customSettings: this.getUserCustomSettings(userId)
    };
    
    this.storageService.setItem(`userConfig_${userId}`, userConfig);
  }

  private getUserCustomSettings(userId: string): any {
    const settings: { [key: string]: any } = {
      'admin': {
        showAdvancedMetrics: true,
        autoBackup: true,
        reportFrequency: 'daily',
        alertThreshold: 5
      }
    };
    
    return settings[userId] || {};
  }

  // Generar inventario por defecto para usuarios registrados
  private generateDefaultInventoryForRegisteredUser(userId: string, role: string): void {
    let defaultInventory: any[] = [];
    
    if (role === 'admin') {
      // Inventario para administradores registrados
      defaultInventory = [
        { id: 1, name: 'Laptop HP Pavilion', category: 'Electrónicos', stock: 10, price: 899.99, location: 'A-001', status: 'Disponible' },
        { id: 2, name: 'Mouse Óptico', category: 'Accesorios', stock: 25, price: 19.99, location: 'B-010', status: 'Disponible' },
        { id: 3, name: 'Monitor LED 22"', category: 'Pantallas', stock: 5, price: 179.99, location: 'A-010', status: 'Bajo Stock' },
        { id: 4, name: 'Teclado Inalámbrico', category: 'Accesorios', stock: 15, price: 45.99, location: 'B-015', status: 'Disponible' }
      ];
    } else {
      // Inventario para usuarios registrados
      defaultInventory = [
        { id: 1, name: 'Cuaderno A4', category: 'Oficina', stock: 50, price: 5.99, location: 'C-001', status: 'Disponible' },
        { id: 2, name: 'Bolígrafo Azul', category: 'Oficina', stock: 100, price: 1.50, location: 'C-005', status: 'Disponible' },
        { id: 3, name: 'Archivador', category: 'Oficina', stock: 20, price: 12.99, location: 'C-010', status: 'Disponible' },
        { id: 4, name: 'Grapadora', category: 'Oficina', stock: 8, price: 15.99, location: 'C-015', status: 'Disponible' }
      ];
    }
    
    this.storageService.setUserInventory(userId, defaultInventory);
    console.log('🔥 Inventario por defecto creado para usuario registrado:', userId, 'rol:', role);
  }
}
