
// We're directly using the Cloudinary Upload Widget approach which works in browsers
// instead of using the Node.js SDK which requires 'fs'

// Updated to use the correct preset name and folder
const CLOUDINARY_PRESET = 'unsigned_preset';
const CLOUDINARY_CLOUD_NAME = 'dmm2mff5r';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    console.log("Starting Cloudinary upload for file:", file.name, "size:", file.size);
    // Convert File to base64
    const base64data = await fileToBase64(file);
    
    if (!base64data) {
      throw new Error("Failed to convert file to base64");
    }
    
    // Create form data with required parameters
    const formData = new FormData();
    formData.append('file', base64data);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', 'user-photos');
    
    console.log("Sending request to Cloudinary with preset:", CLOUDINARY_PRESET);
    
    // Using direct fetch to track request/response
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary error response:", errorText);
      throw new Error(`Failed to upload to Cloudinary: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Cloudinary upload successful:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => {
      console.error("FileReader error:", error);
      reject(error);
    };
  });
};
