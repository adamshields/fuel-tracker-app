import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface GarminData {
  odometer?: number;
  totalFuel?: number;
  engineHours?: number;
  speed?: number;
  range?: number;
  confidence: number;
  rawText: string;
  processingTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OCRService {

  constructor() {}

  async scanGarminScreen(useCamera: boolean = true): Promise<GarminData> {
    const startTime = Date.now();
    
    try {
      console.log('Starting OCR scan...');
      
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

      console.log('Photo captured, processing...');

      // For now, we'll simulate OCR and let user manually enter
      // This is a fallback until we get proper OCR working
      const mockResult = await this.simulateOCR(photo.webPath);
      mockResult.processingTime = Date.now() - startTime;
      
      return mockResult;

    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error(`OCR failed: ${error}`);
    }
  }

  private async simulateOCR(imagePath: string): Promise<GarminData> {
    // This is a placeholder that returns empty results
    // The user will need to manually enter values for now
    
    console.log('Photo captured:', imagePath);
    
    return {
      odometer: undefined,
      totalFuel: undefined,
      engineHours: undefined,
      speed: undefined,
      range: undefined,
      confidence: 0,
      rawText: 'OCR processing not available - please enter values manually',
      processingTime: 100
    };
  }

  // Alternative: Use pattern matching on known Garmin layouts
  private parseKnownGarminPatterns(imageUri: string): GarminData {
    // For your specific Garmin model, we could try to:
    // 1. Analyze pixel positions where numbers appear
    // 2. Use template matching for your specific display
    // 3. Let user train the system by marking number locations
    
    // For now, return empty and let user fill manually
    return {
      odometer: undefined,
      totalFuel: undefined,
      engineHours: undefined,
      speed: undefined,
      range: undefined,
      confidence: 0,
      rawText: 'Please enter values manually - OCR training needed for your Garmin model'
    };
  }

  // Test method for your existing photos
  async testWithSavedPhoto(): Promise<GarminData> {
    return this.scanGarminScreen(false);
  }

  // Manual training method - user can teach the system
  async trainWithPhoto(expectedValues: { odometer?: number; totalFuel?: number; engineHours?: number }): Promise<void> {
    // Future: Let user mark where numbers appear on their specific Garmin
    // Store these templates for future automatic recognition
    console.log('Training feature coming soon...', expectedValues);
  }
}