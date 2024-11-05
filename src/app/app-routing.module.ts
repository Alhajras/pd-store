import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ToOrderTableComponent} from "src/app/components/to-order-table/to-order-table.component";
import {ShipmentsComponent} from "src/app/components/shipments/shipments.component";

const routes: Routes = [
  { path: '', redirectTo: 'tutorials', pathMatch: 'full' },
  { path: 'to-orders', component: ToOrderTableComponent },
  { path: 'shipments', component: ShipmentsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
