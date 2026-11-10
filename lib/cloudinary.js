/**
 * Cloudinary Configuration & Upload Utility
 * Handles image uploads with folder organization and transformation
 */
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Data - Base64 encoded image string
 * @param {string} folder - Cloudinary folder path
 * @param {Object} options - Additional upload options
 * @returns {Promise<{url: string, public_id: string}>}
 */
export async function uploadToCloudinary(
  file,
  folder = "cricket_tournament",
  options = {},
) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOptions = {
      folder,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
      ...options,
    };

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * Upload player photo with specific transformations
 */
export async function uploadPlayerPhoto(file) {
  return uploadToCloudinary(file, "cricket_tournament/player_photos", {
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
  });
}

/**
 * Upload payment screenshot
 */
export async function uploadPaymentScreenshot(file) {
  return uploadToCloudinary(
    file,
    "cricket_tournament/payment_screenshots",
    {
      transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
    },
  );
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
}

export default cloudinary;
