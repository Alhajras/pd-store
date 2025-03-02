import {Component, inject, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
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
import { MatCardModule } from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import { Invoice, InvoiceService } from 'src/app/services/invoice.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {
  MatSlideToggleModule,
  _MatSlideToggleRequiredValidatorModule,
} from '@angular/material/slide-toggle';
import { DateToDaysPipe } from 'src/app/pipes/datetodays.pipe';

export const SIZES: string[] = ["small", "medium", "large"];
export const BRANDS: string[] =  [
  "Anastasia Beverly Hills",
  "Balea",
  "Baylis And Harding",
  "Benefit",
  "Calvin Klein",
  "Carolina Herrera",
  "CHANEL",
  "CHARLOTTE TILBURY",
  "Chloé",
  "Color WOW",
  "Dior",
  "Dolce & Gabbana",
  "Elie Saab",
  "essence",
  "Eucerin",
  "Eyeliner",
  "Fenty Beauty",
  "Giorgio Armani",
  "Girl Of Now",
  "GIVENCHY",
  "Gucci",
  "Guess",
  "HUDA BEAUTY",
  "Jean Paul Gaultier",
  "Jimmy Choo",
  "Kiehl's",
  "Kiko",
  "KVD",
  "Lancôme",
  "LAURA MERCIER",
  "Lipstick",
  "L’Occitane",
  "MAC",
  "MIELLE ORGANICS",
  "MORPHE",
  "Morphe",
  "Narciso Rodriguez",
  "NARS",
  "NYX",
  "Paco Rabanne",
  "PAULA'S CHOICE",
  "Perfume",
  "Pixi",
  "Prada",
  "RARE BEAUTY",
  "Real Techniques",
  "Revolution",
  "Shein",
  "Sephora",
  "Sheglam",
  "SOL DE JANEIRO",
  "The Ordinary",
  "Too Faced",
  "Urban Decay",
  "Valentino",
  "VICTORIA'S SECRET",
  "Versace Bright Crystal",
  "Yves Saint Laurent"
];

interface BaseOrderInfo {
  name: string;
  price: number;
  size: "small" | "medium" | "large";
  sellPrice: number, 
  quantity: number;
  cost: number;
  link: string;
  barcode: string;
  brand: string;
  variant: string;
  notes: string;
  status: string;
  image: string;
  pdLink: string;
  published: boolean;
  madeAd: boolean;
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
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  standalone: true,
  imports:[DateToDaysPipe, MatSlideToggleModule, MatCheckboxModule, MatTooltipModule, MatCardModule, NgIf, RoundUpToFivePipe, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule, SlicePipe, MatSelectModule, NgForOf],
})
export class ProductsComponent implements OnChanges{
  private _snackBar = inject(MatSnackBar);
  public savingInProgress = false
  displayedColumns: string[] = ['image', 'name', 'variant', 'quantity', 'price',  'link', 'actions'];
  dataSource!: MatTableDataSource<ToOrder>;
  sizes = SIZES;
  brands = BRANDS;
  orderData: OrderData = {
    name: '',
    price: 0,
    cost: 0,
    size: "small",
    sellPrice: 0,
    brand: '',
    quantity: 1,
    link: '',
    published: false,
    madeAd: false,
    pdLink: '',
    barcode: '',
    variant: '',
    notes: '',
    image: '',
    status: 'draft',
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
  public config : Configurations = {conversionPrice: 0}
  public cart: OrderData[] = []
  protected totalBuyPrice = 0
  protected totalSellPrice = 0
  protected invoices: Record<string, number>  = {}
  @Input()
  docsIds!: {orderId: string, quantity: number}[]

  constructor(private readonly  productService: ProductService,
              public dialog: MatDialog,
              private shipmentService: ShipmentService,
              private storage: AngularFireStorage,
              private viewContainerRef: ViewContainerRef,
              private overlay: Overlay,
              private invoiceService: InvoiceService,
              private readonly configService: ConfigurationsService,
              private readonly cartService: CartService,
  ) {
    this.retrieveInvoices()
    this.retrieveOrders()
    this.retrieveconfigurations()
    this.retrieveCart()
  }

  public updatePublishedCheck(event: any, row: ToOrder) {
    this.orderData = row
    this.orderData.published = event.checked
    this.orderToEditId = row.id
    this.onAdd()
  }

  public updateMadeAdCheck(event: any, row: ToOrder) {
    this.orderData = row
    this.orderData.madeAd = event.checked
    this.orderToEditId = row.id
    this.onAdd()
      }

  public retrieveInvoices(): void {
    this.invoiceService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      this.invoices = {}
      data.filter(invoice=>!invoice.locked).
      filter(invoice=> invoice.status !== 'draft').
      forEach(invoice => {
        invoice.orders.forEach(order => {
          if (this.invoices[order.barcode]) {
            this.invoices[order.barcode] =  this.invoices[order.barcode]  + 1;
          } else {
            this.invoices[order.barcode] = 1;
          }
        })
      })
    });
}

  public retrieveCart (){
    this.cartService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      this.cart = data
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

  public addToCart (row: ToOrder){
    this.cartService.create(row).then(() => {
      this.dialog.closeAll()
    });
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
      this.productService.delete(this.orderToDelete.id).then(() => {
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
      this.productService.update(this.orderToEditId, this.orderData).then(() => {
        this.orderToEditId = null
        this.savingInProgress = false
        this.dialog.closeAll()
      });
    }
  }

  onAdd(): void {
    this.savingInProgress = true
    if (this.orderToEditId === null) {
      this.orderData.createdTime = new Date().toString()
      this.productService.create(this.orderData).then(() => {
        this.dialog.closeAll()
        this.savingInProgress = false
      });
    } else {
      this.editOrder()
    }
    this.orderData = {
      name: '',
      price: 0,
      cost: 0,
      size: "small",
      sellPrice: 0,
      quantity: 1,
      link: '',
      published: false,
      madeAd: false, 
      brand: '',
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

  public retrieveOrders(): void {
      this.productService.getAll().snapshotChanges().pipe(
        map(changes =>
          changes.map(c =>
            ({...c.payload.doc.data(), id: c.payload.doc.id})
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
            this.totalBuyPrice = 0
            this.totalSellPrice = 0
            data.forEach(p=>{
              this.totalBuyPrice += (isNaN(p.quantity) ? 0 : p.quantity) * (isNaN(p.price) ? 0 : p.price);
              this.totalSellPrice += (isNaN(p.quantity) ? 0 : p.quantity)  * (isNaN(p.sellPrice) ? 0 : p.sellPrice);
            })
            this.totalBuyPrice = parseFloat(this.totalBuyPrice.toFixed(2));
            this.totalSellPrice = parseFloat(this.totalSellPrice.toFixed(2)); 
            data.sort((a, b) => a.name.localeCompare(b.name));
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.validateProductsBarcodeCollisions(data)
      });
  }
  
  validateProductsBarcodeCollisions(data: ToOrder[]) {
    let errorMessage = 'The following barcodes are duplicated: ';
    const barcodeMap = new Map<string, number>();
    data.forEach(o => {
      if(o.barcode !== ''){
      if (barcodeMap.has(o.barcode)) {
        errorMessage += `${o.barcode}, `;
      } else {
        barcodeMap.set(o.barcode, 1);
      }}
    });

    if (errorMessage !== 'The following barcodes are duplicated: '){
    this._snackBar.open(errorMessage, 'Close!');}

  }

  openEditDialog(dialogTemplate: TemplateRef<any>, row: ToOrder) {
    this.orderToEditId = row.id
    this.orderData = {...row}
    this.openDialog(dialogTemplate)
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

  changeOrderBrand(newBrand: any, order: ToOrder) {
    this.orderData = order
    this.orderData.brand = newBrand
    this.orderToEditId = order.id
    this.onAdd()
  }

  changeOrderStatus(newStatus: any, order: ToOrder) {
    this.orderData = order
    this.orderData.status = newStatus
    this.orderToEditId = order.id
    this.onAdd()
  }

  moveTheOrderToShipment(): void {
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