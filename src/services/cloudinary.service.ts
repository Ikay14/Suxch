import { Injectable } from '@nestjs/common';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { extractCloudinaryPublicId } from 'src/helpers/extract.cloudinary.url';
import cloudinary from 'src/config/cloudinary.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary.
   * @param file - The file to upload.
   * @param folder - The folder to upload the file to.
   * @param resourceType - The type of resource (e.g., 'image', 'raw', 'video', 'audio').
   * @returns Promise<UploadApiResponse | UploadApiErrorResponse>
   */
  async uploadFile(
    file: Express.Request['file'],
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file.path,
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  /** 
   * Delete a file from Cloudinary using its public ID.
   * @param publicId - The public ID of the file to delete.
   * @param resourceType - The type of resource (e.g., 'image', 'raw', 'video').
   * @returns Promise<any>
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result); 
          }
        }
      );
    });
  }

  /**
   * Extract the public ID from a Cloudinary URL.
   * @param url - The Cloudinary URL.
   * @returns string - The public ID.
   */
  extractPublicId(url: string): string {
    return extractCloudinaryPublicId(url);
  }
}