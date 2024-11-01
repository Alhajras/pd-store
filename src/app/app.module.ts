import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { AddTutorialComponent } from './components/add-tutorial/add-tutorial.component';
// import { TutorialDetailsComponent } from './components/tutorial-details/tutorial-details.component';
// import { TutorialsListComponent } from './components/tutorials-list/tutorials-list.component';
// import { ToOrderTableComponent } from './components/to-order-table/to-order-table.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    // AddTutorialComponent,
    // TutorialDetailsComponent,
    // TutorialsListComponent,
    // ToOrderTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    BrowserAnimationsModule, // for firestore
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
