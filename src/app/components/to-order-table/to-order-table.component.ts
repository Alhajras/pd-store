import {Component, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {TutorialService} from "src/app/services/tutorial.service";
import {map} from "rxjs";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {TemplatePortal} from "@angular/cdk/portal";
import {MatIconModule} from "@angular/material/icon";

export interface ToOrder {
  id: string;
  name: string;
  quantity: string;
  link: string;
  variant: string;
  price: string;
}

export interface OrderData {
  name: string;
  price: number;
  quantity: number;
  link: string;
  variant: string;
  notes: string;
}


/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-to-order-table',
  templateUrl: './to-order-table.component.html',
  styleUrls: ['./to-order-table.component.css'],
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule, MatIconModule],
})
export class ToOrderTableComponent {
  displayedColumns: string[] = ['id', 'name', 'price', 'quantity', 'variant', 'link', 'actions'];
  dataSource!: MatTableDataSource<ToOrder>;
  orderData: OrderData = {name: '', price: 0, quantity: 0, link: '', variant: '', notes: ''};
  private overlayRef: OverlayRef | null = null;
  private orderToDelete: ToOrder | null = null
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('confirmationDialog') confirmationDialog!: TemplateRef<any>;

  constructor(private tutorialService: TutorialService,
              public dialog: MatDialog,
              private viewContainerRef: ViewContainerRef,
              private overlay: Overlay,
  ) {
    this.retrieveTutorials()
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
      width: '400px',
      data: {...this.orderData},
    });

    dialogRef.afterClosed().subscribe((result: OrderData | undefined) => {
      if (result) {
        console.log('Order data:', result);
      }
    });
  }

  onAdd(): void {
    this.tutorialService.create(this.orderData).then(() => {
      this.dialog.closeAll()
    });

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
    this.tutorialService.getAll().snapshotChanges().pipe(
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
}


