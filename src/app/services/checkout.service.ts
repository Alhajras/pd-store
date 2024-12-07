import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {Observable} from "rxjs";
import { OrderData } from '../components/to-order-table/to-order-table.component';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private dbPath = '/checkout';

  checkoutRef: AngularFirestoreCollection<OrderData>;

  constructor(private db: AngularFirestore) {
    this.checkoutRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<OrderData> {
    return this.checkoutRef;
  }

  create(tutorial: OrderData): any {
    return this.checkoutRef.add({ ...tutorial });
  }

  update(id: string, data: Partial<OrderData>): Promise<void> {
    return this.checkoutRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.checkoutRef.doc(id).delete();
  }
}
