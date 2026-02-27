const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for different upload types
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`), false);
    }
  };
};

// Create different upload configurations
const uploadConfigs = {
  // For documents (PDF only)
  document: multer({
    storage: storage,
    fileFilter: createFileFilter(['application/pdf']),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  }),
  
  // For profile photos (images only)
  profilePhoto: multer({
    storage: storage,
    fileFilter: createFileFilter([
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ]),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  })
};

// Function to delete a file
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  upload: uploadConfigs.document, // Default to document upload
  uploadConfigs,
  deleteFile
};