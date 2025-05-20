import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton } from '@ionic/angular/standalone';
import { TripStorageService } from '../trip-storage.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonButton, IonTextarea, IonInput, IonLabel, IonItem, IonHeader, IonToolbar, IonTitle, IonContent, CommonModule, FormsModule, RouterModule],
})
export class HomePage {

  center = '';
  port = '';
  stbd = '';
  notes = '';

  constructor(private tripService: TripStorageService) {}

  async saveTrip() {
    const newTrip = {
      id: crypto.randomUUID(), // or Date.now().toString()
      date: new Date().toISOString().split('T')[0],
      center: parseFloat(this.center),
      port: parseFloat(this.port),
      stbd: parseFloat(this.stbd),
      notes: this.notes
    };
  
    await this.tripService.addTrip(newTrip);
    this.center = this.port = this.stbd = this.notes = '';
  }
  
  
}
