import {Component, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ProductService} from "src/app/services/product.service";
import {finalize, map} from "rxjs";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {TemplatePortal} from "@angular/cdk/portal";
import {MatIconModule} from "@angular/material/icon";
import {NgForOf, SlicePipe, NgIf} from "@angular/common";
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {MatSelectModule} from "@angular/material/select";
import {Shipment, ShipmentService} from "src/app/services/shipment.service";
import { Configurations, ConfigurationsService } from 'src/app/services/configurations.service';
import { RoundUpToFivePipe } from 'src/app/pipes/round-up-to-five.pipe';
import { CartService } from 'src/app/services/cart.service';
import { InvoiceService, InvoiceData } from 'src/app/services/invoice.service';
import {MatCardModule} from '@angular/material/card';

interface BaseOrderInfo {
  name: string;
  price: number;
  sellPrice: number, 
  quantity: number;
  link: string;
  barcode: string;
  variant: string;
  notes: string;
  status: string;
  image: string;
  pdLink: string;
  createdTime: string;
}

export interface ToOrder extends BaseOrderInfo {
  id: string;
}

export type OrderData = BaseOrderInfo


/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: true,
  imports:[MatCardModule, NgIf, RoundUpToFivePipe, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule, SlicePipe, MatSelectModule, NgForOf],
})
export class CartComponent {
  displayedColumns: string[] = ['image', 'name', 'variant', 'price', 'actions'];
  dataSource!: MatTableDataSource<ToOrder>;
  invoiceData: InvoiceData = {
    name: '',
    address: '',
    phoneNumber: '',
    notes: '',
    createdTime: '',
    orders: []
  }

  orderData: OrderData = {
    name: '',
    price: 0,
    sellPrice: 0,
    quantity: 1,
    link: '',
    pdLink: '',
    barcode: '',
    variant: '',
    notes: '',
    image: '',
    status: 'new',
    createdTime: ''
  };
  private overlayRef: OverlayRef | null = null;
  private orderToDelete: ToOrder | null = null
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('confirmationDialog') confirmationDialog!: TemplateRef<any>;
  public orderToEditId: string | null = null;
  public defaultImage = "https://firebasestorage.googleapis.com/v0/b/pixie-dus.firebasestorage.app/o/uploads%2F2024-11-03_19-07.png?alt=media&token=da907319-c356-41a7-8ddc-816e2db35313"
  public config : Configurations = {conversionPrice: 0}
  public cart: OrderData[] = []
  protected totlaPriceToPay = 0
  protected totalProducts = 0

  @Input()
  docsIds!: {orderId: string, quantity: number}[]

  constructor(
              public dialog: MatDialog,
              private storage: AngularFireStorage,
              private viewContainerRef: ViewContainerRef,
              private overlay: Overlay,
              private readonly configService: ConfigurationsService,
              private readonly cartService: CartService,
              private readonly checkoutService: InvoiceService
  ) {
    this.retrieveconfigurations()
  }

  public retrieveCart (){
    this.cartService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({ ...c.payload.doc.data(), id: c.payload.doc.id})
        )
      )
    ).subscribe(data => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      this.totlaPriceToPay = 0
    this.totalProducts = 0

    data.forEach(o=>{
      this.totalProducts += 1
      let sellPrice =  o.sellPrice * this.config.conversionPrice
      if (sellPrice > 0)
{
  sellPrice = new RoundUpToFivePipe().transform(sellPrice)
  this.totlaPriceToPay += sellPrice}
    })
    });  }

  public retrieveconfigurations (){
    this.configService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      this.config = data[0]
      this.retrieveCart()
    });  }

  uploadFile(event: any, row: ToOrder) {
    const file = event.target.files[0];
    const filePath = `uploads/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            row.image = url
            this.orderData = row
            this.orderToEditId = row.id
            this.editOrder()
          });
        })
      )
      .subscribe();
  }

  openDeleteConfirmation(event: MouseEvent, row: ToOrder) {
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
      this.cartService.delete(this.orderToDelete.id).then(() => {
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

    dialogRef.afterClosed().subscribe((result: OrderData | undefined) => {
      if (result) {
        console.log('Order data:', result);
      }
    });
  }

  editOrder(): void {
    if (this.orderToEditId !== null) {
      this.cartService.update(this.orderToEditId, this.orderData).then(() => {
        this.orderToEditId = null
        this.dialog.closeAll()
      });
    }
  }

  clearCart(){
    this.dataSource.data.forEach(order =>{
      this.cartService.delete(order.id).then(() => {});
    })

  }
  createInvoice(){
    this.invoiceData.createdTime = new Date().toString()
    this.invoiceData.orders = this.dataSource.data
    this.checkoutService.create(this.invoiceData).then(() => {
      this.clearCart()
      this.dialog.closeAll()
    });

  }
  onAdd(): void {
    if (this.orderToEditId === null) {
      this.orderData.createdTime = new Date().toString()
      this.cartService.create(this.orderData).then(() => {
        this.dialog.closeAll()
      });
    } else {
      this.editOrder()
    }
    this.orderData = {
      name: '',
      price: 0,
      sellPrice: 0,
      quantity: 1,
      link: '',
      barcode: '',
      pdLink: '',
      variant: '',
      notes: '',
      image: '',
      status: 'new',
      createdTime: ''
    };
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

  openEditDialog(dialogTemplate: TemplateRef<any>, row: ToOrder) {
    this.orderToEditId = row.id
    this.orderData = {...row}
    this.openDialog(dialogTemplate)
  }

  changeOrderStatus(newStatus: any, order: ToOrder) {
    this.orderData = order
    this.orderData.status = newStatus
    this.orderToEditId = order.id
    this.onAdd()
  }
}


