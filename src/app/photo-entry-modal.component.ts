import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonItem, IonLabel, IonInput, IonNote, IonCard, 
  IonCardContent, IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';

export interface PhotoEntryResult {
  odometer?: number;
  totalFuel?: number;
  engineHours?: number;
  speed?: number;
  cancelled?: boolean;
}

@Component({
  selector: 'app-photo-entry-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonItem, IonLabel, IonInput, IonNote, IonCard, 
    IonCardContent, IonCardHeader, IonCardTitle
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Enter Values from Photo</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()" fill="clear">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <!-- Photo Display -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="camera-outline"></ion-icon>
            Your Garmin Screen
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div style="text-align: center;">
            <img 
              [src]="photoUri" 
              style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 2px solid #ddd;" 
              alt="Garmin Screen Photo"
            />
            <p style="margin-top: 10px; font-size: 14px; color: #666;">
              Look at your Garmin screen above and enter the values below
            </p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Entry Form -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="create-outline"></ion-icon>
            Enter Values
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          
          <ion-item>
            <ion-icon name="speedometer-outline" slot="start" color="primary"></ion-icon>
            <ion-label position="stacked">Odometer Reading</ion-label>
            <ion-input 
              type="number" 
              [(ngModel)]="formData.odometer"
              placeholder="e.g., 4741">
            </ion-input>
            <ion-note slot="helper">Current odometer miles</ion-note>
          </ion-item>

          <ion-item>
            <ion-icon name="calculator-outline" slot="start" color="success"></ion-icon>
            <ion-label position="stacked">Total Fuel</ion-label>
            <ion-input 
              type="number" 
              [(ngModel)]="formData.totalFuel"
              placeholder="e.g., 136">
            </ion-input>
            <ion-note slot="helper">Total gallons shown on Garmin</ion-note>
          </ion-item>

          <ion-item>
            <ion-icon name="time-outline" slot="start" color="tertiary"></ion-icon>
            <ion-label position="stacked">Engine Hours</ion-label>
            <ion-input 
              type="number" 
              [(ngModel)]="formData.engineHours"
              placeholder="e.g., 940">
            </ion-input>
            <ion-note slot="helper">Engine hours (optional)</ion-note>
          </ion-item>

          <ion-item>
            <ion-icon name="boat-outline" slot="start" color="warning"></ion-icon>
            <ion-label position="stacked">Speed</ion-label>
            <ion-input 
              type="number" 
              [(ngModel)]="formData.speed"
              placeholder="e.g., 0.0">
            </ion-input>
            <ion-note slot="helper">Current speed in knots (optional)</ion-note>
          </ion-item>

        </ion-card-content>
      </ion-card>

      <!-- Action Buttons -->
      <ion-card>
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="success"
            (click)="useValues()"
            [disabled]="!hasRequiredValues()">
            <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
            Use These Values
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline"
            color="medium"
            (click)="cancel()"
            class="ion-margin-top">
            <ion-icon name="close-outline" slot="start"></ion-icon>
            Cancel
          </ion-button>
          
          <ion-item *ngIf="!hasRequiredValues()" color="warning" lines="none" class="ion-margin-top">
            <ion-icon name="alert-circle-outline" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">
              <strong>Enter at least odometer or fuel values</strong>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

    </ion-content>
  `
})
export class PhotoEntryModalComponent {
  @Input() photoUri!: string;

  formData = {
    odometer: undefined as number | undefined,
    totalFuel: undefined as number | undefined,
    engineHours: undefined as number | undefined,
    speed: undefined as number | undefined
  };

  constructor(private modalCtrl: ModalController) {}

  hasRequiredValues(): boolean {
    return !!(this.formData.odometer || this.formData.totalFuel);
  }

  async useValues() {
    console.log('useValues clicked, formData:', this.formData);
    
    const result: PhotoEntryResult = {
      odometer: this.formData.odometer,
      totalFuel: this.formData.totalFuel,
      engineHours: this.formData.engineHours,
      speed: this.formData.speed,
      cancelled: false
    };

    console.log('Modal result:', result);
    
    await this.modalCtrl.dismiss(result);
  }

  async cancel() {
    console.log('Modal cancelled');
    await this.modalCtrl.dismiss({ cancelled: true });
  }
}