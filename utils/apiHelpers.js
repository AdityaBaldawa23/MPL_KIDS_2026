/**
 * API Response & Error Handler Utilities
 */
import crypto from "crypto";
import {
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "../constants/playerOptions";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mplkids2026admin";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "mpl_kids_2026_super_secret_key";

/**
 * Generate a deterministic HMAC session token for the admin password
 */
export function createAdminToken() {
  const hmac = crypto.createHmac("sha256", ADMIN_SECRET);
  hmac.update(`admin_session_${ADMIN_PASSWORD}`);
  return hmac.digest("hex");
}

/**
 * Verify whether an incoming request has valid admin credentials
 */
export function verifyAdminAuth(request) {
  try {
    const expectedToken = createAdminToken();

    // 1. Check Authorization Bearer header
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === expectedToken || token === ADMIN_PASSWORD) return true;
    }

    // 2. Check x-admin-token header
    const customToken =
      request.headers.get("x-admin-token") ||
      request.headers.get("x-admin-password");
    if (customToken && (customToken === expectedToken || customToken === ADMIN_PASSWORD)) {
      return true;
    }

    // 3. Check admin_token in Cookies
    const cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader
          .split(";")
          .map((c) => c.trim().split("="))
          .filter((pair) => pair.length === 2),
      );
      if (cookies.admin_token === expectedToken) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Verify raw password against admin password
 */
export function verifyAdminPassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.trim() === ADMIN_PASSWORD;
}

/**
 * Standard API success response
 */
export function successResponse(data, message = "Success", status = 200) {
  return Response.json(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

/**
 * Standard API error response
 */
export function errorResponse(message = "Internal Server Error", status = 500, errors = null) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return Response.json(body, { status });
}

/**
 * Parse Mongoose validation errors into readable format
 */
export function parseMongooseErrors(error) {
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    const message = errors[0]?.message || "Validation failed";
    return { message, errors, status: 400 };
  }

  // Duplicate key error (unique constraint)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    const value = error.keyValue ? error.keyValue[field] : "";
    const fieldDisplayName =
      field === "transactionId"
        ? "Transaction ID"
        : field === "playerPhone"
          ? "Mobile number"
          : field === "playerID"
            ? "Player ID"
            : field;
    return {
      message: `${fieldDisplayName} "${value}" is already registered. Please use a unique value.`,
      status: 409,
    };
  }

  return { message: error.message || "Database error", status: 500 };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body, fields) {
  const missing = fields.filter((field) => {
    const val = body[field];
    if (val === null || val === undefined) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    return false;
  });
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }
  return null;
}

/**
 * Validate Indian mobile number format (10 digits starting with 6-9)
 */
export function validateMobile(mobile) {
  if (!mobile || typeof mobile !== "string") return false;
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.trim());
}

/**
 * Calculate age dynamically from Date of Birth.
 * Falls back to historical Age if DOB is missing.
 */
export function calculateAge(dob, fallbackAge = null) {
  if (!dob) {
    if (fallbackAge !== null && fallbackAge !== undefined && fallbackAge !== "") {
      const num = Number(fallbackAge);
      return !isNaN(num) ? num : fallbackAge;
    }
    return null;
  }

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    if (fallbackAge !== null && fallbackAge !== undefined && fallbackAge !== "") {
      const num = Number(fallbackAge);
      return !isNaN(num) ? num : fallbackAge;
    }
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Validate Date string (cannot be in the future if allowFuture is false)
 */
export function validateDate(dateVal, { required = false, allowFuture = false, fieldName = "Date" } = {}) {
  if (!dateVal) {
    if (required) return `${fieldName} is required.`;
    return null;
  }

  const parsed = new Date(dateVal);
  if (isNaN(parsed.getTime())) {
    return `Invalid date format for ${fieldName}.`;
  }

  if (!allowFuture) {
    const today = new Date();
    // Normalize today to end of day for timezone tolerance
    today.setHours(23, 59, 59, 999);
    if (parsed > today) {
      return `${fieldName} cannot be in the future.`;
    }
  }

  return null;
}

/**
 * Validate uploaded file (size, presence, MIME type)
 */
export function validateUploadedFile(file, fieldName = "File", {
  required = true,
  maxSizeBytes = MAX_IMAGE_SIZE_BYTES,
  allowedTypes = ALLOWED_IMAGE_TYPES,
} = {}) {
  if (!file || typeof file !== "object" || typeof file.size !== "number") {
    if (required) return `${fieldName} is required.`;
    return null;
  }

  if (file.size === 0) {
    return `${fieldName} is empty. Please upload a valid image file.`;
  }

  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return `${fieldName} size exceeds the limit of ${maxMB} MB.`;
  }

  const mime = (file.type || "").toLowerCase();
  const filename = (file.name || "").toLowerCase();
  const validExts = [".jpg", ".jpeg", ".png", ".webp"];
  const hasValidExt = validExts.some((ext) => filename.endsWith(ext));

  if (!allowedTypes.includes(mime) && !hasValidExt) {
    return `${fieldName} must be a valid image format (JPG, JPEG, PNG, or WebP).`;
  }

  return null;
}
