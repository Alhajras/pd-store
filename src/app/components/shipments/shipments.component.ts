import {Component, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
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
import {SlicePipe} from "@angular/common";
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {MatSelectModule} from "@angular/material/select";
import {Shipment, ShipmentService} from "src/app/services/shipment.service";
import {BaseShipment} from "src/app/services/shipment.service";

export type ShipmentData = BaseShipment

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-shipments',
  templateUrl: './shipments.component.html',
  styleUrls: ['./shipments.component.css'],
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule, SlicePipe, MatSelectModule],
})
export class  ShipmentsComponent {
  displayedColumns: string[] = ['image', 'aramixId', 'internalId', 'numberOfItems', 'totalPrice', 'notes', 'status', 'actions'];
  dataSource!: MatTableDataSource<Shipment>;
  orderData: ShipmentData = {image: '', aramixId: 0, internalId: 0, numberOfItems: 1, totalPrice: 0, notes: '', status: 'new', createdTime: ''};
  private overlayRef: OverlayRef | null = null;
  private orderToDelete: Shipment | null = null
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('confirmationDialog') confirmationDialog!: TemplateRef<any>;
  public orderToEditId: string | null = null;
  public defaultImage = "https://firebasestorage.googleapis.com/v0/b/pixie-dus.firebasestorage.app/o/uploads%2F2024-11-03_19-07.png?alt=media&token=da907319-c356-41a7-8ddc-816e2db35313"


  constructor(private shipmentService: ShipmentService,
              public dialog: MatDialog,
              private storage: AngularFireStorage,
              private viewContainerRef: ViewContainerRef,
              private overlay: Overlay,
  ) {
    this.retrieveTutorials()
  }


  uploadFile(event: any, row: Shipment) {
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
            this.onAdd()
          });
        })
      )
      .subscribe();
  }

  openDeleteConfirmation(event: MouseEvent, row: Shipment) {
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
      this.shipmentService.delete(this.orderToDelete.id).then(() => {
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

    dialogRef.afterClosed().subscribe((result: ShipmentData | undefined) => {
      if (result) {
        console.log('Order data:', result);
      }
    });
  }

  onAdd(): void {
    if (this.orderToEditId === null) {
      this.orderData.createdTime = new Date().toString()
      this.shipmentService.create(this.orderData).then(() => {
        this.dialog.closeAll()
      });
    } else {
      this.shipmentService.update(this.orderToEditId, this.orderData).then(() => {
        this.orderToEditId = null
        this.dialog.closeAll()
      });

    }
      this.orderData  = {image: '', aramixId: 0, internalId: 0, numberOfItems: 1, totalPrice: 0, notes: '', status: 'new', createdTime: ''};
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

  public retrieveTutorials(): void {
    this.shipmentService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      const orders: any[] = data

      // Assign the data to the data source for the table to render
      this.dataSource = new MatTableDataSource(orders);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  openEditDialog(dialogTemplate: TemplateRef<any>, row: Shipment) {
    this.orderToEditId = row.id
    this.orderData = {...row}
    this.openDialog(dialogTemplate)
  }

  changeOrderStatus(newStatus: any, order: Shipment) {
    this.orderData = order
    this.orderData.status = newStatus
    this.orderToEditId = order.id
    this.onAdd()
  }
}


