import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {ShipmentData} from "src/app/components/shipments/shipments.component";

export interface BaseShipment {
  aramixId: number
  internalId: number
  numberOfItems: number
  status: string
  createdTime: string
  notes: string
  totalPrice: number
}

export interface Shipment extends BaseShipment {
  id: string;
}


@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private dbPath = '/shipments';

  shipmentRef: AngularFirestoreCollection<ShipmentData>;

  constructor(private db: AngularFirestore) {
    this.shipmentRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<ShipmentData> {
    return this.shipmentRef;
  }

  create(shipment: ShipmentData): any {
    return this.shipmentRef.add({ ...shipment });
  }

  update(id: string, data: Partial<ShipmentData>): Promise<void> {
    return this.shipmentRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.shipmentRef.doc(id).delete();
  }
}
