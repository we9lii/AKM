export interface User {
  name: string;
  username: string;
  email: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string; // Local blob initially, then Cloudinary URL
  secureUrl?: string; // The final HTTPS url from Cloudinary
  publicId?: string; // Cloudinary Public ID
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}