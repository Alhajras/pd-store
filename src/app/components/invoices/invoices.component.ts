import {Component, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {Invoice, InvoiceData, InvoiceService} from "src/app/services/invoice.service";
import {finalize, map} from "rxjs";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {TemplatePortal} from "@angular/cdk/portal";
import {MatIconModule} from "@angular/material/icon";
import {NgForOf, SlicePipe, NgIf, DatePipe} from "@angular/common";
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {MatSelectModule} from "@angular/material/select";
import {Shipment, ShipmentService} from "src/app/services/shipment.service";
import { Configurations, ConfigurationsService } from 'src/app/services/configurations.service';
import { RoundUpToFivePipe } from 'src/app/pipes/round-up-to-five.pipe';
import { BaseOrderInfo, ToOrder } from '../to-order-table/to-order-table.component';
import {MatCardModule} from '@angular/material/card';

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
  standalone: true,
  imports:[MatCardModule, NgIf,DatePipe, RoundUpToFivePipe, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule, SlicePipe, MatSelectModule, NgForOf],
})
export class InvoicesComponent implements OnChanges{
  displayedColumns: string[] = ['name', 'address', 'phoneNumber', 'notes',  'createdTime', 'actions'];
  dataSource!: MatTableDataSource<Invoice>;
  ordersDisplayedColumns: string[] = ['image', 'name', 'variant', 'price', 'actions'];

  ordersTable!: MatTableDataSource<BaseOrderInfo>;
  protected invoiceToView!:  Invoice
  public defaultImage = "https://firebasestorage.googleapis.com/v0/b/pixie-dus.firebasestorage.app/o/uploads%2F2024-11-03_19-07.png?alt=media&token=da907319-c356-41a7-8ddc-816e2db35313"
  protected totlaPriceToPay = 0
  protected totalProducts = 0
  invoiceData: InvoiceData = {
    address: '',
    phoneNumber: '',
    orders: [],
    name: '',
    notes: '',
    createdTime: ''
  };

  private overlayRef: OverlayRef | null = null;
  private orderToDelete: Invoice | null = null
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('confirmationDialog') confirmationDialog!: TemplateRef<any>;
  public invoiceToEditId: string | null = null;
  public config : Configurations = {conversionPrice: 0}
  protected showTable: boolean = true 
  @Input()
  docsIds!: {orderId: string, quantity: number}[]
  protected orders: BaseOrderInfo[] = []

  constructor(private invoiceService: InvoiceService,
              public dialog: MatDialog,
              private viewContainerRef: ViewContainerRef,
              private overlay: Overlay,
              private readonly configService: ConfigurationsService,
  ) {
    this.retrieveInvoices()
    this.retrieveconfigurations()
  }
  public retrieveconfigurations (){
    this.configService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      this.config = data[0]
    });  }

  openDeleteConfirmation(event: MouseEvent, row: Invoice) {
    // If an overlay is already open, close it
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    this.orderToDelete = row

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({x: event.clientX, y: event.clientY})
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

  confirmDelete() {
    if (this.orderToDelete !== null) {
      this.invoiceService.delete(this.orderToDelete.id).then(() => {
        this.overlayRef?.dispose();
      });
    }
  }

  cancelDelete() {
    this.overlayRef?.dispose();
  }

  openDialog(templateRef: TemplateRef<any>): void {
    const dialogRef = this.dialog.open(templateRef, {
      width: '50rem',
      data: {...this.invoiceData},
    });

    dialogRef.afterClosed().subscribe((result: InvoiceData | undefined) => {
      if (result) {
        console.log('Order data:', result);
      }
    });
  }

  editOrder(): void {
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
            ({id: c.payload.doc.id, ...c.payload.doc.data()})
          )
        )
      ).subscribe(data => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  openEditDialog(dialogTemplate: TemplateRef<any>, row: Invoice) {
    this.invoiceToEditId = row.id
    this.invoiceData = {...row}
    this.openDialog(dialogTemplate)
  }
  
  // changeOrderStatus(newStatus: any, order: ToOrder) {
  //   this.orderData = order
  //   this.orderData.status = newStatus
  //   this.orderToEditId = order.id
  // }

  protected displayTable(){
    this.showTable = true
  }

  protected hideTable( row: Invoice){
    this.invoiceToView = row
    this.ordersTable = new MatTableDataSource(this.invoiceToView.orders);
    this.ordersTable.sort = this.sort;
    this.totlaPriceToPay = 0
    this.totalProducts = 0

    this.invoiceToView.orders.forEach(o=>{
      this.totalProducts += 1
      let sellPrice =  o.sellPrice * this.config.conversionPrice
      if (sellPrice > 0)
{
  sellPrice = new RoundUpToFivePipe().transform(sellPrice)
  this.totlaPriceToPay += sellPrice}
    })
    this.showTable = false
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('docsIds' in changes) {
      this.retrieveInvoices()
    }

  }
}


