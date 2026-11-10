import connectDB from "../../../lib/mongodb";
import Player from "../../../models/Player";
import {
  uploadPlayerPhoto,
  uploadPaymentScreenshot,
  deleteFromCloudinary,
} from "../../../lib/cloudinary";
import {
  successResponse,
  errorResponse,
  parseMongooseErrors,
  validateRequiredFields,
  validateMobile,
  validateDate,
  validateUploadedFile,
  calculateAge,
} from "../../../utils/apiHelpers";
import {
  STANDARDS,
  PLAYER_ROLES,
  PLAYING_STYLES,
  TSHIRT_SIZES,
  TSHIRT_NUMBER_MIN,
  TSHIRT_NUMBER_MAX,
  TSHIRT_NAME_MAX_LENGTH,
  PRACTICE_MIN,
  PRACTICE_MAX,
  MAX_IMAGE_SIZE_BYTES,
} from "../../../constants/playerOptions";

export async function POST(request) {
  let playerPhotoData = null;
  let paymentScreenshotData = null;

  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Parse request multipart FormData
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse(
        "Invalid form data. Please check your submission.",
        400,
      );
    }

    // 3. Extract text fields
    const name = (formData.get("name") || "").toString().trim();
    const mobile = (formData.get("mobile") || "").toString().trim();
    const dateOfBirth = (formData.get("dateOfBirth") || "").toString().trim();
    const fatherName = (formData.get("fatherName") || "").toString().trim();
    const motherName = (formData.get("motherName") || "").toString().trim();
    const standardRaw = (formData.get("standard") || "").toString().trim();
    const role = (formData.get("role") || "").toString().trim();
    const transactionIdRaw = (formData.get("transactionId") || "")
      .toString()
      .trim();
    const transactionId = transactionIdRaw.toUpperCase();
    const paymentMethod = (formData.get("paymentMethod") || "").toString().trim();
    const tShirtSize = (formData.get("tShirtSize") || "").toString().trim();
    const tShirtNumberRaw = (formData.get("tShirtNumber") || "")
      .toString()
      .trim();
    const tShirtName = (formData.get("tShirtName") || "")
      .toString()
      .trim()
      .toUpperCase();
    const practiceRaw = formData.get("practice");

    // Parse playingStyle
    let playingStyle = [];
    const playingStyleRaw = formData.get("playingStyle");
    if (playingStyleRaw) {
      try {
        playingStyle =
          typeof playingStyleRaw === "string"
            ? JSON.parse(playingStyleRaw)
            : playingStyleRaw;
      } catch {
        return errorResponse("Invalid playing style selection format.", 400);
      }
    }

    // Extract file fields
    const playerPhoto = formData.get("playerPhoto");
    const paymentScreenshot = formData.get("paymentScreenshot");

    // 4. Validate Required Fields
    const requiredCheck = validateRequiredFields(
      {
        name,
        mobile,
        dateOfBirth,
        fatherName,
        motherName,
        standard: standardRaw,
        role,
        transactionId,
        paymentMethod,
        tShirtSize,
        tShirtNumber: tShirtNumberRaw,
        tShirtName,
      },
      [
        "name",
        "mobile",
        "dateOfBirth",
        "fatherName",
        "motherName",
        "standard",
        "role",
        "transactionId",
        "paymentMethod",
        "tShirtSize",
        "tShirtNumber",
        "tShirtName",
      ],
    );
    if (requiredCheck) {
      return errorResponse(requiredCheck, 400);
    }

    // Full name validation
    if (name.length < 2 || name.length > 100) {
      return errorResponse(
        "Full name must be between 2 and 100 characters.",
        400,
      );
    }

    // Mobile validation
    if (!validateMobile(mobile)) {
      return errorResponse(
        "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.",
        400,
      );
    }

    // DOB validation (required, not future)
    const dobError = validateDate(dateOfBirth, {
      required: true,
      allowFuture: false,
      fieldName: "Date of Birth",
    });
    if (dobError) {
      return errorResponse(dobError, 400);
    }

    // Parents name validation
    if (fatherName.length < 2 || fatherName.length > 100) {
      return errorResponse(
        "Father's name must be between 2 and 100 characters.",
        400,
      );
    }
    if (motherName.length < 2 || motherName.length > 100) {
      return errorResponse(
        "Mother's name must be between 2 and 100 characters.",
        400,
      );
    }

    // Standard validation
    const parsedStandard = Number(standardRaw);
    if (
      !Number.isInteger(parsedStandard) ||
      !STANDARDS.includes(parsedStandard)
    ) {
      return errorResponse(
        `Invalid standard. Must be one of: ${STANDARDS.join(", ")}.`,
        400,
      );
    }

    // Role validation
    if (!PLAYER_ROLES.includes(role)) {
      return errorResponse(
        `Invalid role. Must be one of: ${PLAYER_ROLES.join(", ")}`,
        400,
      );
    }

    // Playing styles validation (1 to 2 allowed)
    if (
      !Array.isArray(playingStyle) ||
      playingStyle.length < 1 ||
      playingStyle.length > 2
    ) {
      return errorResponse("Select 1 to 2 playing styles.", 400);
    }
    for (const style of playingStyle) {
      if (!PLAYING_STYLES.includes(style)) {
        return errorResponse(`Invalid playing style: "${style}".`, 400);
      }
    }

    // T-shirt size validation
    if (!TSHIRT_SIZES.includes(tShirtSize)) {
      return errorResponse(
        `Invalid T-shirt size. Must be one of: ${TSHIRT_SIZES.join(", ")}`,
        400,
      );
    }

    // T-shirt number validation
    const parsedNumber = Number(tShirtNumberRaw);
    if (
      !Number.isInteger(parsedNumber) ||
      parsedNumber < TSHIRT_NUMBER_MIN ||
      parsedNumber > TSHIRT_NUMBER_MAX
    ) {
      return errorResponse(
        `T-shirt number must be a whole number between ${TSHIRT_NUMBER_MIN} and ${TSHIRT_NUMBER_MAX}.`,
        400,
      );
    }

    // T-shirt name validation
    if (!tShirtName || tShirtName.length > TSHIRT_NAME_MAX_LENGTH) {
      return errorResponse(
        `T-shirt name is required and cannot exceed ${TSHIRT_NAME_MAX_LENGTH} characters.`,
        400,
      );
    }

    // Payment method validation
    if (!["Cash", "Online"].includes(paymentMethod)) {
      return errorResponse(
        "Invalid payment method. Must be 'Cash' or 'Online'.",
        400,
      );
    }

    // Transaction ID validation
    if (!transactionId || transactionId.length < 4) {
      return errorResponse(
        "Valid receipt/transaction number of at least 4 characters is required.",
        400,
      );
    }

    // Practice days validation
    let practice = 23;
    if (practiceRaw !== null && practiceRaw !== undefined && String(practiceRaw).trim() !== "") {
      const parsedPractice = Number(practiceRaw);
      if (
        !Number.isInteger(parsedPractice) ||
        parsedPractice < PRACTICE_MIN ||
        parsedPractice > PRACTICE_MAX
      ) {
        return errorResponse(
          `Practice days must be a whole number between ${PRACTICE_MIN} and ${PRACTICE_MAX}.`,
          400,
        );
      }
      practice = parsedPractice;
    }

    // 5. File Validations (Frontend and Backend enforcement)
    const photoError = validateUploadedFile(playerPhoto, "Player photo", {
      required: true,
      maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
    });
    if (photoError) {
      return errorResponse(photoError, 400);
    }

    const paymentError = validateUploadedFile(
      paymentScreenshot,
      "Payment screenshot",
      {
        required: true,
        maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
      },
    );
    if (paymentError) {
      return errorResponse(paymentError, 400);
    }

    // 6. Check for duplicate transaction ID before uploading to Cloudinary
    const existingPlayer = await Player.findOne({ transactionId });
    if (existingPlayer) {
      return errorResponse(
        `Transaction ID "${transactionId}" is already registered. Please check and provide your unique payment transaction ID.`,
        409,
      );
    }

    // 7. Upload images to Cloudinary with rollback handling
    try {
      playerPhotoData = await uploadPlayerPhoto(playerPhoto);
    } catch (uploadError) {
      console.error("Player photo upload failed:", uploadError);
      return errorResponse(
        `Player photo upload failed: ${uploadError.message}`,
        500,
      );
    }

    try {
      paymentScreenshotData = await uploadPaymentScreenshot(paymentScreenshot);
    } catch (uploadError) {
      console.error("Payment screenshot upload failed:", uploadError);
      // Clean up already uploaded player photo
      if (playerPhotoData?.public_id) {
        try {
          await deleteFromCloudinary(playerPhotoData.public_id);
        } catch (cleanupErr) {
          console.error("Failed to delete orphaned player photo:", cleanupErr);
        }
      }
      return errorResponse(
        `Payment screenshot upload failed: ${uploadError.message}`,
        500,
      );
    }

    // 8. Save player to MongoDB
    let player;
    try {
      player = new Player({
        playerName: name,
        playerPhone: mobile,
        dateOfBirth: new Date(dateOfBirth),
        fatherName,
        motherName,
        standard: parsedStandard,
        playingStyle,
        playerType: role,
        tShirtSize,
        tShirtNumber: parsedNumber,
        tShirtName,
        playerPhoto: playerPhotoData,
        paymentMethod,
        paymentScreenshot: paymentScreenshotData,
        transactionId,
        practice,
        status: "pending",
        playerCategory: "Undefined",
        playerPool: 0,
      });

      await player.save();
    } catch (dbError) {
      console.error("Database save error:", dbError);
      // Clean up both uploaded images in case of DB failure
      if (playerPhotoData?.public_id) {
        try {
          await deleteFromCloudinary(playerPhotoData.public_id);
        } catch (e) {
          console.error("Cloudinary cleanup error for photo:", e);
        }
      }
      if (paymentScreenshotData?.public_id) {
        try {
          await deleteFromCloudinary(paymentScreenshotData.public_id);
        } catch (e) {
          console.error("Cloudinary cleanup error for payment:", e);
        }
      }

      if (dbError.name === "ValidationError" || dbError.code === 11000) {
        const parsed = parseMongooseErrors(dbError);
        return errorResponse(parsed.message, parsed.status, parsed.errors);
      }
      return errorResponse(
        "Failed to complete player registration. Please try again.",
        500,
      );
    }

    // 9. Return success response (never expose Cloudinary public_ids)
    return successResponse(
      {
        id: player._id,
        playerID: player.playerID,
        name: player.playerName,
        mobile: player.playerPhone,
        dateOfBirth: player.dateOfBirth,
        age: calculateAge(player.dateOfBirth),
        fatherName: player.fatherName,
        motherName: player.motherName,
        standard: player.standard,
        playerPhoto: player.playerPhoto.url,
        playingStyle: player.playingStyle,
        role: player.playerType,
        tShirtSize: player.tShirtSize,
        tShirtNumber: player.tShirtNumber,
        tShirtName: player.tShirtName,
        paymentMethod: player.paymentMethod,
        transactionId: player.transactionId,
        practice: player.practice,
        status: player.status,
        createdAt: player.createdAt,
      },
      "Registration successful! Your application is under review.",
      201,
    );
  } catch (error) {
    console.error("Unhandled registration error:", error);
    if (playerPhotoData?.public_id) {
      try {
        await deleteFromCloudinary(playerPhotoData.public_id);
      } catch {}
    }
    if (paymentScreenshotData?.public_id) {
      try {
        await deleteFromCloudinary(paymentScreenshotData.public_id);
      } catch {}
    }

    return errorResponse(
      "Registration failed due to an unexpected error. Please try again.",
      500,
    );
  }
}
