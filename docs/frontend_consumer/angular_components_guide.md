# Angular Components - Billing API

## Visão Geral

Este guia demonstra como criar componentes Angular para consumir a API de Billing do VeloFlux, utilizando serviços Angular, RxJS para gerenciamento de estado reativo e TypeScript.

## Configuração Inicial

### Dependências

```json
{
  "dependencies": {
    "@angular/core": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/forms": "^16.0.0",
    "@angular/router": "^16.0.0",
    "@angular/cdk": "^16.0.0",
    "@angular/material": "^16.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^16.0.0",
    "@angular-devkit/build-angular": "^16.0.0",
    "jasmine": "^4.6.0",
    "karma": "^6.4.0",
    "typescript": "^5.0.0"
  }
}
```

### Configuração do Módulo

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BillingModule } from './billing/billing.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    BillingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Serviços Angular

### 1. Serviço Principal de Billing

```typescript
// services/billing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';

import { 
  TenantBillingInfo, 
  Subscription, 
  Invoice, 
  Plan,
  UsageData,
  Notification,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  UsageFilters,
  InvoiceFilters 
} from '../types/billing.types';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private readonly baseUrl = 'https://api.veloflux.io/billing';
  
  // State subjects
  private billingInfoSubject = new BehaviorSubject<TenantBillingInfo | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);

  // Public observables
  public billingInfo$ = this.billingInfoSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();

  // Computed observables
  public currentSubscription$ = this.billingInfo$.pipe(
    map(info => info?.subscription)
  );

  public currentPlan$ = this.billingInfo$.pipe(
    map(info => info?.plan)
  );

  public unreadNotifications$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.read))
  );

  public unreadCount$ = this.unreadNotifications$.pipe(
    map(notifications => notifications.length)
  );

  constructor(private http: HttpClient) {}

  // Tenant Billing Methods
  getTenantBilling(tenantId: string): Observable<TenantBillingInfo> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TenantBillingInfo>(`${this.baseUrl}/tenant/${tenantId}/billing`).pipe(
      tap(billingInfo => {
        this.billingInfoSubject.next(billingInfo);
        this.setLoading(false);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  getTenantUsage(tenantId: string, filters?: UsageFilters): Observable<UsageData> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof UsageFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<UsageData>(`${this.baseUrl}/tenant/${tenantId}/usage`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createCheckoutSession(tenantId: string, request: CreateCheckoutRequest): Observable<CreateCheckoutResponse> {
    this.setLoading(true);

    return this.http.post<CreateCheckoutResponse>(`${this.baseUrl}/tenant/${tenantId}/checkout`, request).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  exportTenantBilling(tenantId: string, options: any): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        params = params.set(key, options[key].toString());
      }
    });

    return this.http.get(`${this.baseUrl}/tenant/${tenantId}/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Subscription Methods
  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.baseUrl}/subscriptions`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  updateSubscription(id: string, data: Partial<Subscription>): Observable<Subscription> {
    this.setLoading(true);

    return this.http.put<Subscription>(`${this.baseUrl}/subscriptions/${id}`, data).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  cancelSubscription(id: string): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(`${this.baseUrl}/subscriptions/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  // Invoice Methods
  getInvoices(filters?: InvoiceFilters): Observable<Invoice[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof InvoiceFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  downloadInvoice(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${id}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Plan Methods
  getPlans(): Observable<{ plans: Plan[] }> {
    return this.http.get<{ plans: Plan[] }>(`${this.baseUrl}/plans`).pipe(
      catchError(error => this.handleError(error)),
      shareReplay(1)
    );
  }

  // Notification Methods
  getNotifications(filters?: any): Observable<Notification[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`, { params }).pipe(
      tap(notifications => this.notificationsSubject.next(notifications)),
      catchError(error => this.handleError(error))
    );
  }

  markNotificationAsRead(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/notifications/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.notificationsSubject.value;
        const updated = current.map(n => 
          n.id === id ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(updated);
      }),
      catchError(error => this.handleError(error))
    );
  }

  markAllNotificationsAsRead(): Observable<void> {
    const unread = this.notificationsSubject.value.filter(n => !n.read);
    const requests = unread.map(n => this.markNotificationAsRead(n.id));
    
    return new Observable(subscriber => {
      Promise.all(requests.map(req => req.toPromise())).then(() => {
        subscriber.next();
        subscriber.complete();
      }).catch(error => {
        subscriber.error(error);
      });
    });
  }

  // Utility Methods
  refreshBillingInfo(tenantId: string): Observable<TenantBillingInfo> {
    return this.getTenantBilling(tenantId);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro inesperado';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      switch (error.status) {
        case 401:
          errorMessage = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          errorMessage = 'Acesso negado.';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          break;
        case 429:
          errorMessage = 'Muitas requisições. Tente novamente em alguns minutos.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor.';
          break;
        default:
          errorMessage = error.error?.error || `Erro ${error.status}: ${error.message}`;
      }
    }

    this.errorSubject.next(errorMessage);
    this.setLoading(false);
    
    return throwError(() => new Error(errorMessage));
  }
}
```

### 2. Serviço de Download

```typescript
// services/download.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  downloadFromUrl(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
```

## Componentes Angular

### 1. Dashboard Principal

```typescript
// components/billing-dashboard/billing-dashboard.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { TenantBillingInfo } from '../../types/billing.types';

@Component({
  selector: 'app-billing-dashboard',
  templateUrl: './billing-dashboard.component.html',
  styleUrls: ['./billing-dashboard.component.scss']
})
export class BillingDashboardComponent implements OnInit, OnDestroy {
  @Input() tenantId!: string;

  billingInfo$: Observable<TenantBillingInfo | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(private billingService: BillingService) {
    this.billingInfo$ = this.billingService.billingInfo$;
    this.loading$ = this.billingService.loading$;
    this.error$ = this.billingService.error$;
  }

  ngOnInit(): void {
    this.loadBillingData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBillingData(): void {
    this.billingService.getTenantBilling(this.tenantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onRefresh(): void {
    this.loadBillingData();
  }

  onClearError(): void {
    this.billingService.clearError();
  }
}
```

```html
<!-- components/billing-dashboard/billing-dashboard.component.html -->
<div class="billing-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <h1>Billing Dashboard</h1>
    <button 
      mat-raised-button 
      color="primary" 
      (click)="onRefresh()"
      [disabled]="loading$ | async">
      <mat-icon>refresh</mat-icon>
      {{ (loading$ | async) ? 'Carregando...' : 'Atualizar' }}
    </button>
  </div>

  <!-- Error Alert -->
  <mat-card class="error-card" *ngIf="error$ | async as error">
    <mat-card-content>
      <div class="error-content">
        <mat-icon color="warn">error</mat-icon>
        <span>{{ error }}</span>
        <button mat-icon-button (click)="onClearError()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </mat-card-content>
  </mat-card>

  <!-- Loading State -->
  <div class="loading-container" *ngIf="(loading$ | async) && !(billingInfo$ | async)">
    <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
  </div>

  <!-- Dashboard Content -->
  <div class="dashboard-content" *ngIf="billingInfo$ | async as billingInfo">
    <div class="dashboard-grid">
      <!-- Subscription Section -->
      <div class="subscription-section">
        <app-subscription-card 
          [billingInfo]="billingInfo"
          [tenantId]="tenantId">
        </app-subscription-card>
      </div>

      <!-- Notifications Section -->
      <div class="notifications-section">
        <app-notification-center [tenantId]="tenantId"></app-notification-center>
      </div>

      <!-- Usage Section -->
      <div class="usage-section">
        <app-usage-chart [tenantId]="tenantId"></app-usage-chart>
      </div>

      <!-- Invoices Section -->
      <div class="invoices-section">
        <app-invoices-list [tenantId]="tenantId" [limit]="5"></app-invoices-list>
      </div>
    </div>
  </div>
</div>
```

```scss
// components/billing-dashboard/billing-dashboard.component.scss
.billing-dashboard {
  padding: 24px;
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 500;
    }
  }

  .error-card {
    margin-bottom: 24px;
    background-color: #ffebee;
    
    .error-content {
      display: flex;
      align-items: center;
      gap: 12px;
      
      mat-icon {
        flex-shrink: 0;
      }
      
      span {
        flex: 1;
      }
    }
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
    gap: 24px;
    
    .subscription-section {
      grid-column: 1;
      grid-row: 1;
    }
    
    .notifications-section {
      grid-column: 2;
      grid-row: 1;
    }
    
    .usage-section {
      grid-column: 1;
      grid-row: 2;
    }
    
    .invoices-section {
      grid-column: 2;
      grid-row: 2;
    }
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      
      .subscription-section,
      .notifications-section,
      .usage-section,
      .invoices-section {
        grid-column: 1;
        grid-row: auto;
      }
    }
  }
}
```

### 2. Card de Assinatura

```typescript
// components/subscription-card/subscription-card.component.ts
import { Component, Input, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { TenantBillingInfo, PlanType } from '../../types/billing.types';
import { PlanSelectorDialogComponent } from '../plan-selector-dialog/plan-selector-dialog.component';

@Component({
  selector: 'app-subscription-card',
  templateUrl: './subscription-card.component.html',
  styleUrls: ['./subscription-card.component.scss']
})
export class SubscriptionCardComponent implements OnDestroy {
  @Input() billingInfo!: TenantBillingInfo;
  @Input() tenantId!: string;

  private destroy$ = new Subject<void>();

  constructor(
    private billingService: BillingService,
    private dialog: MatDialog
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get subscription() {
    return this.billingInfo?.subscription;
  }

  get plan() {
    return this.billingInfo?.plan;
  }

  get statusColor(): string {
    switch (this.billingInfo?.status) {
      case 'active': return 'primary';
      case 'inactive': return 'warn';
      case 'trialing': return 'accent';
      default: return '';
    }
  }

  get statusText(): string {
    switch (this.billingInfo?.status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'trialing': return 'Em Teste';
      default: return 'Desconhecido';
    }
  }

  get billingCycleText(): string {
    return this.subscription?.billing_cycle === 'monthly' ? 'Mensal' : 'Anual';
  }

  onUpgrade(): void {
    const dialogRef = this.dialog.open(PlanSelectorDialogComponent, {
      width: '800px',
      data: {
        currentPlan: this.subscription?.plan_type,
        tenantId: this.tenantId
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.handlePlanSelection(result.planType, result.isYearly);
        }
      });
  }

  private handlePlanSelection(planType: PlanType, isYearly: boolean): void {
    this.billingService.createCheckoutSession(this.tenantId, {
      plan_type: planType,
      is_yearly: isYearly
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          window.location.href = response.checkout_url;
        },
        error: (error) => {
          console.error('Erro ao criar checkout:', error);
        }
      });
  }
}
```

```html
<!-- components/subscription-card/subscription-card.component.html -->
<mat-card class="subscription-card">
  <mat-card-header>
    <mat-card-title>Assinatura Atual</mat-card-title>
    <mat-chip [color]="statusColor" selected>
      {{ statusText }}
    </mat-chip>
  </mat-card-header>

  <mat-card-content>
    <div class="subscription-content" *ngIf="subscription; else noSubscription">
      <div class="info-grid">
        <div class="info-item">
          <label>Plano</label>
          <span class="value">{{ plan?.name || subscription.plan_type }}</span>
        </div>
        <div class="info-item">
          <label>Ciclo de Cobrança</label>
          <span class="value">{{ billingCycleText }}</span>
        </div>
      </div>

      <div class="info-item" *ngIf="billingInfo?.next_billing_date">
        <label>Próxima Cobrança</label>
        <span class="value">{{ billingInfo.next_billing_date | date:'dd/MM/yyyy' }}</span>
      </div>
    </div>

    <ng-template #noSubscription>
      <div class="no-subscription">
        <mat-icon>info</mat-icon>
        <p>Você não possui uma assinatura ativa</p>
      </div>
    </ng-template>
  </mat-card-content>

  <mat-card-actions>
    <button mat-raised-button color="primary" (click)="onUpgrade()">
      {{ subscription ? 'Alterar Plano' : 'Escolher Plano' }}
    </button>
    <button mat-button *ngIf="subscription">
      Gerenciar Pagamento
    </button>
  </mat-card-actions>
</mat-card>
```

### 3. Gráfico de Uso

```typescript
// components/usage-chart/usage-chart.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { DownloadService } from '../../services/download.service';
import { UsageData } from '../../types/billing.types';

interface ResourceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-usage-chart',
  templateUrl: './usage-chart.component.html',
  styleUrls: ['./usage-chart.component.scss']
})
export class UsageChartComponent implements OnInit, OnDestroy {
  @Input() tenantId!: string;

  resourceControl = new FormControl('requests');
  usage$!: Observable<UsageData>;
  loading = false;

  resourceOptions: ResourceOption[] = [
    { value: 'requests', label: 'Requisições' },
    { value: 'bandwidth_gb', label: 'Bandwidth (GB)' },
    { value: 'storage_gb', label: 'Armazenamento (GB)' },
    { value: 'compute_hours', label: 'Horas de Compute' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private billingService: BillingService,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    this.usage$ = this.resourceControl.valueChanges.pipe(
      startWith(this.resourceControl.value),
      switchMap(resource => {
        this.loading = true;
        return this.billingService.getTenantUsage(this.tenantId, { resource });
      }),
      takeUntil(this.destroy$)
    );

    this.usage$.subscribe(() => {
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUsagePercentage(usage: UsageData): number {
    return (usage.total_usage / usage.plan_limit) * 100;
  }

  getProgressColor(percentage: number): string {
    if (percentage > 80) return 'warn';
    if (percentage > 60) return 'accent';
    return 'primary';
  }

  isNearLimit(percentage: number): boolean {
    return percentage > 80;
  }

  onExport(format: string): void {
    this.billingService.exportTenantBilling(this.tenantId, {
      format,
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadService.downloadBlob(blob, `usage_${this.tenantId}.${format}`);
        },
        error: (error) => {
          console.error('Erro ao exportar:', error);
        }
      });
  }
}
```

```html
<!-- components/usage-chart/usage-chart.component.html -->
<mat-card class="usage-chart-card">
  <mat-card-header>
    <mat-card-title>Uso de Recursos</mat-card-title>
    <div class="header-actions">
      <mat-form-field appearance="outline">
        <mat-select [formControl]="resourceControl">
          <mat-option *ngFor="let option of resourceOptions" [value]="option.value">
            {{ option.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-button [matMenuTriggerFor]="exportMenu">
        <mat-icon>download</mat-icon>
        Exportar
      </button>
      <mat-menu #exportMenu="matMenu">
        <button mat-menu-item (click)="onExport('csv')">CSV</button>
        <button mat-menu-item (click)="onExport('json')">JSON</button>
        <button mat-menu-item (click)="onExport('xlsx')">Excel</button>
      </mat-menu>
    </div>
  </mat-card-header>

  <mat-card-content>
    <!-- Loading State -->
    <div class="loading-container" *ngIf="loading">
      <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
    </div>

    <!-- Usage Data -->
    <div class="usage-content" *ngIf="usage$ | async as usage">
      <div class="usage-stats">
        <div class="stat-item">
          <span class="label">Uso Atual</span>
          <span class="value">{{ usage.total_usage | number }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Limite do Plano</span>
          <span class="value">{{ usage.plan_limit | number }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Porcentagem</span>
          <span class="value" [ngClass]="getProgressColor(getUsagePercentage(usage))">
            {{ getUsagePercentage(usage) | number:'1.1-1' }}%
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-container">
        <mat-progress-bar 
          mode="determinate" 
          [value]="getUsagePercentage(usage)"
          [color]="getProgressColor(getUsagePercentage(usage))">
        </mat-progress-bar>
      </div>

      <!-- Usage Alert -->
      <mat-card class="alert-card" *ngIf="isNearLimit(getUsagePercentage(usage))">
        <mat-card-content>
          <div class="alert-content">
            <mat-icon color="warn">warning</mat-icon>
            <div class="alert-text">
              <strong>Atenção!</strong> 
              Você está próximo do limite do seu plano. 
              Considere fazer upgrade para evitar interrupções.
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Usage History Chart -->
      <div class="chart-container">
        <h3>Histórico de Uso (últimos 30 dias)</h3>
        <app-usage-history-chart [usageData]="usage.usage"></app-usage-history-chart>
      </div>
    </div>
  </mat-card-content>
</mat-card>
```

### 4. Lista de Faturas

```typescript
// components/invoices-list/invoices-list.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { DownloadService } from '../../services/download.service';
import { Invoice } from '../../types/billing.types';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss']
})
export class InvoicesListComponent implements OnInit, OnDestroy {
  @Input() tenantId?: string;
  @Input() limit?: number;
  @Input() showHeader = true;

  invoices$!: Observable<Invoice[]>;
  displayedColumns: string[] = ['invoice_number', 'created_at', 'amount_due', 'status', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    private billingService: BillingService,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    const filters = this.tenantId ? { tenant_id: this.tenantId, limit: this.limit } : { limit: this.limit };
    this.invoices$ = this.billingService.getInvoices(filters);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'paid': return 'primary';
      case 'open': return 'accent';
      case 'void': return 'basic';
      default: return 'basic';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Pago';
      case 'open': return 'Aberto';
      case 'void': return 'Cancelado';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  }

  onDownloadInvoice(invoiceId: string): void {
    this.billingService.downloadInvoice(invoiceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadService.downloadBlob(blob, `invoice_${invoiceId}.pdf`);
        },
        error: (error) => {
          console.error('Erro ao baixar fatura:', error);
        }
      });
  }
}
```

```html
<!-- components/invoices-list/invoices-list.component.html -->
<mat-card class="invoices-list-card">
  <mat-card-header *ngIf="showHeader">
    <mat-card-title>Faturas Recentes</mat-card-title>
    <mat-card-subtitle>
      <a routerLink="/billing/invoices" mat-button>Ver todas</a>
    </mat-card-subtitle>
  </mat-card-header>

  <mat-card-content>
    <table mat-table [dataSource]="invoices$ | async" class="invoices-table">
      <!-- Invoice Number Column -->
      <ng-container matColumnDef="invoice_number">
        <th mat-header-cell *matHeaderCellDef>Número</th>
        <td mat-cell *matCellDef="let invoice">
          <strong>#{{ invoice.invoice_number }}</strong>
        </td>
      </ng-container>

      <!-- Date Column -->
      <ng-container matColumnDef="created_at">
        <th mat-header-cell *matHeaderCellDef>Data</th>
        <td mat-cell *matCellDef="let invoice">
          {{ invoice.created_at | date:'dd/MM/yyyy' }}
        </td>
      </ng-container>

      <!-- Amount Column -->
      <ng-container matColumnDef="amount_due">
        <th mat-header-cell *matHeaderCellDef>Valor</th>
        <td mat-cell *matCellDef="let invoice">
          {{ invoice.amount_due / 100 | currency:invoice.currency:'symbol':'1.2-2' }}
        </td>
      </ng-container>

      <!-- Status Column -->
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let invoice">
          <mat-chip [color]="getStatusColor(invoice.status)" selected>
            {{ getStatusText(invoice.status) }}
          </mat-chip>
        </td>
      </ng-container>

      <!-- Actions Column -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Ações</th>
        <td mat-cell *matCellDef="let invoice">
          <button 
            mat-icon-button 
            *ngIf="invoice.status === 'paid'"
            (click)="onDownloadInvoice(invoice.id)"
            matTooltip="Baixar PDF">
            <mat-icon>download</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

      <!-- No data row -->
      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell" [attr.colspan]="displayedColumns.length">
          <div class="no-data">
            <mat-icon>description</mat-icon>
            <span>Nenhuma fatura encontrada</span>
          </div>
        </td>
      </tr>
    </table>
  </mat-card-content>
</mat-card>
```

### 5. Seletor de Planos (Dialog)

```typescript
// components/plan-selector-dialog/plan-selector-dialog.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { Plan, PlanType } from '../../types/billing.types';

interface DialogData {
  currentPlan?: PlanType;
  tenantId: string;
}

interface PlanSelection {
  planType: PlanType;
  isYearly: boolean;
}

@Component({
  selector: 'app-plan-selector-dialog',
  templateUrl: './plan-selector-dialog.component.html',
  styleUrls: ['./plan-selector-dialog.component.scss']
})
export class PlanSelectorDialogComponent implements OnInit, OnDestroy {
  plans$!: Observable<{ plans: Plan[] }>;
  billingCycleControl = new FormControl(false);
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<PlanSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private billingService: BillingService
  ) {}

  ngOnInit(): void {
    this.plans$ = this.billingService.getPlans();
    this.plans$.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isYearly(): boolean {
    return this.billingCycleControl.value || false;
  }

  getPlanPrice(plan: Plan): number {
    return this.isYearly ? plan.pricing.yearly.amount : plan.pricing.monthly.amount;
  }

  getPlanCurrency(plan: Plan): string {
    return this.isYearly ? plan.pricing.yearly.currency : plan.pricing.monthly.currency;
  }

  isCurrentPlan(planType: PlanType): boolean {
    return this.data.currentPlan === planType;
  }

  onSelectPlan(plan: Plan): void {
    if (!this.isCurrentPlan(plan.type)) {
      const result: PlanSelection = {
        planType: plan.type,
        isYearly: this.isYearly
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
```

```html
<!-- components/plan-selector-dialog/plan-selector-dialog.component.html -->
<div class="plan-selector-dialog">
  <h2 mat-dialog-title>Escolher Plano</h2>

  <mat-dialog-content>
    <!-- Billing Cycle Toggle -->
    <div class="billing-cycle-toggle">
      <mat-slide-toggle [formControl]="billingCycleControl">
        Cobrança Anual
        <span class="discount-badge" *ngIf="isYearly">(20% de desconto)</span>
      </mat-slide-toggle>
    </div>

    <!-- Loading State -->
    <div class="loading-container" *ngIf="loading">
      <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
    </div>

    <!-- Plans Grid -->
    <div class="plans-grid" *ngIf="plans$ | async as plansResponse">
      <mat-card 
        class="plan-card"
        *ngFor="let plan of plansResponse.plans"
        [class.current-plan]="isCurrentPlan(plan.type)"
        [class.selectable]="!isCurrentPlan(plan.type)"
        (click)="onSelectPlan(plan)">
        
        <mat-card-header>
          <mat-card-title>{{ plan.name }}</mat-card-title>
          <mat-chip *ngIf="isCurrentPlan(plan.type)" color="primary" selected>
            Plano Atual
          </mat-chip>
        </mat-card-header>

        <mat-card-content>
          <div class="plan-price">
            <span class="price">
              {{ getPlanPrice(plan) / 100 | currency:getPlanCurrency(plan):'symbol':'1.0-0' }}
            </span>
            <span class="period">por {{ isYearly ? 'ano' : 'mês' }}</span>
          </div>

          <mat-divider></mat-divider>

          <ul class="features-list">
            <li *ngFor="let feature of plan.features">
              <mat-icon>check</mat-icon>
              {{ feature }}
            </li>
          </ul>
        </mat-card-content>

        <mat-card-actions>
          <button 
            mat-raised-button 
            [color]="isCurrentPlan(plan.type) ? '' : 'primary'"
            [disabled]="isCurrentPlan(plan.type)"
            class="select-button">
            {{ isCurrentPlan(plan.type) ? 'Plano Atual' : 'Escolher Plano' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  </mat-dialog-content>

  <mat-dialog-actions>
    <button mat-button (click)="onCancel()">Cancelar</button>
  </mat-dialog-actions>
</div>
```

### 6. Centro de Notificações

```typescript
// components/notification-center/notification-center.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BillingService } from '../../services/billing.service';
import { Notification } from '../../types/billing.types';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  @Input() tenantId!: string;
  @Input() maxItems = 5;

  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;
  showAll = false;

  private destroy$ = new Subject<void>();

  constructor(private billingService: BillingService) {
    this.notifications$ = this.billingService.notifications$;
    this.unreadCount$ = this.billingService.unreadCount$;
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.billingService.getNotifications({ tenant_id: this.tenantId })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getTypeIcon(type: string): string {
    const icons = {
      payment_success: 'check_circle',
      payment_failed: 'error',
      usage_alert: 'warning',
      invoice_created: 'description',
      subscription_updated: 'refresh'
    };
    return icons[type] || 'notifications';
  }

  getTypeColor(type: string): string {
    const colors = {
      payment_success: 'primary',
      payment_failed: 'warn',
      usage_alert: 'accent',
      invoice_created: 'primary',
      subscription_updated: 'primary'
    };
    return colors[type] || 'primary';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'warn';
      case 'high': return 'accent';
      case 'normal': return 'primary';
      case 'low': return 'basic';
      default: return 'basic';
    }
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.billingService.markNotificationAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  onMarkAllAsRead(): void {
    this.billingService.markAllNotificationsAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}
```

```html
<!-- components/notification-center/notification-center.component.html -->
<mat-card class="notification-center">
  <mat-card-header>
    <mat-card-title>
      Notificações
      <mat-icon class="notification-badge" 
               *ngIf="unreadCount$ | async as count" 
               [matBadge]="count" 
               matBadgeColor="warn">
        notifications
      </mat-icon>
    </mat-card-title>
    <button 
      mat-button 
      *ngIf="(unreadCount$ | async) > 0"
      (click)="onMarkAllAsRead()">
      Marcar todas como lidas
    </button>
  </mat-card-header>

  <mat-card-content>
    <div class="notifications-list" *ngIf="notifications$ | async as notifications">
      <!-- Empty State -->
      <div class="empty-state" *ngIf="notifications.length === 0">
        <mat-icon>notifications_none</mat-icon>
        <p>Nenhuma notificação</p>
      </div>

      <!-- Notifications -->
      <div class="notification-items">
        <div 
          class="notification-item"
          *ngFor="let notification of notifications | slice:0:(showAll ? undefined : maxItems)"
          [class.unread]="!notification.read"
          (click)="onNotificationClick(notification)">
          
          <div class="notification-icon">
            <mat-icon [color]="getTypeColor(notification.type)">
              {{ getTypeIcon(notification.type) }}
            </mat-icon>
          </div>

          <div class="notification-content">
            <div class="notification-header">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <mat-chip 
                [color]="getPriorityColor(notification.priority)" 
                selected
                class="priority-chip">
                {{ notification.priority }}
              </mat-chip>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">
              {{ notification.timestamp | date:'dd/MM/yyyy HH:mm' }}
            </span>
          </div>
        </div>

        <!-- Show More Button -->
        <button 
          mat-button 
          *ngIf="!showAll && notifications.length > maxItems"
          (click)="showAll = true"
          class="show-more-btn">
          Ver todas as notificações ({{ notifications.length - maxItems }} restantes)
        </button>
      </div>
    </div>
  </mat-card-content>
</mat-card>
```

## Módulo de Billing

```typescript
// billing.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { BillingDashboardComponent } from './components/billing-dashboard/billing-dashboard.component';
import { SubscriptionCardComponent } from './components/subscription-card/subscription-card.component';
import { UsageChartComponent } from './components/usage-chart/usage-chart.component';
import { InvoicesListComponent } from './components/invoices-list/invoices-list.component';
import { PlanSelectorDialogComponent } from './components/plan-selector-dialog/plan-selector-dialog.component';
import { NotificationCenterComponent } from './components/notification-center/notification-center.component';
import { UsageHistoryChartComponent } from './components/usage-history-chart/usage-history-chart.component';

@NgModule({
  declarations: [
    BillingDashboardComponent,
    SubscriptionCardComponent,
    UsageChartComponent,
    InvoicesListComponent,
    PlanSelectorDialogComponent,
    NotificationCenterComponent,
    UsageHistoryChartComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    
    // Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTableModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  exports: [
    BillingDashboardComponent,
    SubscriptionCardComponent,
    UsageChartComponent,
    InvoicesListComponent,
    NotificationCenterComponent
  ]
})
export class BillingModule { }
```

## Exemplo de Uso no App Principal

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { BillingService } from './billing/services/billing.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-billing-dashboard [tenantId]="tenantId"></app-billing-dashboard>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  tenantId = 'tenant_123'; // Obter do serviço de autenticação

  constructor(private billingService: BillingService) {}

  ngOnInit(): void {
    // Configurar autenticação se necessário
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Configurar token no interceptor HTTP
    }
  }
}
```

Esta implementação Angular fornece uma arquitetura robusta e reativa para consumir toda a API de Billing, com componentes modulares usando Angular Material e gerenciamento de estado reativo com RxJS.
