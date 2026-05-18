import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private sqliteInitialized = false;

  constructor(private databaseService: DatabaseService) { 
    this.initializeStorage();
  }

  // Inicializar sistema de storage
  private async initializeStorage(): Promise<void> {
    try {
      await this.databaseService.initializeDatabase();
      this.sqliteInitialized = true;
      console.log('✅ Storage inicializado con SQLite');
      
      // Migrar datos existentes de localStorage a SQLite
      await this.migrateFromLocalStorage();
    } catch (error) {
      console.warn('⚠️ SQLite no disponible, usando localStorage como fallback:', error);
      this.sqliteInitialized = false;
    }
  }

  // Migrar datos de localStorage a SQLite
  private async migrateFromLocalStorage(): Promise<void> {
    if (!this.sqliteInitialized) return;

    try {
      // Verificar si ya se migró
      const migrationCompleted = localStorage.getItem('sqlite_migration_completed');
      if (migrationCompleted) {
        console.log('🔄 Migración SQLite ya completada');
        return;
      }

      console.log('🚀 Iniciando migración localStorage → SQLite...');

      const keysToMigrate = [
        'userData', 'authToken', 'appSettings', 'isLoggedIn', 
        'currentUser', 'registeredUsers'
      ];

      for (const key of keysToMigrate) {
        try {
          const localStorageValue = localStorage.getItem(key);
          if (localStorageValue) {
            const parsedValue = JSON.parse(localStorageValue);
            await this.databaseService.setStorageItem(key, parsedValue);
            console.log(`✅ Migrado ${key} a SQLite`);
          }
        } catch (error) {
          console.warn(`⚠️ Error migrando ${key}:`, error);
        }
      }

      // Migrar datos específicos de usuarios (inventarios, categorías, movimientos)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('inventory_') || 
                   key.startsWith('activities_') || 
                   key.startsWith('userInventory_') ||
                   key.startsWith('categories_') ||
                   key.startsWith('movements_'))) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              await this.databaseService.setStorageItem(key, JSON.parse(value));
              console.log(`✅ Migrado dato de usuario: ${key}`);
            }
          } catch (error) {
            console.warn(`⚠️ Error migrando ${key}:`, error);
          }
        }
      }

      // Marcar migración como completada
      localStorage.setItem('sqlite_migration_completed', 'true');
      console.log('🎉 Migración localStorage → SQLite completada');

    } catch (error) {
      console.error('❌ Error durante migración:', error);
    }
  }

  // Guardar datos (SQLite primero, localStorage como fallback)
  async setItem(key: string, value: any): Promise<void> {
    try {
      if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
        await this.databaseService.setStorageItem(key, value);
      } else {
        // Fallback a localStorage
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error guardando datos, intentando localStorage:', error);
      // Fallback en caso de error
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // Recuperar datos (SQLite primero, localStorage como fallback)
  async getItem(key: string): Promise<any> {
    try {
      if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
        const result = await this.databaseService.getStorageItem(key);
        if (result !== null) {
          return result;
        }
      }
      
      // Fallback a localStorage
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error recuperando datos, usando localStorage:', error);
      // Fallback en caso de error
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  }

  // Eliminar un elemento específico
  async removeItem(key: string): Promise<void> {
    try {
      if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
        await this.databaseService.removeStorageItem(key);
      }
      // También eliminar de localStorage para mantener sincronía
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error eliminando datos:', error);
      // Fallback
      localStorage.removeItem(key);
    }
  }

  // Limpiar todo el storage
  async clear(): Promise<void> {
    try {
      if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
        await this.databaseService.clearStorage();
      }
      localStorage.clear();
    } catch (error) {
      console.error('Error limpiando storage:', error);
      localStorage.clear();
    }
  }

  // Verificar si existe una clave
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await this.getItem(key);
      return value !== null;
    } catch (error) {
      return localStorage.getItem(key) !== null;
    }
  }

  // === MÉTODOS SÍNCRONOS PARA COMPATIBILIDAD === //
  // Estos métodos mantienen la compatibilidad con el código existente
  
  setItemSync(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Intentar guardar en SQLite de forma asíncrona
      if (this.sqliteInitialized) {
        this.setItem(key, value).catch(err => 
          console.warn('Error guardando en SQLite:', err)
        );
      }
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  getItemSync(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error recuperando de localStorage:', error);
      return null;
    }
  }

  // Métodos específicos para la aplicación
  
  // Guardar datos del usuario
  setUserData(userData: any): void {
    this.setItemSync('userData', userData);
  }

  // Obtener datos del usuario
  getUserData(): any {
    return this.getItemSync('userData');
  }

  // Guardar token de sesión
  setAuthToken(token: string): void {
    this.setItemSync('authToken', token);
  }

  // Obtener token de sesión
  getAuthToken(): string {
    return this.getItemSync('authToken');
  }

  // Verificar si hay sesión activa
  isLoggedIn(): boolean {
    try {
      const token = this.getAuthToken();
      const userData = this.getUserData();
      const isValid = token && token.length > 0 && userData && userData.id;
      console.log('isLoggedIn check:', { 
        hasToken: !!token, 
        tokenLength: token?.length,
        hasUserData: !!userData, 
        userDataId: userData?.id, 
        isValid 
      });
      return !!isValid;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Guardar datos del inventario del usuario
  setUserInventory(userId: string, inventory: any[]): void {
    this.setItemSync(`inventory_${userId}`, inventory);
  }

  // Obtener inventario del usuario
  getUserInventory(userId: string): any[] {
    return this.getItemSync(`inventory_${userId}`) || [];
  }

  // Guardar actividades del usuario
  setUserActivities(userId: string, activities: any[]): void {
    this.setItemSync(`activities_${userId}`, activities);
  }

  // Obtener actividades del usuario
  getUserActivities(userId: string): any[] {
    return this.getItemSync(`activities_${userId}`) || [];
  }

  // Agregar una nueva actividad al usuario
  addUserActivity(userId: string, activity: any): void {
    const activities = this.getUserActivities(userId);
    activities.unshift(activity);
    
    if (activities.length > 50) {
      activities.splice(50);
    }
    
    this.setUserActivities(userId, activities);
  }

  // Guardar configuraciones de la app
  setAppSettings(settings: any): void {
    this.setItemSync('appSettings', settings);
  }

  // Obtener configuraciones de la app
  getAppSettings(): any {
    return this.getItemSync('appSettings') || {
      theme: 'light',
      notifications: true,
      language: 'es'
    };
  }

  // Cerrar sesión (limpiar datos del usuario)
  async logout(): Promise<void> {
    console.log('🚨 Ejecutando logout completo...');
    // Limpiar datos básicos del usuario
    await this.removeItem('userData');
    await this.removeItem('authToken');
    console.log('🚨 Logout completado');
  }

  // Método para limpiar completamente todo
  clearAllData(): void {
    console.log('🧹 Limpiando todos los datos...');
    this.clear();
    console.log('🧹 Todos los datos eliminados');
  }

  // === MÉTODOS ESPECÍFICOS PARA PRODUCTOS SQLite === //
  
  // Guardar producto en SQLite
  async saveProduct(product: any): Promise<number> {
    if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
      return await this.databaseService.saveProduct(product);
    }
    throw new Error('SQLite no disponible para productos');
  }

  // Obtener productos de SQLite
  async getProducts(): Promise<any[]> {
    if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
      return await this.databaseService.getProducts();
    }
    return [];
  }

  // Actualizar producto en SQLite
  async updateProduct(id: number, product: any): Promise<void> {
    if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
      await this.databaseService.updateProduct(id, product);
    }
  }

  // Eliminar producto de SQLite
  async deleteProduct(id: number): Promise<void> {
    if (this.sqliteInitialized && this.databaseService.isDatabaseReady()) {
      await this.databaseService.deleteProduct(id);
    }
  }

  // Verificar si SQLite está disponible
  isSQLiteAvailable(): boolean {
    return this.sqliteInitialized && this.databaseService.isDatabaseReady();
  }
}