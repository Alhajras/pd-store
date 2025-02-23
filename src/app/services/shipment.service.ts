import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {ShipmentData} from "src/app/components/shipments/shipments.component";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

export interface BaseShipment {
  aramixId: number
  internalId: number
  numberOfItems: number
  status: string
  createdTime: string
  cost: number
  image: string
  notes: string
  totalPrice: number
  orders: {orderId: string, quantity: number}[]
}

export interface Shipment extends BaseShipment {
  id: string;
}


@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private dbPath = '/shipments';
    private cloudFunctionUrl = 'https://testing-qcwtqe5maq-uc.a.run.app';

  shipmentRef: AngularFirestoreCollection<ShipmentData>;

  constructor(private db: AngularFirestore, private http: HttpClient) {
    this.shipmentRef = db.collection(this.dbPath);
  }


  getShipmentCount(): Observable<{ shipments: any[], totalShipments: number }> {
    return this.http.get<{ shipments: any[], totalShipments: number }>(this.cloudFunctionUrl)
  }

  getDocumentsByIds(ids: string[]): Observable<any[]> {
    return this.db
      .collection(this.dbPath, ref => ref.where('id', 'in', ids))
      .valueChanges();
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
