import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { env } from '../../../env/env';

import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { IOrder } from '../../core/models/order.model';
import {
  AnalyticsService,
  IFinancialKPIs,
  IGrowthDeltas,
  IRevenueTrendPoint,
  ITopProduct,
  ICategoryBreakdown,
  IReviewAnalyticsRes
} from '../../core/services/analytics.service';
import { CHART_COLORS, centerTextPlugin, crosshairPlugin, buildRevenueTrendConfig, buildCategoryBreakdownConfig, buildStarBreakdownConfig } from './analytics-chart-style';
export type AnalyticsTab = 'financial' | 'products' | 'transactions' | 'sentiment';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css'
})
export class AdminAnalytics implements OnInit, OnDestroy {
  @ViewChild('revenueCanvas') revenueCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('starCanvas') starCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChildren('kpiValue') kpiValueEls!: QueryList<ElementRef<HTMLElement>>;

  staticURL = env.staticURL;
  Math = Math;

  // Tab & Navigation Signals
  activeTab = signal<AnalyticsTab>('financial');
  tabIndex = computed(() => {
    const map: Record<AnalyticsTab, number> = {
      financial: 0,
      products: 1,
      transactions: 2,
      sentiment: 3
    };
    return map[this.activeTab()] ?? 0;
  });

  // Range State Signals
  selectedRange = signal<string>('month');
  customFrom = signal<string>('');
  customTo = signal<string>('');

  // Business Intelligence Data Signals
  kpis = signal<IFinancialKPIs | null>(null);
  growth = signal<IGrowthDeltas | null>(null);
  revenueTrend = signal<IRevenueTrendPoint[]>([]);
  topProducts = signal<ITopProduct[]>([]);
  categoryBreakdown = signal<ICategoryBreakdown[]>([]);
  
  auditOrders = signal<IOrder[]>([]);
  funnelMetrics = signal<{ approved: number; pending: number; cancelled: number; returned: number }>({ approved: 0, pending: 0, cancelled: 0, returned: 0 });
  auditPage = signal<number>(1);
  auditTotalPages = signal<number>(1);
  auditTotalCount = signal<number>(0);
  auditStatusFilter = signal<string>('all');
  expandedOrderId = signal<string | null>(null);

  reviewSentiment = signal<IReviewAnalyticsRes['data'] | null>(null);

  // System Status & Micro-Interaction Signals
  isLoading = signal<boolean>(false);
  lastRefreshedAt = signal<Date>(new Date());
  kpiAnimTrigger = signal<number>(0);
  chartReady = signal<boolean>(false);

  // Chart References for Lifecycle Management (.destroy())
  private revenueChartInstance: any | null = null;
  private categoryChartInstance: any | null = null;
  private starChartInstance: any | null = null;
  private resizeObserver: ResizeObserver | null = null;

  isCategoryHovered = signal<boolean>(false);

  private subscriptions = new Subscription();

  constructor(
    private _analyticsService: AnalyticsService,
    private _cdr: ChangeDetectorRef,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.fetchAllData();
  }

  // --- Tab & Accordion Actions ---
  switchTab(tab: AnalyticsTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.chartReady.set(false);
    this._cdr.detectChanges();

    if (tab === 'products' && this.categoryBreakdown().length === 0) {
      this.fetchProductsData();
    } else if (tab === 'transactions' && this.auditOrders().length === 0) {
      this.loadOrderAudit();
    } else if (tab === 'sentiment' && !this.reviewSentiment()) {
      this.fetchReviewData();
    }

    // Render charts deferred after DOM updates canvas into view
    setTimeout(() => {
      if (tab === 'financial' && this.revenueTrend().length > 0) {
        this.renderRevenueTrendChart(this.revenueTrend());
      } else if (tab === 'products' && this.categoryBreakdown().length > 0) {
        this.renderCategoryBreakdownChart(this.categoryBreakdown());
      } else if (tab === 'sentiment' && this.reviewSentiment()?.starBreakdown) {
        this.renderStarBreakdownChart(this.reviewSentiment()!.starBreakdown);
      }
      this.chartReady.set(true);
      this._cdr.detectChanges();
    }, 60);
  }

  toggleOrderExpand(orderId: string): void {
    this.expandedOrderId.set(this.expandedOrderId() === orderId ? null : orderId);
  }

  setCustomFrom(val: string): void {
    this.customFrom.set(val);
    this.onCustomDateChange();
  }

  setCustomTo(val: string): void {
    this.customTo.set(val);
    this.onCustomDateChange();
  }

  setRange(range: string): void {
    this.selectedRange.set(range);
    this.auditPage.set(1);
    this.fetchAllData();
  }

  onCustomDateChange(): void {
    if (this.selectedRange() === 'custom' && this.customFrom()) {
      this.auditPage.set(1);
      this.fetchAllData();
    }
  }

  setAuditFilter(status: string): void {
    this.auditStatusFilter.set(status);
    this.auditPage.set(1);
    this.loadOrderAudit();
  }

  changeAuditPage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.auditTotalPages()) {
      this.auditPage.set(newPage);
      this.loadOrderAudit();
    }
  }

  refreshAllData(): void {
    this.topProducts.set([]);
    this.auditOrders.set([]);
    this.reviewSentiment.set(null);
    this.fetchAllData();
  }

  // Data Fetching Handler (Single Responsibility: Data Retrieval)
  private fetchAllData(): void {
    this.isLoading.set(true);
    this.lastRefreshedAt.set(new Date());
    this.kpiAnimTrigger.update(v => v + 1);

    const range = this.selectedRange();
    const from = this.customFrom();
    const to = this.customTo();

    // 1. Financial Analytics (always fetch as it's the default view)
    const finSub = this._analyticsService.getFinancialAnalytics(range, from, to).subscribe({
      next: (res) => {
        this.kpis.set(res.data.kpis);
        this.growth.set(res.data.growth);
        this.revenueTrend.set(res.data.revenueTrend);
        this._cdr.detectChanges();
        if (this.activeTab() === 'financial') {
          setTimeout(() => {
            this.renderRevenueTrendChart(res.data.revenueTrend);
            this.chartReady.set(true);
          }, 50);
        }
        this.triggerNumberCounters();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.subscriptions.add(finSub);

    if (this.activeTab() === 'products') this.fetchProductsData();
    if (this.activeTab() === 'transactions') this.loadOrderAudit();
    if (this.activeTab() === 'sentiment') this.fetchReviewData();
  }

  private fetchProductsData(): void {
    const range = this.selectedRange();
    const from = this.customFrom();
    const to = this.customTo();
    const prodSub = this._analyticsService.getProductAnalytics(range, from, to).subscribe({
      next: (res) => {
        this.topProducts.set(res.data.topProducts);
        this.categoryBreakdown.set(res.data.categoryBreakdown);
        this._cdr.detectChanges();
        if (this.activeTab() === 'products') {
          setTimeout(() => {
            this.renderCategoryBreakdownChart(res.data.categoryBreakdown);
            this.chartReady.set(true);
          }, 50);
        }
      }
    });
    this.subscriptions.add(prodSub);
  }

  private fetchReviewData(): void {
    const revSub = this._analyticsService.getReviewAnalytics().subscribe({
      next: (res) => {
        this.reviewSentiment.set(res.data);
        this._cdr.detectChanges();
        if (this.activeTab() === 'sentiment') {
          setTimeout(() => {
            this.renderStarBreakdownChart(res.data.starBreakdown);
            this.chartReady.set(true);
          }, 50);
        }
      }
    });
    this.subscriptions.add(revSub);
  }

  private loadOrderAudit(): void {
    const range = this.selectedRange();
    const from = this.customFrom();
    const to = this.customTo();
    const page = this.auditPage();
    const filter = this.auditStatusFilter();

    const orderSub = this._analyticsService.getOrderAudit(range, page, 10, filter, from, to).subscribe({
      next: (res) => {
        this.auditOrders.set(res.data.orders);
        this.funnelMetrics.set({
          approved: res.data.funnel.approved,
          pending: res.data.funnel.pending,
          cancelled: res.data.funnel.cancelled,
          returned: res.data.funnel.returned || 0
        });
        this.auditTotalCount.set(res.data.pagination.total);
        this.auditTotalPages.set(res.data.pagination.totalPages);
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(orderSub);
  }

  // Pure JS requestAnimationFrame Count-up Ticker
  private triggerNumberCounters(): void {
    setTimeout(() => {
      if (!this.kpiValueEls) return;
      this.kpiValueEls.forEach(elRef => {
        const el = elRef.nativeElement;
        const targetAttr = el.getAttribute('data-target');
        const prefixAttr = el.getAttribute('data-prefix') || '';
        const suffixAttr = el.getAttribute('data-suffix') || '';
        if (!targetAttr) return;

        const target = parseFloat(targetAttr);
        if (isNaN(target)) return;

        const isFloat = targetAttr.includes('.');
        const formatted = isFloat 
          ? target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : Math.round(target).toLocaleString();

        el.textContent = `${prefixAttr}${formatted}${suffixAttr}`;
      });
    }, 80);
  }

  // --- Safe Chart Destroy Helper ---
  private safeDestroyChart(instance: any | null): void {
    try {
      if (instance) instance.destroy();
    } catch (_) {
      // Ignored for unmounted canvas
    }
  }

  private setupResizeObserver(): void {
    if (this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.revenueChartInstance) this.revenueChartInstance.resize();
      if (this.categoryChartInstance) this.categoryChartInstance.resize();
      if (this.starChartInstance) this.starChartInstance.resize();
    });
    
    if (this.revenueCanvas?.nativeElement.parentElement) {
      this.resizeObserver.observe(this.revenueCanvas.nativeElement.parentElement);
    }
    if (this.categoryCanvas?.nativeElement.parentElement) {
      this.resizeObserver.observe(this.categoryCanvas.nativeElement.parentElement);
    }
  }

  // --- Chart Config Factories ---
  private ChartConstructor: any = null;
  
  private async initChartModule(): Promise<void> {
    if (this.ChartConstructor) return;
    const { 
      Chart, 
      LineController, DoughnutController, BarController,
      LineElement, PointElement, ArcElement, BarElement,
      CategoryScale, LinearScale,
      Tooltip, Legend, Filler
    } = await import('chart.js');
    
    Chart.register(
      LineController, DoughnutController, BarController,
      LineElement, PointElement, ArcElement, BarElement,
      CategoryScale, LinearScale,
      Tooltip, Legend, Filler
    );
    
    Chart.register(centerTextPlugin, crosshairPlugin);
    this.ChartConstructor = Chart;
  }

  private async renderRevenueTrendChart(trendData: IRevenueTrendPoint[]): Promise<void> {
    if (!this.revenueCanvas?.nativeElement) return;
    this.safeDestroyChart(this.revenueChartInstance);
    this.revenueChartInstance = null;
    this.setupResizeObserver();

    await this.initChartModule();

    const config = buildRevenueTrendConfig(trendData, this._langService);

    this.revenueChartInstance = new this.ChartConstructor(this.revenueCanvas.nativeElement, config);
  }

  private async renderCategoryBreakdownChart(categories: ICategoryBreakdown[]): Promise<void> {
    if (!this.categoryCanvas?.nativeElement) return;
    this.safeDestroyChart(this.categoryChartInstance);
    this.categoryChartInstance = null;
    this.setupResizeObserver();
    
    await this.initChartModule();

    const config = buildCategoryBreakdownConfig(categories, (event, elements, chart) => {
      this.isCategoryHovered.set(elements.length > 0);
      if (elements.length > 0) {
        chart.data.datasets[0].backgroundColor = CHART_COLORS.categoryColors.map((color, i) => 
          i === elements[0].index ? color : color + '66'
        );
      } else {
        chart.data.datasets[0].backgroundColor = [...CHART_COLORS.categoryColors];
      }
      chart.update();
    });

    this.categoryChartInstance = new this.ChartConstructor(this.categoryCanvas.nativeElement, config);
  }

  private async renderStarBreakdownChart(starBreakdown: Record<number, number>): Promise<void> {
    if (!this.starCanvas?.nativeElement) return;
    this.safeDestroyChart(this.starChartInstance);
    this.starChartInstance = null;

    await this.initChartModule();
    const config = buildStarBreakdownConfig(starBreakdown);

    this.starChartInstance = new this.ChartConstructor(this.starCanvas.nativeElement, config);
  }

  // Pure JavaScript Data Blob CSV Export
  exportCSV(): void {
    const orders = this.auditOrders();
    if (orders.length === 0) return;

    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Items Purchased', 'Gross Total (EGP)', 'Discount (EGP)', 'Shipping (EGP)', 'Net Total (EGP)', 'Status', 'Date/Time'];
    const rows = orders.map(o => {
      const customerName = `"${o.user?.name || 'Guest User'}"`;
      const customerEmail = `"${o.user?.email || 'N/A'}"`;
      const itemsList = `"${o.items.map((i: any) => `${(i.productId as any)?.name || 'Product'} x${i.quantity}`).join('; ')}"`;
      const gross = (o.grossTotal ?? o.totalPrice).toFixed(2);
      const discount = (o.totalDiscount ?? 0).toFixed(2);
      const shipping = (o.shippingFee ?? 0).toFixed(2);
      const net = (o.netTotal ?? o.totalPrice).toFixed(2);
      const status = `"${o.orderStatus}"`;
      const date = `"${new Date(o.createdAt!).toLocaleString()}"`;
      return [o._id, customerName, customerEmail, itemsList, gross, discount, shipping, net, status, date].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shoPRO_Executive_Audit_${this.selectedRange()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Browser Print PDF Export
  exportPDF(): void {
    window.print();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.safeDestroyChart(this.revenueChartInstance);
    this.safeDestroyChart(this.categoryChartInstance);
    this.safeDestroyChart(this.starChartInstance);
  }
}
