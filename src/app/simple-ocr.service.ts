import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Declare Tesseract as any to avoid type issues
declare const Tesseract: any;

export interface SimpleOCRResult {
  odometer?: number;
  totalFuel?: number;
  confidence: number;
  rawText: string;
  processingTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleOCRService {

  private tesseractLoaded = false;

  constructor() {
    this.loadTesseract();
  }

  private async loadTesseract() {
    try {
      // Load Tesseract dynamically to avoid build issues
      if (typeof window !== 'undefined' && !this.tesseractLoaded) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        script.onload = () => {
          this.tesseractLoaded = true;
          console.log('Tesseract loaded successfully');
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Failed to load Tesseract:', error);
    }
  }

  async scanGarminPhoto(useCamera: boolean = true): Promise<SimpleOCRResult> {
    const startTime = Date.now();

    try {
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

      console.log('Photo captured, starting OCR...');

      // Perform OCR
      const ocrResult = await this.performOCR(photo.webPath);
      ocrResult.processingTime = Date.now() - startTime;

      return ocrResult;

    } catch (error) {
      console.error('OCR failed:', error);
      throw error;
    }
  }

  async performOCR(imageUri: string): Promise<SimpleOCRResult> {
    // Wait for Tesseract to load
    await this.waitForTesseract();

    try {
      console.log('Processing image with OCR...');

      // Use Tesseract with optimized settings for numbers
      const { data: { text, confidence } } = await Tesseract.recognize(imageUri, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_char_whitelist: '0123456789.gal ', // Only recognize numbers, periods, 'gal', and spaces
        tessedit_pageseg_mode: '6' // Assume single uniform block of text
      });

      console.log('OCR completed. Raw text:', text);
      console.log('OCR confidence:', confidence);

      // Parse the results specifically for your Garmin
      const parsed = this.parseGarminNumbers(text);
      
      return {
        odometer: parsed.odometer,
        totalFuel: parsed.totalFuel,
        confidence: Math.round(confidence),
        rawText: text,
        processingTime: 0 // Will be set by caller
      };

    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      
      // Fallback to pattern matching if OCR fails
      return this.fallbackNumberExtraction(imageUri);
    }
  }

  private parseGarminNumbers(text: string): { odometer?: number; totalFuel?: number } {
    console.log('Parsing Garmin text:', text);

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let odometer: number | undefined;
    let totalFuel: number | undefined;

    // Extract all numbers from the text
    const allNumbers = text.match(/\d+/g)?.map(n => parseInt(n)) || [];
    console.log('All numbers found:', allNumbers);

    // Look for fuel pattern: number followed by 'gal'
    const fuelPattern = /(\d{2,3})\s*gal/i;
    const fuelMatch = text.match(fuelPattern);
    if (fuelMatch) {
      const fuel = parseInt(fuelMatch[1]);
      if (fuel >= 10 && fuel <= 500) {
        totalFuel = fuel;
        console.log('Found fuel from pattern:', totalFuel);
      }
    }

    // Look for odometer: 4-5 digit numbers
    for (const num of allNumbers) {
      // Odometer heuristic: 4000-6000 range based on your examples
      if (num >= 4000 && num <= 6000 && !odometer) {
        odometer = num;
        console.log('Found odometer:', odometer);
      }
      // Fuel heuristic if not found by pattern
      else if (!totalFuel && num >= 100 && num <= 400) {
        totalFuel = num;
        console.log('Found fuel by heuristic:', totalFuel);
      }
    }

    // If still no fuel, try any reasonable number
    if (!totalFuel) {
      for (const num of allNumbers) {
        if (num >= 50 && num <= 500 && num !== odometer) {
          totalFuel = num;
          console.log('Found fuel (backup):', totalFuel);
          break;
        }
      }
    }

    return { odometer, totalFuel };
  }

  private async fallbackNumberExtraction(imageUri: string): Promise<SimpleOCRResult> {
    console.log('Using fallback number extraction');
    
    // This is a placeholder - in a real app, you might try:
    // - Different OCR settings
    // - Image preprocessing 
    // - Template matching for your specific Garmin model
    
    return {
      odometer: undefined,
      totalFuel: undefined,
      confidence: 0,
      rawText: 'OCR failed - fallback extraction not implemented',
      processingTime: 0
    };
  }

  private async waitForTesseract(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!this.tesseractLoaded && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      
      // Check if Tesseract is available globally
      if (typeof window !== 'undefined' && (window as any).Tesseract) {
        this.tesseractLoaded = true;
        break;
      }
    }

    if (!this.tesseractLoaded) {
      throw new Error('Tesseract failed to load');
    }
  }

  // Test method
  async testWithPhoto(): Promise<SimpleOCRResult> {
    return this.scanGarminPhoto(false);
  }
}