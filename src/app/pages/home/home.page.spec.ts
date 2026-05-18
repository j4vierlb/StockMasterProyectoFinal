import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
import { StorageService } from '../../services/storage.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    const mockStorageService = jasmine.createSpyObj('StorageService', ['getItem', 'logout']);

    await TestBed.configureTestingModule({
      declarations: [ HomePage ],
      imports: [ IonicModule.forRoot() ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: StorageService, useValue: mockStorageService }
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.userName).toBe('Usuario');
    expect(component.metrics).toBeDefined();
    expect(component.quickActions.length).toBe(4);
  });

  it('should have correct quick actions', () => {
    const actions = component.quickActions;
    expect(actions[0].title).toBe('Productos');
    expect(actions[1].title).toBe('Categorías');
    expect(actions[2].title).toBe('Movimientos');
    expect(actions[3].title).toBe('Ajustes');
  });

  it('should have navigateTo method', () => {
    expect(component.navigateTo).toBeDefined();
  });

  it('should have logout method', () => {
    expect(component.logout).toBeDefined();
  });

  it('should have goToAdvancedFeatures method', () => {
    expect(component.goToAdvancedFeatures).toBeDefined();
  });
});
