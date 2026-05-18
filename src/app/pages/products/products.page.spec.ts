import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { ProductsPage } from './products.page';
import { StorageService } from '../../services/storage.service';
import { CameraService } from '../../services/camera.service';
import { ApiService } from '../../services/api.service';
import { EmailService } from '../../services/email.service';
import { of } from 'rxjs';

describe('ProductsPage', () => {
  let component: ProductsPage;
  let fixture: ComponentFixture<ProductsPage>;

  beforeEach(async () => {
    const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    const mockStorageService = jasmine.createSpyObj('StorageService', ['getItem', 'setItem']);
    const mockCameraService = jasmine.createSpyObj('CameraService', ['takePicture']);
    const mockApiService = jasmine.createSpyObj('ApiService', ['getProducts']);
    const mockEmailService = jasmine.createSpyObj('EmailService', ['sendAttendanceEmail']);
    const mockAlertController = jasmine.createSpyObj('AlertController', ['create']);
    const mockLoadingController = jasmine.createSpyObj('LoadingController', ['create']);
    const mockModalController = jasmine.createSpyObj('ModalController', ['create']);
    const mockToastController = jasmine.createSpyObj('ToastController', ['create']);

    mockStorageService.getItem.and.returnValue(Promise.resolve(null));
    mockApiService.getProducts.and.returnValue(of([]));
    mockAlertController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));
    mockLoadingController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve(), dismiss: () => Promise.resolve() } as any));
    mockModalController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));
    mockToastController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));

    await TestBed.configureTestingModule({
      declarations: [ ProductsPage ],
      imports: [ IonicModule.forRoot() ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: StorageService, useValue: mockStorageService },
        { provide: CameraService, useValue: mockCameraService },
        { provide: ApiService, useValue: mockApiService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AlertController, useValue: mockAlertController },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: ModalController, useValue: mockModalController },
        { provide: ToastController, useValue: mockToastController }
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty products array', () => {
    expect(component.products).toEqual([]);
    expect(component.filteredProducts).toEqual([]);
    expect(component.selectedCategory).toBe('all');
  });

  it('should have correct categories', () => {
    expect(component.categories.length).toBeGreaterThan(0);
    expect(component.categories[0].value).toBe('all');
  });

  it('should filter products by search term', () => {
    component.products = [
      { id: 1, name: 'Laptop', category: 'Hardware', stock: 10, price: 500000 },
      { id: 2, name: 'Mouse', category: 'Periféricos', stock: 20, price: 15000 },
      { id: 3, name: 'Teclado', category: 'Periféricos', stock: 15, price: 25000 }
    ];
    
    component.searchTerm = 'Mouse';
    component.filterProducts();
    
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].name).toBe('Mouse');
  });

  it('should filter products by category', () => {
    component.products = [
      { id: 1, name: 'Laptop', category: 'Hardware', stock: 10, price: 500000 },
      { id: 2, name: 'Mouse', category: 'Periféricos', stock: 20, price: 15000 },
      { id: 3, name: 'Monitor', category: 'Pantallas', stock: 5, price: 200000 }
    ];
    
    component.selectedCategory = 'Hardware';
    component.filterProducts();
    
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].category).toBe('Hardware');
  });

  it('should show all products when category is "all"', () => {
    component.products = [
      { id: 1, name: 'Laptop', category: 'Hardware', stock: 10, price: 500000 },
      { id: 2, name: 'Mouse', category: 'Periféricos', stock: 20, price: 15000 }
    ];
    
    component.selectedCategory = 'all';
    component.searchTerm = '';
    component.filterProducts();
    
    expect(component.filteredProducts.length).toBe(2);
  });

  it('should have showingMarket property', () => {
    expect(component.showingMarket).toBeDefined();
    expect(typeof component.showingMarket).toBe('boolean');
  });

  it('should have currentStorageType property', () => {
    expect(component.currentStorageType).toBeDefined();
    expect(['sqlite', 'localstorage']).toContain(component.currentStorageType);
  });
});
