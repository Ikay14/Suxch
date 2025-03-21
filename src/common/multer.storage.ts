import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from 'src/config/cloudinary.config';
import path from 'path';
// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'uploads'; // Default folder for generic files
    let format: string | undefined = undefined;
    let transformation;

    // Determine folder and format based on file type
    if (file.mimetype.startsWith('image/')) {
      folder = 'uploads/images';
      format = 'jpeg'; // Default format for images
      transformation = [{ width: 500, height: 500, crop: 'limit' }];
    } else if (file.mimetype.startsWith('application/pdf')) {
      folder = 'uploads/documents';
      format = 'pdf';
    } else if (file.mimetype.startsWith('application/msword') || file.mimetype.includes('wordprocessingml')) {
      folder = 'uploads/documents';
      format = 'docx';
    } else if (file.mimetype.startsWith('text/plain')) {
      folder = 'uploads/text';
      format = 'txt';
    }

    return {
      folder,
      format,
      transformation,
    };
  },
});

// File filter to allow images, PDFs, and text files
const fileFilter = (
  req: Express.Request,
  file: Express.Request['file'],
  cb: multer.FileFilterCallback
) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;

  const mimetype = allowedFileTypes.test(file.mimetype);

  if ( mimetype) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, JPG, PNG, PDF, DOC, DOCX, and TXT are allowed.'
      )
    );
  }
};

// Multer options
export const multerOptions = {
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  },
};


