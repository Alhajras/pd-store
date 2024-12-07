import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {Observable} from "rxjs";
import { OrderData } from '../components/to-order-table/to-order-table.component';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private dbPath = '/cart';

  cartRef: AngularFirestoreCollection<OrderData>;

  constructor(private db: AngularFirestore) {
    this.cartRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<OrderData> {
    return this.cartRef;
  }

  create(cart: OrderData): any {
    return this.cartRef.add({ ...cart });
  }

  update(id: string, data: Partial<OrderData>): Promise<void> {
    return this.cartRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.cartRef.doc(id).delete();
  }
}
