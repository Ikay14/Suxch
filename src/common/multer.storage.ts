import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from 'src/config/cloudinary.config';
import path from 'path';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = 'uploads'; // Default folder for generic files

    // Determine folder based on file type
    if (file.mimetype.startsWith('image/')) {
      folder = 'uploads/images'; // Folder for images
    } else if (file.mimetype.startsWith('application/pdf')) {
      folder = 'uploads/documents'; // Folder for PDF documents
    }

    return {
      folder,
      allowedFormats: ['jpeg', 'jpg', 'png', 'pdf', 'doc', 'docx', 'txt'], // Allowed file formats
      transformation: file.mimetype.startsWith('image/')
        ? [{ width: 500, height: 500, crop: 'limit' }] // Apply transformations only for images
        : undefined,
    };
  },
});

// File filter to allow images, documents, and other files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
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