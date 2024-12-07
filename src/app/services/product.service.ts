import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {OrderData} from "src/app/components/to-order-table/to-order-table.component";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private dbPath = '/products';

  producstRef: AngularFirestoreCollection<OrderData>;

  constructor(private db: AngularFirestore) {
    this.producstRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<OrderData> {
    return this.producstRef;
  }

  create(tutorial: OrderData): any {
    return this.producstRef.add({ ...tutorial });
  }

  update(id: string, data: Partial<OrderData>): Promise<void> {
    return this.producstRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.producstRef.doc(id).delete();
  }
}
