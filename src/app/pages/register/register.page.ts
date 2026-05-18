import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)], [this.usernameExistsValidator.bind(this)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
      // Rol eliminado - por defecto será 'user'
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Método que se ejecuta cada vez que se entra a la página
  ionViewWillEnter() {
    // Limpiar el formulario cuando se entra a la página
    if (this.registerForm) {
      this.registerForm.reset({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
        // Rol eliminado del reset
      });
      console.log('🔥 Formulario limpiado al entrar a la página de registro');
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

  // Validador personalizado para verificar si el usuario ya existe
  async usernameExistsValidator(control: AbstractControl): Promise<any> {
    if (!control.value) return null;
    
    const existingUsers = await this.storageService.getItem('registeredUsers') || [];
    const userExists = Array.isArray(existingUsers) ? existingUsers.some((user: any) => user.username.toLowerCase() === control.value.toLowerCase()) : false;
    
    return userExists ? { userExists: true } : null;
  }

  // Validador para verificar que las contraseñas coincidan
  passwordMatchValidator(form: AbstractControl): any {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async register() {
    console.log('📝 Iniciando registro...');
    console.log('Formulario válido:', this.registerForm.valid);

    if (this.registerForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Creando cuenta...',
        spinner: 'crescent'
      });
      
      await loading.present();
      
      try {
        const { fullName, username, email, password } = this.registerForm.value;
        
        // Crear datos del nuevo usuario
        const newUser = {
          id: username.toLowerCase(),
          username: username.toLowerCase(),
          name: fullName,
          email: email.toLowerCase(),
          password: password,
          role: 'user',
          registrationDate: new Date().toISOString(),
          loginTime: new Date().toISOString()
        };

        console.log('👤 Nuevo usuario creado:', newUser);
        
        // Obtener usuarios existentes
        let existingUsers;
        try {
          existingUsers = await this.storageService.getItem('registeredUsers') || [];
          console.log('👥 Usuarios existentes obtenidos:', existingUsers.length);
        } catch (error) {
          console.error('❌ Error obteniendo usuarios existentes:', error);
          existingUsers = [];
        }
        
        // Agregar el nuevo usuario
        if (Array.isArray(existingUsers)) {
          existingUsers.push(newUser);
        } else {
          existingUsers = [newUser];
        }
        
        // Guardar la lista actualizada
        await this.storageService.setItem('registeredUsers', existingUsers);
        console.log('✅ Usuario guardado exitosamente');
        
        // Iniciar sesión automáticamente
        this.storageService.setUserData(newUser);
        const token = `token_${username}_${Date.now()}`;
        this.storageService.setAuthToken(token);
        
        // Crear inventario básico
        this.storageService.setUserInventory(newUser.id, []);
        
        await loading.dismiss();
        
        // Mostrar mensaje de éxito
        const alert = await this.alertController.create({
          header: '¡Registro Exitoso!',
          message: `Bienvenido ${fullName}. Tu cuenta ha sido creada exitosamente.`,
          buttons: [{
            text: 'Continuar',
            handler: () => {
              this.registerForm.reset();
              this.router.navigate(['/home']);
            }
          }]
        });
        
        await alert.present();
        
      } catch (error) {
        await loading.dismiss();
        console.error('❌ Error durante el registro:', error);
        
        const errorAlert = await this.alertController.create({
          header: 'Error de Registro',
          message: 'No se pudo crear la cuenta. Por favor, intenta nuevamente.',
          buttons: ['OK']
        });
        
        await errorAlert.present();
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Limpiar formulario manualmente
  clearForm() {
    this.registerForm.reset({
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private async generateInitialInventory(userId: string) {
    try {
      console.log('🎒 Iniciando generación de inventario inicial para:', userId);
      
      // Obtener información del usuario recién registrado
      const userData = this.registerForm.value;
      const userSeed = this.createUserSeed(userData);
      const userHash = this.hashString(userSeed);
      
      console.log(`🔥 Generando inventario para ${userData.fullName}:`, { userId, userSeed, userHash });
    
    // Amplio pool de productos únicos por rol
    const productsByRole: { [key: string]: any[] } = {
      'admin': [
        { name: 'MacBook Pro M3', category: 'Laptops Premium', basePrice: 2400, code: 'MBP', brands: ['Apple', 'Premium'] },
        { name: 'iMac 24" M3', category: 'Computadoras All-in-One', basePrice: 1800, code: 'IMC', brands: ['Apple', 'Studio'] },
        { name: 'Monitor LG UltraWide 34"', category: 'Pantallas Premium', basePrice: 650, code: 'UWM', brands: ['LG', 'Samsung', 'Dell'] },
        { name: 'iPhone 15 Pro Max', category: 'Smartphones Premium', basePrice: 1299, code: 'IPH', brands: ['Apple', 'Pro'] },
        { name: 'iPad Pro 12.9 M2', category: 'Tablets Pro', basePrice: 1199, code: 'IPD', brands: ['Apple', 'Microsoft'] },
        { name: 'AirPods Pro 2', category: 'Audio Premium', basePrice: 279, code: 'APD', brands: ['Apple', 'Bose', 'Sony'] },
        { name: 'Magic Keyboard Pro', category: 'Accesorios Premium', basePrice: 199, code: 'MKB', brands: ['Apple', 'Logitech'] },
        { name: 'Apple Studio Display', category: 'Monitores 5K', basePrice: 1799, code: 'ASD', brands: ['Apple', 'ASUS'] },
        { name: 'Mac Studio M2', category: 'Workstation', basePrice: 2199, code: 'MST', brands: ['Apple', 'HP'] },
        { name: 'Pro Display XDR', category: 'Monitores Profesionales', basePrice: 4999, code: 'PDX', brands: ['Apple', 'EIZO'] }
      ],
      'user': [
        { name: 'Laptop Dell XPS 15', category: 'Laptops Ejecutivas', basePrice: 1600, code: 'XPS', brands: ['Dell', 'HP', 'Lenovo'] },
        { name: 'ThinkPad X1 Carbon', category: 'Ultrabooks', basePrice: 1800, code: 'TP1', brands: ['Lenovo', 'HP', 'ASUS'] },
        { name: 'Monitor Dell 27" 4K', category: 'Monitores 4K', basePrice: 380, code: 'D27', brands: ['Dell', 'ASUS', 'Acer'] },
        { name: 'Samsung Galaxy S24', category: 'Smartphones', basePrice: 899, code: 'SGS', brands: ['Samsung', 'Google', 'OnePlus'] },
        { name: 'Surface Pro 9', category: 'Tablets 2-en-1', basePrice: 1099, code: 'SP9', brands: ['Microsoft', 'Samsung'] },
        { name: 'Sony WH-1000XM5', category: 'Audífonos Premium', basePrice: 399, code: 'SWH', brands: ['Sony', 'Bose', 'Sennheiser'] },
        { name: 'Logitech MX Master 3S', category: 'Mouse Profesional', basePrice: 99, code: 'LMX', brands: ['Logitech', 'Razer'] },
        { name: 'Webcam Logitech Brio 4K', category: 'Cámaras Profesionales', basePrice: 199, code: 'WLB', brands: ['Logitech', 'Razer'] },
        { name: 'Impresora HP LaserJet Pro', category: 'Impresoras Láser', basePrice: 279, code: 'HLJ', brands: ['HP', 'Canon', 'Brother'] },
        { name: 'PC HP Pavilion', category: 'Computadoras Desktop', basePrice: 699, code: 'HPP', brands: ['HP', 'Dell', 'Acer'] },
        { name: 'Laptop ASUS VivoBook', category: 'Laptops Básicas', basePrice: 549, code: 'AVB', brands: ['ASUS', 'HP', 'Acer'] },
        { name: 'Monitor ASUS 24" Full HD', category: 'Monitores Estándar', basePrice: 179, code: 'A24', brands: ['ASUS', 'AOC', 'LG'] },
        { name: 'Teclado Logitech K120', category: 'Teclados Básicos', basePrice: 25, code: 'LK1', brands: ['Logitech', 'HP', 'Dell'] },
        { name: 'Mouse Óptico HP', category: 'Mouse Básico', basePrice: 15, code: 'MHP', brands: ['HP', 'Dell', 'Logitech'] },
        { name: 'Auriculares JBL T110', category: 'Audio Básico', basePrice: 29, code: 'JBL', brands: ['JBL', 'Sony', 'Panasonic'] },
        { name: 'Carpeta Archivador', category: 'Suministros Oficina', basePrice: 12, code: 'CAR', brands: ['Office', 'Staples'] },
        { name: 'Resma Papel A4', category: 'Papelería', basePrice: 8, code: 'RPA', brands: ['Navigator', 'HP'] },
        { name: 'Grapadora Metálica', category: 'Herramientas Oficina', basePrice: 18, code: 'GRM', brands: ['Staplex', 'Bostitch'] }
      ]
    };

    // Obtener plantillas según el rol
    const role = userData.role || 'user';
    const templates = productsByRole[role] || productsByRole['user'];
    
    // Crear códigos únicos basados en el nombre completo del usuario
    const nameParts = userData.fullName.split(' ').filter((part: string) => part.length > 0);
    const userInitials = nameParts.map((part: string) => part.charAt(0).toUpperCase()).join('').substring(0, 3);
    const nameHash = userData.fullName.toLowerCase().replace(/\s/g, '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    
    // Generar número variable de productos según el rol y usuario
    const baseProducts = role === 'admin' ? 7 : 4;
    const numProducts = baseProducts + ((userHash + nameHash) % 4); // Variación extra por usuario
    
    const selectedProducts = [];
    const usedTemplates = new Set();
    
    for (let i = 0; i < numProducts && i < templates.length * 2; i++) {
      // Seleccionar template de forma más diversa
      const templateIndex = (userHash + nameHash + i * 13) % templates.length;
      const template = templates[templateIndex];
      
      // Evitar productos duplicados exactos
      const productKey = `${template.name}_${i}`;
      if (usedTemplates.has(productKey)) continue;
      usedTemplates.add(productKey);
      
      // Crear variaciones más únicas
      const brandVariation = (userHash + i * 7) % template.brands.length;
      const selectedBrand = template.brands[brandVariation];
      const modelNumber = ((userHash + nameHash + i * 11) % 999) + 1;
      const yearVariation = 2021 + ((userHash + i * 3) % 4); // 2021-2024
      
      const priceVariation = ((userHash + nameHash + i * 17) % 300) - 150; // ±150
      const stockVariation = Math.max(1, (userHash + nameHash + i * 23) % (role === 'admin' ? 100 : 50));
      
      selectedProducts.push({
        id: i + 1,
        name: `${selectedBrand} ${template.name} ${modelNumber}${userInitials}`,
        category: template.category,
        code: `${template.code}-${userInitials}${modelNumber.toString().padStart(3, '0')}`,
        stock: stockVariation,
        price: Math.max(template.basePrice * 0.5, template.basePrice + priceVariation),
        location: `${String.fromCharCode(65 + ((userHash + nameHash + i) % 10))}-${((userHash + i * 5) % 999 + 1).toString().padStart(3, '0')}`,
        status: stockVariation < 5 ? 'Crítico' : stockVariation < 15 ? 'Bajo Stock' : 'Disponible',
        year: yearVariation,
        supplier: selectedBrand
      });
    }
    
    this.storageService.setUserInventory(userId, selectedProducts);
    
    // Generar actividades recientes únicas para el usuario
    await this.generateInitialActivities(userId, selectedProducts);
    
    console.log(`✅ Inventario único generado para ${userData.fullName} (${role}):`, selectedProducts);
    
    } catch (error) {
      console.error('❌ Error generando inventario inicial:', error);
      // Si falla, al menos intentar crear un inventario básico
      try {
        this.storageService.setUserInventory(userId, []);
        console.log('🔄 Inventario vacío creado como fallback');
      } catch (fallbackError) {
        console.error('❌ Error crítico creando inventario fallback:', fallbackError);
      }
    }
  }
  
  private async generateInitialActivities(userId: string, inventory: any[]) {
    try {
      const userData = this.registerForm.value;
      const userSeed = this.createUserSeed(userData);
      const userHash = this.hashString(userSeed);
      const role = userData.role || 'user';
      
      console.log(`🔥 Generando actividades para ${userData.fullName}:`, { role, userHash });
    
    // Actividades específicas por rol
    const activityTypesByRole: { [key: string]: any[] } = {
      'admin': [
        { action: 'Sistema configurado', icon: 'settings', color: 'primary' },
        { action: 'Inventario importado', icon: 'cloud-download', color: 'success' },
        { action: 'Usuario creado', icon: 'person-add', color: 'tertiary' },
        { action: 'Respaldo generado', icon: 'archive', color: 'medium' }
      ],
      'user': [
        { action: 'Entrada de stock', icon: 'arrow-down-circle', color: 'success' },
        { action: 'Aprobación realizada', icon: 'checkmark-circle', color: 'primary' },
        { action: 'Reporte generado', icon: 'document-text', color: 'tertiary' },
        { action: 'Inventario revisado', icon: 'eye', color: 'medium' },
        { action: 'Producto registrado', icon: 'add-circle', color: 'primary' },
        { action: 'Stock actualizado', icon: 'create', color: 'warning' },
        { action: 'Salida registrada', icon: 'arrow-up-circle', color: 'danger' },
        { action: 'Etiqueta impresa', icon: 'print', color: 'medium' }
      ]
    };
    
    const timeOptions = [
      'Hace 30 minutos', 
      'Hace 2 horas', 
      'Hace 4 horas', 
      'Ayer por la mañana', 
      'Hace 2 días'
    ];
    
    const activityTypes = activityTypesByRole[role] || activityTypesByRole['user'];
    const activities = [];
    const numActivities = role === 'admin' ? 4 + (userHash % 2) : 3 + (userHash % 3);
    
    for (let i = 0; i < numActivities; i++) {
      const product = inventory[i % inventory.length];
      const activityType = activityTypes[i % activityTypes.length];
      
      activities.push({
        action: activityType.action,
        product: product.name,
        quantity: role === 'admin' ? Math.max(5, (userHash + i * 3) % 20) : Math.max(1, (userHash + i * 5) % 15),
        time: timeOptions[(userHash + i * 2) % timeOptions.length],
        icon: activityType.icon,
        color: activityType.color
      });
    }
    
    this.storageService.setUserActivities(userId, activities);
    console.log(`✅ Actividades únicas generadas para ${userData.fullName} (${role}):`, activities);
    
    } catch (error) {
      console.error('❌ Error generando actividades iniciales:', error);
      // Si falla, crear actividades básicas
      try {
        this.storageService.setUserActivities(userId, []);
        console.log('🔄 Actividades vacías creadas como fallback');
      } catch (fallbackError) {
        console.error('❌ Error crítico creando actividades fallback:', fallbackError);
      }
    }
  }
  
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    
    // Agregar más entropía basada en la longitud y contenido
    hash += str.length * 31;
    hash += str.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
    
    return Math.abs(hash);
  }

  private createUserSeed(userData: any): string {
    // Crear una semilla única combinando múltiples campos del usuario
    return `${userData.fullName}_${userData.username}_${userData.email}_${userData.role}_${Date.now()}`;
  }
}