import { Component, OnInit, PLATFORM_ID, ChangeDetectorRef, inject, effect } from '@angular/core';
import { Chart, ChartData, ChartItem, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { map } from 'rxjs';
import { InvoiceService } from 'src/app/services/invoice.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  standalone: true,
  imports: [NgChartsModule]


})
export class AnalyticsComponent {
  public chartType: 'bar' = 'bar';

  public barChartData!: ChartData<'bar'>;
  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      x: { title: { display: true, text: 'Months' } },
      y: { title: { display: true, text: 'Value' } }
    }
  };


  constructor(private invoiceService: InvoiceService) {
    this.retrieveInvoices()
  }

  public retrieveInvoices(): void {
    this.invoiceService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({ id: c.payload.doc.id, ...c.payload.doc.data() })
        )
      )
    ).subscribe(data => {
      this.barChartData = this.generateChartData(data.filter(invoice => invoice.status !== 'draft'));

    });
  }


  // Function to group dates by month
  public generateChartData(invoices: any[]): ChartData<'bar'> {
    const monthlyData: Record<string, { totalOrders: number; totalInvoices: number; totalGain: number }> = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.createdTime);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalOrders: 0, totalInvoices: 0, totalGain: 0 };
      }

      monthlyData[monthKey].totalInvoices += 1;

      invoice.orders.forEach((order: any) => {
        monthlyData[monthKey].totalOrders += order.quantity;

        const sellPrice = isNaN(order.sellPrice) ? 0 : order.sellPrice;
        const price = isNaN(order.price) ? 0 : order.price;
        const gain = (sellPrice - price);
        monthlyData[monthKey].totalGain += gain;
      });

    });

    const labels = Object.keys(monthlyData).sort();
    const totalOrdersData = labels.map(month => monthlyData[month].totalOrders);
    const totalInvoicesData = labels.map(month => monthlyData[month].totalInvoices);
    const totalGainData = labels.map(month => monthlyData[month].totalGain);

    return {
      labels,
      datasets: [
        {
          data: totalInvoicesData,
          label: 'Total Invoices',
          backgroundColor: 'rgba(244, 67, 54, 0.6)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1,
        }, {
          data: totalOrdersData,
          label: 'Total Orders',
          backgroundColor: 'rgba(33, 150, 243, 0.6)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1,
        },
        {
          data: totalGainData,
          label: 'Total Gain (€)',
          backgroundColor: 'rgba(76, 175, 80, 0.6)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1,
        }
      ]
    };
  }
}