// encryption.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private encryptionKey: string = '';

  constructor() { }

  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  getEncryptionKey(): string {
    return this.encryptionKey;
  }
}
