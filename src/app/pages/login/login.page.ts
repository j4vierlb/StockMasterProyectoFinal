import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit, OnDestroy {
  
  loginForm!: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private storageService: StorageService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  ionViewWillEnter() {
    // Limpiar el formulario cada vez que se entra a la página
    this.clearLoginForm();
    
    // Verificar si ya hay sesión activa
    if (this.storageService.isLoggedIn()) {
      const userData = this.storageService.getUserData();
      if (userData?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
      return;
    }

    // 📱 Configurar comportamiento del teclado para Android
    this.setupKeyboardBehavior();
  }

  ngOnDestroy() {
    // Limpiar listeners del teclado si existen
  }

  // 📱 OPTIMIZACIÓN DEL TECLADO PARA ANDROID
  private async setupKeyboardBehavior() {
    try {
      // Configurar el teclado para que se superponga (mejor experiencia)
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      await Keyboard.setScroll({ isDisabled: false });
    } catch (error) {
      console.log('Keyboard API no disponible:', error);
    }
  }

  private initializeForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [false]
    });
  }

  // Método para limpiar el formulario de login
  private clearLoginForm() {
    if (this.loginForm) {
      this.loginForm.reset({
        username: '',
        password: '',
        rememberMe: false
      });
      // También limpiar cualquier estado de validación
      this.loginForm.markAsUntouched();
      this.loginForm.markAsPristine();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Iniciando sesión...',
        duration: 2000
      });
      await loading.present();

      this.isLoading = true;

      // Simular delay de autenticación
      setTimeout(async () => {
        await this.processLogin();
        await loading.dismiss();
        this.isLoading = false;
      }, 1500);
    } else {
      this.markFormGroupTouched();
    }
  }

  private async processLogin() {
    const { username, password } = this.loginForm.value;
    
    // Limpiar espacios en blanco
    const cleanUsername = username?.trim();
    const cleanPassword = password?.trim();
    
    console.log('🔐 Datos de login:', { cleanUsername, cleanPassword });
    
    // Usuarios predefinidos del sistema
    const validUsers: { [key: string]: string } = {
      'admin': 'admin123'
    };
    
    console.log('🔐 Usuarios válidos:', validUsers);
    
    // Obtener usuarios registrados desde localStorage (CORREGIDO: usar await)
    const registeredUsers = await this.storageService.getItem('registeredUsers') || [];
    const registeredUser = Array.isArray(registeredUsers) ? registeredUsers.find((user: any) => 
      user.username.toLowerCase() === cleanUsername.toLowerCase() && user.password === cleanPassword
    ) : null;
    
    console.log('🔐 Usuarios registrados:', registeredUsers);
    console.log('🔐 Usuario registrado encontrado:', registeredUser);
    
    // Verificar si es usuario predefinido
    const isValidPredefinedUser = validUsers[cleanUsername.toLowerCase()] && 
                                 validUsers[cleanUsername.toLowerCase()] === cleanPassword;
    
    console.log('🔐 Es usuario predefinido válido:', isValidPredefinedUser);
    
    // Si no es usuario predefinido ni registrado, mostrar error
    if (!isValidPredefinedUser && !registeredUser) {
      // Limpiar contraseña por seguridad en caso de error
      this.loginForm.patchValue({ password: '' });
      
      const alert = await this.alertController.create({
        header: '❌ Error de Autenticación',
        message: 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.',
        buttons: ['Intentar de nuevo']
      });
      await alert.present();
      return;
    }
    
    // Crear datos del usuario
    let userData;
    
    if (registeredUser) {
      // Si es usuario registrado, usar sus datos
      userData = {
        ...registeredUser,
        loginTime: new Date().toISOString()
      };
    } else {
      // Si es usuario predefinido, crear perfil personalizado
      userData = this.createUserProfile(cleanUsername);
    }
    
    try {
      // Guardar datos del usuario y token
      this.storageService.setUserData(userData);
      const token = `token_${username}_${Date.now()}`;
      this.storageService.setAuthToken(token);
      
      // Generar inventario específico para el usuario
      this.generateUserData(userData);
      
      // Limpiar formulario después del login exitoso
      this.clearLoginForm();
      
      // Mostrar mensaje de éxito
      const successAlert = await this.alertController.create({
        header: '✅ ¡Bienvenido!',
        message: `Hola ${userData.name}, sesión iniciada correctamente.`,
        buttons: ['Continuar']
      });
      await successAlert.present();
      
      // Redirigir según el rol
      setTimeout(() => {
        if (userData.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error guardando en storage:', error);
      const errorAlert = await this.alertController.create({
        header: '❌ Error del Sistema',
        message: 'Ocurrió un error interno. Por favor, inténtalo de nuevo.',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  private createUserProfile(username: string): any {
    const profiles: { [key: string]: any } = {
      'admin': {
        id: 'admin',
        username: 'admin',
        name: 'Administrador General',
        email: 'admin@stockmaster.com',
        role: 'admin',
        loginTime: new Date().toISOString()
      }
    };
    
    return profiles[username.toLowerCase()] || {
      id: `user_${Date.now()}`,
      username: username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      email: `${username}@example.com`,
      role: 'user',
      loginTime: new Date().toISOString()
    };
  }

  private generateUserData(userData: any) {
    const userId = userData.id;
    
    // Verificar si ya tiene inventario
    const existingInventory = this.storageService.getUserInventory(userId);
    if (!existingInventory || existingInventory.length === 0) {
      this.generateUserInventory(userId, userData.role);
    }
    
    // Verificar si ya tiene actividades
    const existingActivities = this.storageService.getUserActivities(userId);
    if (!existingActivities || existingActivities.length === 0) {
      this.generateUserActivities(userId);
    }
  }

  private generateUserInventory(userId: string, userRole: string) {
    const inventories: { [key: string]: any[] } = {
      'admin': [
        { id: 1, name: 'Laptop HP EliteBook Admin', category: 'Electrónicos', quantity: 25, price: 1500 },
        { id: 2, name: 'Mouse Logitech MX Master', category: 'Accesorios', quantity: 50, price: 80 },
        { id: 3, name: 'Teclado Mecánico Corsair', category: 'Accesorios', quantity: 30, price: 150 },
        { id: 4, name: 'Monitor Dell 4K 27"', category: 'Electrónicos', quantity: 15, price: 400 }
      ]
    };
    
    const inventory = inventories[userRole] || this.generateRandomInventory();
    this.storageService.setUserInventory(userId, inventory);
  }

  private generateRandomInventory(): any[] {
    const products = [
      'Laptop Samsung Galaxy Book',
      'Mouse Inalámbrico Logitech',
      'Teclado Bluetooth Apple',
      'Monitor LG UltraWide',
      'Auriculares Sony WH-1000XM4'
    ];
    
    return products.map((product, index) => ({
      id: index + 1,
      name: product,
      category: index < 2 ? 'Electrónicos' : 'Accesorios',
      quantity: Math.floor(Math.random() * 50) + 10,
      price: Math.floor(Math.random() * 800) + 200
    }));
  }

  private generateUserActivities(userId: string) {
    const activities = [
      { id: 1, action: 'Inició sesión', product: 'Sistema', timestamp: new Date().toISOString() },
      { id: 2, action: 'Inventario cargado', product: 'Base de datos', timestamp: new Date(Date.now() - 60000).toISOString() }
    ];
    
    this.storageService.setUserActivities(userId, activities);
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToResetPassword() {
    this.router.navigate(['/reset-password']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
