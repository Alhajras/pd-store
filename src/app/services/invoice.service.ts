import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { OrderData } from '../components/to-order-table/to-order-table.component';

interface BaseInvoiceInfo {
  name: string,
  address: string,
  phoneNumber: string,
  notes: string,
  createdTime: string,
  orders: OrderData[],
  status: string
}

export interface Invoice extends BaseInvoiceInfo {
  id: string
}

export type InvoiceData = BaseInvoiceInfo

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private dbPath = '/invoices';

  checkoutRef: AngularFirestoreCollection<InvoiceData>;

  constructor(private db: AngularFirestore) {
    this.checkoutRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<InvoiceData> {
    return this.checkoutRef;
  }

  create(tutorial: InvoiceData): any {
    return this.checkoutRef.add({ ...tutorial });
  }

  update(id: string, data: Partial<InvoiceData>): Promise<void> {
    return this.checkoutRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.checkoutRef.doc(id).delete();
  }
}
