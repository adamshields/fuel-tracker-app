import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ModalController } from '@ionic/angular';
import { PhotoEntryModalComponent, PhotoEntryResult } from './photo-entry-modal.component';
import { SimpleOCRService, SimpleOCRResult } from './simple-ocr.service';

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
  ocrResult?: SimpleOCRResult;
}

@Injectable()
export class HybridCameraService {

  constructor(
    private modalCtrl: ModalController,
    private ocrService: SimpleOCRService
  ) {}

  async captureAndProcess(useCamera: boolean = true): Promise<GarminData> {
    const startTime = Date.now();
    
    try {
      console.log('Taking photo of Garmin screen...');
      
      // Take photo
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

      console.log('Photo captured, trying OCR first...');

      try {
        // Try OCR first
        const ocrResult = await this.ocrService.performOCR(photo.webPath);
        console.log('OCR completed:', ocrResult);

        // If OCR found good results, use them
        if (ocrResult.confidence > 30 && (ocrResult.odometer || ocrResult.totalFuel)) {
          return {
            odometer: ocrResult.odometer,
            totalFuel: ocrResult.totalFuel,
            confidence: ocrResult.confidence,
            rawText: `OCR: ${ocrResult.rawText}`,
            processingTime: Date.now() - startTime,
            photoUri: photo.webPath,
            ocrResult: ocrResult
          };
        } else {
          console.log('OCR results not confident enough, showing manual entry...');
          // Fall back to manual entry with OCR pre-fill
          return await this.showManualEntryWithOCR(photo.webPath, ocrResult, startTime);
        }

      } catch (ocrError) {
        console.log('OCR failed, falling back to manual entry:', ocrError);
        // Fall back to manual entry
        return await this.showManualEntry(photo.webPath, startTime);
      }

    } catch (error) {
      console.error('Camera capture failed:', error);
      throw error;
    }
  }

  private async showManualEntryWithOCR(photoUri: string, ocrResult: SimpleOCRResult, startTime: number): Promise<GarminData> {
    console.log('Showing manual entry with OCR pre-fill');
    
    const modal = await this.modalCtrl.create({
      component: PhotoEntryModalComponent,
      componentProps: {
        photoUri: photoUri,
        prefilledData: {
          odometer: ocrResult.odometer,
          totalFuel: ocrResult.totalFuel
        },
        ocrInfo: `OCR found: ${ocrResult.odometer || '?'} miles, ${ocrResult.totalFuel || '?'} gal (${ocrResult.confidence}% confidence)`
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss<PhotoEntryResult>();

    if (data?.cancelled) {
      throw new Error('User cancelled');
    }

    return {
      odometer: data?.odometer,
      totalFuel: data?.totalFuel,
      confidence: 100, // User verified
      rawText: `OCR + Manual: ${ocrResult.rawText} | User entered: ${data?.odometer}, ${data?.totalFuel}`,
      processingTime: Date.now() - startTime,
      photoUri: photoUri,
      ocrResult: ocrResult
    };
  }

  private async showManualEntry(photoUri: string, startTime: number): Promise<GarminData> {
    console.log('Showing manual entry only');
    
    const modal = await this.modalCtrl.create({
      component: PhotoEntryModalComponent,
      componentProps: {
        photoUri: photoUri
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss<PhotoEntryResult>();

    if (data?.cancelled) {
      throw new Error('User cancelled');
    }

    return {
      odometer: data?.odometer,
      totalFuel: data?.totalFuel,
      confidence: 100,
      rawText: `Manual entry: Odometer=${data?.odometer}, Fuel=${data?.totalFuel}`,
      processingTime: Date.now() - startTime,
      photoUri: photoUri
    };
  }

  // Test methods
  async testWithPhoto(): Promise<GarminData> {
    return this.captureAndProcess(false);
  }

  async testOCROnly(): Promise<SimpleOCRResult> {
    return this.ocrService.testWithPhoto();
  }
}