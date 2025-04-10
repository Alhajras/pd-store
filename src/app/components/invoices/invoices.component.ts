import { Component, inject, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Invoice, InvoiceData, InvoiceService } from "src/app/services/invoice.service";
import { map } from "rxjs";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import { MatIconModule } from "@angular/material/icon";
import { NgForOf, SlicePipe, NgIf, DatePipe } from "@angular/common";
import { MatSelectModule } from "@angular/material/select";
import { Configurations, ConfigurationsService } from 'src/app/services/configurations.service';
import { RoundUpToFivePipe } from 'src/app/pipes/round-up-to-five.pipe';
import { BaseOrderInfo, OrderData, ToOrder } from '../to-order-table/to-order-table.component';
import { MatCardModule } from '@angular/material/card';
import { ProductService } from 'src/app/services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TimeagoPipe } from 'src/app/pipes/timeago.pipe';
import { MatListModule, MatListOption, MatSelectionListChange } from '@angular/material/list';
import { NgFor } from '@angular/common';

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
  standalone: true,
  imports: [NgFor, TimeagoPipe, MatListModule, MatCardModule, NgIf, DatePipe, RoundUpToFivePipe, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule, SlicePipe, MatSelectModule, NgForOf],
})
export class InvoicesComponent implements OnChanges {
  displayedColumns: string[] = ['name', 'address', 'phoneNumber', 'notes', 'createdTime', 'status', 'actions'];
  dataSource!: MatTableDataSource<Invoice>;
  ordersDisplayedColumns: string[] = ['image', 'name', 'variant', 'price', 'actions'];
  private _snackBar = inject(MatSnackBar);

  ordersTable!: MatTableDataSource<BaseOrderInfo>;
  protected invoiceToView!: Invoice
  public defaultImage = "https://firebasestorage.googleapis.com/v0/b/pixie-dus.firebasestorage.app/o/uploads%2F2024-11-03_19-07.png?alt=media&token=da907319-c356-41a7-8ddc-816e2db35313"
  protected totlaPriceToPay = 0
  protected totalProducts = 0
  invoiceData: InvoiceData = {
    address: '',
    city: '',
    conversionRate: 6.5,
    phoneNumber: '',
    status: '',
    orders: [],
    name: '',
    notes: '',
    locked: false,
    createdTime: ''
  };
  productCanBeAdded: ToOrder[] = [];

  private overlayRef: OverlayRef | null = null;
  private orderToDelete: Invoice | null = null
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('confirmationDialog') confirmationDialog!: TemplateRef<any>;
  @ViewChild('confirmationLockDialog') confirmationLockDialog!: TemplateRef<any>;

  public invoiceToEditId: string | null = null;
  public config: Configurations = { conversionPrice: 0 }
  protected showTable: boolean = true
  @Input()
  docsIds!: { orderId: string, quantity: number }[]
  protected orders: BaseOrderInfo[] = []

  constructor(private invoiceService: InvoiceService,
    public dialog: MatDialog,
    private productService: ProductService,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay,
    private readonly configService: ConfigurationsService,
  ) {
    this.retrieveInvoices()
    this.retrieveconfigurations()
    this.retrieveOrders()
  }

  public retrieveconfigurations() {
    this.configService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({ id: c.payload.doc.id, ...c.payload.doc.data() })
        )
      )
    ).subscribe(data => {
      this.config = data[0]
    });
  }

  public retrieveOrders(): void {
    this.productService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({ ...c.payload.doc.data(), id: c.payload.doc.id })
        )
      )
    ).subscribe(data => {
      if (this.docsIds !== undefined) {
        let docs = this.docsIds.map(doc => doc.orderId) as string[]
        data = data.filter(d => docs.findIndex(doc => doc === d.id) !== -1)

        this.docsIds.forEach(doc => {
          const order = data.find(item => item.id === doc.orderId);
          if (order) {
            order.quantity = doc.quantity;
          }
        });

      }
      data.sort((a, b) => a.name.localeCompare(b.name));
      this.productCanBeAdded = data
    });
  }

  addProductsToInvoice(selectedOptions: MatListOption[]) {
    const selectedProducts = selectedOptions.map(option => option.value); // Extract values from MatListOption
    this.invoiceData.orders = this.invoiceData.orders.concat(selectedProducts);
    this.editOrder()
  }


  changeInvoiceStatus(newStatus: any, invoice: Invoice) {
    this.invoiceData = invoice
    this.invoiceData.status = newStatus
    this.invoiceToEditId = invoice.id
    this.editOrder()
  }

  public openDeleteOrderConfirmation(event: MouseEvent, row: OrderData) {
    let updatedOrders = this.ordersTable.data
    updatedOrders = updatedOrders.filter(o => o != row)
    this.invoiceToView.orders = updatedOrders
    this.ordersTable = new MatTableDataSource(updatedOrders);
    this.updatePrice()
    this.invoiceService.update(this.invoiceToView.id, this.invoiceToView).then()
  }

  openDeleteConfirmation(event: MouseEvent, row: Invoice) {
    // If an overlay is already open, close it
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    this.orderToDelete = row

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x: event.clientX, y: event.clientY })
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -10,
        }
      ]);

    // Create overlay configuration
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      positionStrategy: positionStrategy
    });

    // Attach the template portal to the overlay
    const portal = new TemplatePortal(this.confirmationDialog, this.viewContainerRef);
    this.overlayRef.attach(portal);

    // Close the overlay when backdrop is clicked
    this.overlayRef.backdropClick().subscribe(() => this.overlayRef?.dispose());
  }


  openLockConfirmation(event: MouseEvent, row: Invoice) {
    // If an overlay is already open, close it
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    this.orderToDelete = row

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x: event.clientX, y: event.clientY })
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -10,
        }
      ]);

    // Create overlay configuration
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      positionStrategy: positionStrategy
    });

    // Attach the template portal to the overlay
    const portal = new TemplatePortal(this.confirmationLockDialog, this.viewContainerRef);
    this.overlayRef.attach(portal);

    // Close the overlay when backdrop is clicked
    this.overlayRef.backdropClick().subscribe(() => this.overlayRef?.dispose());
  }

  confirmDelete() {
    if (this.orderToDelete !== null) {
      this.invoiceService.delete(this.orderToDelete.id).then(() => {
        this.overlayRef?.dispose();
      });
    }
  }

  confirmLock() {
    if (this.orderToDelete !== null) {
      // Group orders by barcode
      const barcodeMap = new Map<string, number>();
      this.orderToDelete.orders.forEach(o => {
        if (barcodeMap.has(o.barcode)) {
          barcodeMap.set(o.barcode, barcodeMap.get(o.barcode)! + 1);
        } else {
          barcodeMap.set(o.barcode, 1);
        }
      });

      // Define the type for entries
      type Entry = [string, number];

      // Function to update products sequentially
      const updateSequentially = (entries: Entry[], index = 0): Promise<void> => {
        if (index >= entries.length) {
          return Promise.resolve();
        }

        const [barcode, quantity] = entries[index];
        return this.productService.getProductByBarcode(barcode).then(snapshot => {
          if (snapshot !== undefined && !snapshot.empty) {
            let product = snapshot.docs[0].data() as ToOrder;
            product.quantity -= quantity;
            console.log(product);
            return this.productService.update(snapshot.docs[0].id, product).then(() => {
              return updateSequentially(entries, index + 1);
            });
          } else {
            console.log('No product found with the given barcode.');
            return updateSequentially(entries, index + 1);
          }
        }).catch(error => {
          console.error('Error updating product:', error);
          return Promise.reject(error);
        });
      };

      // Start the sequential update process
      updateSequentially(Array.from(barcodeMap.entries())).then(() => {
        if (this.orderToDelete !== null) {

          this.orderToDelete.locked = true;
          this.invoiceService.update(this.orderToDelete.id, this.orderToDelete).then(() => {
            this._snackBar.open(`Order ${this.orderToDelete?.name} is locked!`);
            this.overlayRef?.dispose();
          });
        }
      });

    }
  }

  cancelDelete() {
    this.overlayRef?.dispose();
  }

  openDialog(templateRef: TemplateRef<any>): void {
    const dialogRef = this.dialog.open(templateRef, {
      width: '50rem',
      data: { ...this.invoiceData },
    });

    dialogRef.afterClosed().subscribe((result: InvoiceData | undefined) => {
      if (result) {
        console.log('Order data:', result);
      }
    });
  }

  editOrder(): void {
    console.log('Editing order:', this.invoiceToEditId);
    if (this.invoiceToEditId !== null) {
      this.invoiceService.update(this.invoiceToEditId, this.invoiceData).then(() => {
        this.invoiceToEditId = null
        this.dialog.closeAll()
      });
    }
  }

  onCancel(): void {
    this.dialog.closeAll()
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public retrieveInvoices(): void {
    this.invoiceService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({ id: c.payload.doc.id, ...c.payload.doc.data() })
        )
      )
    ).subscribe(data => {
      this.dataSource = new MatTableDataSource(data.sort((b, a) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()));
      this.dataSource.paginator = this.paginator;
      console.log(this.dataSource);
      this.dataSource.sort = this.sort;
    });
  }

  openEditDialog(dialogTemplate: TemplateRef<any>, row: Invoice) {
    this.invoiceToEditId = row.id
    this.invoiceData = { ...row }
    this.openDialog(dialogTemplate)
  }

  openAddToInvoice(dialogTemplate: TemplateRef<any>) {
    this.invoiceToEditId = this.invoiceToView.id
    this.invoiceData = { ...this.invoiceToView }
    this.openDialog(dialogTemplate)
  }


  protected displayTable() {
    this.showTable = true
  }

  private updatePrice() {
    this.totlaPriceToPay = 0
    this.totalProducts = 0

    this.invoiceToView.orders.forEach(o => {
      this.totalProducts += 1
      let sellPrice = o.sellPrice * this.config.conversionPrice
      if (sellPrice > 0) {
        sellPrice = new RoundUpToFivePipe().transform(sellPrice)
        this.totlaPriceToPay += sellPrice
      }
    })

  }

  protected hideTable(row: Invoice) {
    this.invoiceToView = row
    let orders = this.invoiceToView.orders
    orders.sort((a, b) => a.name.localeCompare(b.name));
    this.ordersTable = new MatTableDataSource(orders);
    this.ordersTable.sort = this.sort;
    this.updatePrice()
    this.showTable = false
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('docsIds' in changes) {
      this.retrieveInvoices()
    }

  }
}


