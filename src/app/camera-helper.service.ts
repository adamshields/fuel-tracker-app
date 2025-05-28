import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ModalController } from '@ionic/angular';
import { PhotoEntryModalComponent, PhotoEntryResult } from './photo-entry-modal.component';

export interface GarminData {
  odometer?: number;
  totalFuel?: number;
  engineHours?: number;
  speed?: number;
  range?: number;
  confidence: number;
  rawText: string;
  processingTime?: number;
  photoUri?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CameraHelperService {

  constructor(private modalCtrl: ModalController) {}

  async captureAndEnterData(useCamera: boolean = true): Promise<GarminData> {
    const startTime = Date.now();
    
    try {
      console.log('Taking photo of Garmin screen...');
      
      // Take photo or select from gallery
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: useCamera ? CameraSource.Camera : CameraSource.Photos,
        width: 1024,
        height: 1024
      });

      if (!photo.webPath) {
        throw new Error('No photo captured');
      }

      console.log('Photo captured, showing entry modal...');

      // Show the modal with photo and entry form
      const result = await this.showPhotoEntryModal(photo.webPath);
      result.processingTime = Date.now() - startTime;
      result.photoUri = photo.webPath;
      
      return result;

    } catch (error) {
      console.error('Camera Helper Error:', error);
      throw new Error(`Photo capture failed: ${error}`);
    }
  }

  private async showPhotoEntryModal(photoUri: string): Promise<GarminData> {
    console.log('Creating modal with photo:', photoUri);
    
    const modal = await this.modalCtrl.create({
      component: PhotoEntryModalComponent,
      componentProps: {
        photoUri: photoUri
      }
    });

    await modal.present();
    console.log('Modal presented');

    const { data } = await modal.onWillDismiss<PhotoEntryResult>();
    console.log('Modal dismissed with data:', data);

    if (data?.cancelled) {
      console.log('User cancelled modal');
      throw new Error('User cancelled');
    }

    const result = {
      odometer: data?.odometer,
      totalFuel: data?.totalFuel,
      engineHours: data?.engineHours,
      speed: data?.speed,
      confidence: 100, // User entered, so 100% confidence
      rawText: `User entered: Odometer=${data?.odometer}, Fuel=${data?.totalFuel}, Hours=${data?.engineHours}`,
      photoUri: photoUri
    };

    console.log('Returning GarminData:', result);
    return result;
  }

  // Quick photo reference - just show the photo for reference
  async takeReferencePhoto(useCamera: boolean = true): Promise<string> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: useCamera ? CameraSource.Camera : CameraSource.Photos
      });

      return photo.webPath || '';
    } catch (error) {
      console.error('Reference photo failed:', error);
      throw error;
    }
  }

  // Test with existing photos
  async testWithSavedPhoto(): Promise<GarminData> {
    return this.captureAndEnterData(false);
  }

  // Method specifically for testing (matches your component's expectation)
  async testWithPhoto(): Promise<GarminData> {
    return this.captureAndEnterData(false); // false = use gallery
  }
}
