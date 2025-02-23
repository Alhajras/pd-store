import {Component, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {TutorialService} from "src/app/services/tutorial.service";
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
import { ProductService } from 'src/app/services/product.service';
import { BRANDS, SIZES } from '../products/products.component';
import { Configurations, ConfigurationsService } from 'src/app/services/configurations.service';
import { RoundUpToFivePipe } from 'src/app/pipes/round-up-to-five.pipe';
import {MatTooltipModule} from '@angular/material/tooltip';
import {
  MatSlideToggleModule,
  _MatSlideToggleRequiredValidatorModule,
} from '@angular/material/slide-toggle';

export interface BaseOrderInfo {
  name: string;
  price: number;
  sellPrice: number;
  cost: number;
  quantity: number;
  link: string;
  size: "small" | "medium" | "large";
  barcode: string;
  variant: string;
  brand: string;
  notes: string;
  status: string;
  published: boolean;
  madeAd: boolean;
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
  selector: 'app-to-order-table',
  templateUrl: './to-order-table.component.html',
  styleUrls: ['./to-order-table.component.css'],
  standalone: true,
  imports: [MatSlideToggleModule, MatTooltipModule, NgIf, RoundUpToFivePipe ,MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule, SlicePipe, MatSelectModule, NgForOf],
})
export class ToOrderTableComponent implements OnChanges{
  displayedColumns: string[] = ['image', 'name', 'variant', 'quantity', 'price',  'link', 'notes', 'status', 'actions'];
  dataSource!: MatTableDataSource<ToOrder>;
  orderData: OrderData = {
    name: '',
    size: 'small',
    price: 0,
    cost: 0,
    sellPrice: 0,
    brand: '',
    quantity: 1,
    link: '',
    published: false,
    madeAd: false,  
    barcode: '',
    pdLink: '',
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
  public moveTo = {quantity: 1, orderId: '', target: '', maxQuantity: 1}
  public shipments: Shipment[] = []
  sizes = SIZES;
  brands = BRANDS;
  public config : Configurations = {conversionPrice: 0}
  public ordersCostMap: Record<string, number> = {};

  // This is used when we want to calculate each order's shipping cost
  @Input()
  shipmentCost!: number
  @Input()
  docsIds!: {orderId: string, quantity: number}[]

  constructor(private tutorialService: TutorialService,
              private productService: ProductService,
              public dialog: MatDialog,
              private readonly configService: ConfigurationsService,
              private shipmentService: ShipmentService,
              private storage: AngularFireStorage,
              private viewContainerRef: ViewContainerRef,
              private overlay: Overlay,
  ) {
    this.retrieveOrders()
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
      this.tutorialService.delete(this.orderToDelete.id).then(() => {
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
      data: {...this.orderData},
    });

    dialogRef.afterClosed().subscribe((result: OrderData | undefined) => {
      if (result) {
        console.log('Order data:', result);
      }
    });
  }

  editOrder(): void {
    if (this.orderToEditId !== null) {
      this.tutorialService.update(this.orderToEditId, this.orderData).then(() => {
        this.orderToEditId = null
        this.dialog.closeAll()
      });
    }
  }

  onAdd(): void {
    if (this.orderToEditId === null) {
      this.orderData.createdTime = new Date().toString()
      this.tutorialService.create(this.orderData).then(() => {
        this.dialog.closeAll()
      });
    } else {
      this.editOrder()
    }
    this.orderData = {
      name: '',
      size: 'small',
      cost: 0,
      price: 0,
      brand: '',
      published: false,
      madeAd: false, 
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

  public retrieveOrders(): void {
      this.tutorialService.getAll().snapshotChanges().pipe(
        map(changes =>
          changes.map(c =>
            ({id: c.payload.doc.id, ...c.payload.doc.data()})
          )
        )
      ).subscribe(data => {
            if (this.docsIds !== undefined) {
              let docs = this.docsIds.map(doc=>doc.orderId) as string[]
              data = data.filter(d=>docs.findIndex(doc=> doc === d.id) !== -1)

              this.docsIds.forEach(doc => {
                const order = data.find(item => item.id === doc.orderId);
                if (order) {
                  order.quantity = doc.quantity;
                }
              });

            }
        this.ordersCostMap =  this.calculateShippingCosts(this.shipmentCost, data)
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  openEditDialog(dialogTemplate: TemplateRef<any>, row: ToOrder) {
    this.orderToEditId = row.id
    this.orderData = {...row}
    this.openDialog(dialogTemplate)
  }


  calculateShippingCosts(
    totalShippingCost: number,
    orders: ToOrder[]
  ): Record<string, number> {
    const weightMap = {
      small: 1,
      medium: 2,
      large: 3,
    };
  
    // Calculate total weighted quantity
    const totalWeight = orders.reduce(
      (sum, order) => sum + weightMap[order.size] * order.quantity,
      0
    );
  
    // Distribute shipping cost based on weighted quantity
    const shippingCosts: Record<string, number> = {};
    for (const order of orders) {
      const orderWeight = weightMap[order.size] * order.quantity;
      shippingCosts[order.barcode] = parseFloat(((orderWeight / totalWeight) * totalShippingCost).toFixed(2));
    }
    
    return shippingCosts;
  }

  openMoveToDialog(dialogTemplate: TemplateRef<any>, row: ToOrder) {
    this.retrieveShipments()
    this.moveTo.maxQuantity = row.quantity
    this.moveTo.orderId = row.id
    this.orderData = row
    this.orderToEditId = row.id
    this.openDialog(dialogTemplate)
  }

  public retrieveShipments(): void {
    this.shipmentService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      this.shipments = data
    });
  }

  changeOrderStatus(newStatus: any, order: ToOrder) {
    this.orderData = order
    this.orderData.status = newStatus
    this.orderToEditId = order.id
    this.onAdd()
  }
  moveToAllProducts(): void {
// Find the index of the order within the shipment
const order = this.dataSource.data.find(o => o.id === this.moveTo.orderId);
this.productService.create(order as BaseOrderInfo)
  }

  moveTheOrderToShipment(): void {
    if (this.moveTo.target === 'All products'){
     this.moveToAllProducts()
     this.dialog.closeAll()
      return 
    }
// Find the target shipment
const shipment = this.shipments.find(s => s.id === this.moveTo.target);
if (!shipment) return;

// Find the index of the order within the shipment
const orderIndex = shipment.orders?.findIndex(o => o.orderId === this.moveTo.orderId);

if (orderIndex !== undefined && orderIndex >= 0) {
  // Update the quantity of the existing order
  shipment.orders[orderIndex].quantity += this.moveTo.quantity;
} else {
  // Add a new order to the shipment
  shipment.orders = shipment.orders || []; // Ensure orders array is initialized
  shipment.orders.push({ orderId: this.moveTo.orderId, quantity: this.moveTo.quantity });
}

// Update the overall order data quantity
this.orderData.quantity -= this.moveTo.quantity;
    this.updateShipment(shipment.id, shipment)
    this.editOrder()
  }

  updateShipment(id: string, shipment: Shipment): void {
    this.shipmentService.update(id, shipment).then(() => {
      console.log('done')
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('docsIds' in changes) {
      this.retrieveOrders()
    }

  }
}


