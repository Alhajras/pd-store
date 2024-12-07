import { Component,  inject } from '@angular/core';
import { Configurations, ConfigurationsService } from './services/configurations.service';
import { map } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import { CartService } from './services/cart.service';
import { OrderData } from './components/to-order-table/to-order-table.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  config : Configurations = {conversionPrice: 0}
  configID: string = ''
  private _snackBar = inject(MatSnackBar);
  public cart: OrderData[] = []

  public constructor (private readonly configService: ConfigurationsService,
    private readonly cartService: CartService,
  ){
    this.retrieveCart()
    this.configService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({id: c.payload.doc.id, ...c.payload.doc.data()})
        )
      )
    ).subscribe(data => {
      this.config = data[0]
      this.configID = data[0].id
    });  }
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
    public redirectToCart(){

    }
    public updateConfig(){
this.configService.update(this.configID, this.config).then(p=>{
  this._snackBar.open(`Updated the config to ${this.config.conversionPrice}!`, 'Close!');
})
    }
}
