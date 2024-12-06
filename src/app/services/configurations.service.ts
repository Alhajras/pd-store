import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import {Observable} from "rxjs";

export interface Configurations {
  conversionPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationsService {
  private dbPath = '/configurations';

  configurationsRef: AngularFirestoreCollection<Configurations>;

  constructor(private db: AngularFirestore) {
    this.configurationsRef = db.collection(this.dbPath);
  }

  getAll(): AngularFirestoreCollection<Configurations> {
    return this.configurationsRef;
  }

  create(configurations: Configurations): any {
    return this.configurationsRef.add({ ...configurations });
  }

  update(id: string, data: Partial<Configurations>): Promise<void> {
    return this.configurationsRef.doc(id).update(data);
  }

  delete(id: string): Promise<void> {
    return this.configurationsRef.doc(id).delete();
  }
}
