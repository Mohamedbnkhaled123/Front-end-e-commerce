import { ChartConfiguration, Plugin } from 'chart.js';
import { ICategoryBreakdown, IRevenueTrendPoint } from '../../core/services/analytics.service';
import { LanguageService } from '../../core/services/language.service';

// Central Theme Styling & Color Palettes for BI Charts
export const CHART_COLORS = {
  emeraldBorder: '#10b981',
  emeraldBg: 'rgba(16, 185, 129, 0.12)',
  emeraldPoint: '#059669',
  categoryColors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'],
  starColors: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444']
} as const;

export const centerTextPlugin: Plugin = {
  id: 'centerText',
  beforeDraw: function(chart) {
    if ((chart.config as any).type !== 'doughnut') return;
    const activeElements = chart.getActiveElements();
    let text = 'Revenue';
    let subText = 'By Category';
    
    if (activeElements && activeElements.length > 0) {
      const el = activeElements[0];
      text = (chart.data.labels as string[])[el.index] || text;
      subText = 'EGP ' + (chart.data.datasets[0].data[el.index] as number).toLocaleString();
    }
    const meta = chart.getDatasetMeta(0);
    if (!meta.data.length) return;
    
    const centerX = meta.data[0].x;
    const centerY = meta.data[0].y;

    const ctx = chart.ctx;
    ctx.restore();
    
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? "#fff" : "#1e293b";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, centerX, centerY - 10);
    
    ctx.font = "normal 12px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(subText, centerX, centerY + 14);
    
    ctx.save();
  }
};

export const crosshairPlugin: Plugin = {
  id: 'crosshair',
  afterDraw: chart => {
    if ((chart.config as any).type !== 'line') return;
    const activeElements = chart.getActiveElements();
    if (activeElements?.length) {
      const activePoint = activeElements[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.scales['y']!.top;
      const bottomY = chart.scales['y']!.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

// Factory functions to build Chart Configurations
export function buildRevenueTrendConfig(trendData: IRevenueTrendPoint[], langService: LanguageService): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data: {
      labels: trendData.map(d => d.date),
      datasets: [
        {
          label: `${langService.translate('admin.net_revenue')} (EGP)`,
          data: trendData.map(d => d.revenue),
          borderColor: CHART_COLORS.emeraldBorder,
          backgroundColor: CHART_COLORS.emeraldBg,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: CHART_COLORS.emeraldPoint,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: CHART_COLORS.emeraldPoint,
          pointHoverBorderWidth: 3,
          hoverBackgroundColor: CHART_COLORS.emeraldPoint
        },
        {
          label: `${langService.translate('admin.gross_revenue')} (EGP)`,
          data: trendData.map(d => d.grossRevenue || d.revenue),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f59e0b',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#f59e0b',
          pointHoverBorderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: EGP ${Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (val) => `EGP ${val}` }
        }
      }
    }
  };
}

export function buildCategoryBreakdownConfig(categories: ICategoryBreakdown[], onHoverCallback: (event: any, elements: any[], chart: any) => void): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data: {
      labels: categories.map(c => c._id),
      datasets: [{
        data: categories.map(c => c.revenue),
        backgroundColor: [...CHART_COLORS.categoryColors],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 12,
        hoverBackgroundColor: CHART_COLORS.categoryColors.map(c => c)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOutQuart',
        delay: (ctx: any) => ctx.dataIndex * 100
      },
      onHover: onHoverCallback,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: 10,
          usePointStyle: true,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: EGP ${Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          }
        }
      }
    }
  };
}

export function buildStarBreakdownConfig(starBreakdown: Record<number, number>): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
      datasets: [{
        label: 'Approved Reviews',
        data: [
          starBreakdown[5] || 0,
          starBreakdown[4] || 0,
          starBreakdown[3] || 0,
          starBreakdown[2] || 0,
          starBreakdown[1] || 0
        ],
        backgroundColor: [...CHART_COLORS.starColors],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      }
    }
  };
}
