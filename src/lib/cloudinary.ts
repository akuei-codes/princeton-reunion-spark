
// We're directly using the Cloudinary Upload Widget approach which works in browsers
// instead of using the Node.js SDK which requires 'fs'

export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    // Convert File to base64
    const base64data = await fileToBase64(file);
    
    // Upload to Cloudinary using fetch and FormData (browser compatible)
    const formData = new FormData();
    formData.append('file', base64data);
    formData.append('upload_preset', 'tiger-app-preset'); // Unsigned upload preset (must be created in Cloudinary dashboard)
    formData.append('folder', 'tiger-app-profiles');
    
    const cloudName = 'dmm2mff5r';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }
    
    const result = await response.json();
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
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
