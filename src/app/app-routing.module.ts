import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProductsComponent} from "src/app/components/products/products.component";
import {ShipmentsComponent} from "src/app/components/shipments/shipments.component";
import {ToOrderTableComponent} from "src/app/components/to-order-table/to-order-table.component";
import { InvoicesComponent } from './components/invoices/invoices.component';
import { CartComponent } from './components/cart/cart.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './components/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full'},
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard] },
  { path: 'to-orders', component: ToOrderTableComponent , canActivate: [AuthGuard] },
  { path: 'shipments', component: ShipmentsComponent , canActivate: [AuthGuard]},
  { path: 'cart', component: CartComponent , canActivate: [AuthGuard]},
  { path: 'invoices', component: InvoicesComponent , canActivate: [AuthGuard]},
  { path: 'login', component: LoginComponent},
  { path: 'analytics', component: AnalyticsComponent , canActivate: [AuthGuard]}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
