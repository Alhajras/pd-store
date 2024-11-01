import {Component, TemplateRef, ViewChild} from '@angular/core';
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
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatDialogModule, FormsModule],
})
export class ToOrderTableComponent {
  displayedColumns: string[] = ['id', 'name', 'price', 'quantity', 'variant', 'link'];
  dataSource!: MatTableDataSource<ToOrder>;
  orderData: OrderData = {name: '', price: 0, quantity: 0, link: '', variant: '', notes: ''};

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private tutorialService: TutorialService,
              public dialog: MatDialog,
  ) {
    this.retrieveTutorials()
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


