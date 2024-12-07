import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProductsComponent} from "src/app/components/products/products.component";
import {ShipmentsComponent} from "src/app/components/shipments/shipments.component";
import {ToOrderTableComponent} from "src/app/components/to-order-table/to-order-table.component";
import { InvoicesComponent } from './components/invoices/invoices.component';
import { CartComponent } from './components/cart/cart.component';

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductsComponent },
  { path: 'to-orders', component: ToOrderTableComponent },
  { path: 'shipments', component: ShipmentsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'invoices', component: InvoicesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
