import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private dbName = 'stockmaster.db';
  private isDbOpen = false;
  private platform: string = '';

  constructor() {
    this.platform = Capacitor.getPlatform();
  }

  // Inicializar base de datos
  async initializeDatabase(): Promise<void> {
    try {
      if (this.platform === 'web') {
        // Para web, usar jeep-sqlite
        await this.initWebStore();
      }

      // Crear conexión
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        );
      }

      // Abrir base de datos
      await this.db.open();
      this.isDbOpen = true;

      // Crear tablas
      await this.createTables();
      
      console.log('✅ Base de datos SQLite inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }

  // Inicializar store para web
  private async initWebStore(): Promise<void> {
    try {
      await CapacitorSQLite.initWebStore();
    } catch (error) {
      console.error('Error inicializando web store:', error);
    }
  }

  // Crear tablas necesarias
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    const createTablesSQL = `
      -- Tabla para almacenamiento general (clave-valor)
      CREATE TABLE IF NOT EXISTS storage_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_name TEXT UNIQUE NOT NULL,
        value_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla para productos
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL,
        stock INTEGER DEFAULT 0,
        category TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla para usuarios
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        is_logged_in INTEGER DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Índices para mejorar rendimiento
      CREATE INDEX IF NOT EXISTS idx_storage_key ON storage_data(key_name);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `;

    try {
      await this.db.execute(createTablesSQL);
      console.log('✅ Tablas creadas correctamente');
    } catch (error) {
      console.error('❌ Error creando tablas:', error);
      throw error;
    }
  }

  // Verificar si la base de datos está lista
  isDatabaseReady(): boolean {
    return this.isDbOpen && this.db !== null;
  }

  // Métodos para storage genérico (clave-valor)
  async setStorageItem(key: string, value: any): Promise<void> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = `
      INSERT OR REPLACE INTO storage_data (key_name, value_data, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    try {
      await this.db!.run(sql, [key, JSON.stringify(value)]);
    } catch (error) {
      console.error(`Error guardando ${key}:`, error);
      throw error;
    }
  }

  async getStorageItem(key: string): Promise<any> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = 'SELECT value_data FROM storage_data WHERE key_name = ?';
    
    try {
      const result = await this.db!.query(sql, [key]);
      if (result.values && result.values.length > 0) {
        return JSON.parse(result.values[0].value_data);
      }
      return null;
    } catch (error) {
      console.error(`Error obteniendo ${key}:`, error);
      throw error;
    }
  }

  async removeStorageItem(key: string): Promise<void> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = 'DELETE FROM storage_data WHERE key_name = ?';
    
    try {
      await this.db!.run(sql, [key]);
    } catch (error) {
      console.error(`Error eliminando ${key}:`, error);
      throw error;
    }
  }

  async clearStorage(): Promise<void> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = 'DELETE FROM storage_data';
    
    try {
      await this.db!.run(sql);
    } catch (error) {
      console.error('Error limpiando storage:', error);
      throw error;
    }
  }

  // Métodos específicos para productos
  async saveProduct(product: any): Promise<number> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = `
      INSERT INTO products (name, description, price, stock, category, image_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    try {
      const result = await this.db!.run(sql, [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.image_url
      ]);
      return result.changes?.lastId || 0;
    } catch (error) {
      console.error('Error guardando producto:', error);
      throw error;
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = 'SELECT * FROM products ORDER BY created_at DESC';
    
    try {
      const result = await this.db!.query(sql);
      return result.values || [];
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  async updateProduct(id: number, product: any): Promise<void> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      await this.db!.run(sql, [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.image_url,
        id
      ]);
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    if (!this.isDatabaseReady()) {
      throw new Error('Base de datos no está lista');
    }

    const sql = 'DELETE FROM products WHERE id = ?';
    
    try {
      await this.db!.run(sql, [id]);
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }

  // Cerrar conexión
  async closeDatabase(): Promise<void> {
    if (this.db && this.isDbOpen) {
      try {
        await this.db.close();
        this.isDbOpen = false;
        this.db = null;
        console.log(' Base de datos cerrada correctamente');
      } catch (error) {
        console.error(' Error cerrando base de datos:', error);
      }
    }
  }
}