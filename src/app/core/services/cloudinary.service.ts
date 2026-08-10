import { HttpClient, HttpBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { env } from '../../../env/env';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  error?: {
    message: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private _http: HttpClient;

  constructor(handler: HttpBackend) {
    this._http = new HttpClient(handler);
  }

  uploadImage(fileBlob: Blob, fileName: string): Observable<CloudinaryUploadResponse> {
    const cloudName = env.cloudinaryCloudName;
    const uploadPreset = env.cloudinaryUploadPreset;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('upload_preset', uploadPreset);

    return this._http.post<CloudinaryUploadResponse>(uploadUrl, formData);
  }
}
