import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {OrderData} from "src/app/components/to-order-table/to-order-table.component";

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private dbPath = '/orders';

  tutorialsRef: AngularFirestoreCollection<OrderData>;

  constructor(private db: AngularFirestore) {
    this.tutorialsRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<OrderData> {
    return this.tutorialsRef;
  }

  create(tutorial: OrderData): any {
    return this.tutorialsRef.add({ ...tutorial });
  }

  update(id: string, data: any): Promise<void> {
    return this.tutorialsRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.tutorialsRef.doc(id).delete();
  }
}
