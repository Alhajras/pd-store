import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ToOrderTableComponent} from "src/app/components/to-order-table/to-order-table.component";

const routes: Routes = [
  { path: '', redirectTo: 'tutorials', pathMatch: 'full' },
  { path: 'tutorials', component: ToOrderTableComponent },
  // { path: 'add', component: AddTutorialComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
