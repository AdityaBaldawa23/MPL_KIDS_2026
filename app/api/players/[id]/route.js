/**
 * GET /api/players/[id]
 * PATCH /api/players/[id]
 * DELETE /api/players/[id]
 * Full player CRUD for admin, strictly mapped to Player model
 */
import connectDB from "../../../../lib/mongodb";
import Player from "../../../../models/Player";
import { deleteFromCloudinary } from "../../../../lib/cloudinary";
import {
  successResponse,
  errorResponse,
  parseMongooseErrors,
  validateMobile,
  validateDate,
  calculateAge,
  verifyAdminAuth,
} from "../../../../utils/apiHelpers";
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
} from "../../../../constants/playerOptions";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "playerID playerName playerPhone dateOfBirth " +
  "fatherName motherName standard Age " +
  "playerPhoto.url playerPhoto.public_id playingStyle playerType playerPool playerCategory " +
  "previousPerformance tShirtSize tShirtNumber tShirtName " +
  "paymentMethod paymentScreenshot.url paymentScreenshot.public_id transactionId practice status createdAt updatedAt";

export async function GET(request, { params }) {
  try {
    if (!verifyAdminAuth(request)) {
      return errorResponse("Unauthorized. Please log in as admin.", 401);
    }

    await connectDB();
    const { id } = await params;

    const playerRaw = await Player.findById(id).select(SELECT_FIELDS).lean();

    if (!playerRaw) {
      return errorResponse("Player not found.", 404);
    }

    const player = {
      ...playerRaw,
      calculatedAge: calculateAge(playerRaw.dateOfBirth, playerRaw.Age),
    };

    return successResponse({ player });
  } catch (error) {
    console.error("Fetch player detail error:", error);
    return errorResponse("Failed to fetch player details.", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!verifyAdminAuth(request)) {
      return errorResponse("Unauthorized. Please log in as admin.", 401);
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const existingPlayer = await Player.findById(id);
    if (!existingPlayer) {
      return errorResponse("Player not found.", 404);
    }

    const updateFields = {};

    // 1. Full Name
    if (body.playerName !== undefined) {
      const name = String(body.playerName).trim();
      if (name.length < 2 || name.length > 100) {
        return errorResponse(
          "Full name must be between 2 and 100 characters.",
          400,
        );
      }
      updateFields.playerName = name;
    }

    // 2. Mobile
    if (body.playerPhone !== undefined) {
      const mobile = String(body.playerPhone).trim();
      if (!validateMobile(mobile)) {
        return errorResponse(
          "Invalid Indian mobile number (10 digits starting with 6-9).",
          400,
        );
      }
      updateFields.playerPhone = mobile;
    }

    // 3. Date of Birth
    if (body.dateOfBirth !== undefined) {
      const dobError = validateDate(body.dateOfBirth, {
        required: true,
        allowFuture: false,
        fieldName: "Date of Birth",
      });
      if (dobError) return errorResponse(dobError, 400);
      updateFields.dateOfBirth = new Date(body.dateOfBirth);
    }

    // 4. Father's Name
    if (body.fatherName !== undefined) {
      const fn = String(body.fatherName).trim();
      if (fn.length < 2 || fn.length > 100) {
        return errorResponse(
          "Father's name must be between 2 and 100 characters.",
          400,
        );
      }
      updateFields.fatherName = fn;
    }

    // 5. Mother's Name
    if (body.motherName !== undefined) {
      const mn = String(body.motherName).trim();
      if (mn.length < 2 || mn.length > 100) {
        return errorResponse(
          "Mother's name must be between 2 and 100 characters.",
          400,
        );
      }
      updateFields.motherName = mn;
    }

    // 6. Standard
    if (body.standard !== undefined) {
      const stdNum = Number(body.standard);
      if (!Number.isInteger(stdNum) || !STANDARDS.includes(stdNum)) {
        return errorResponse(
          `Standard must be one of: ${STANDARDS.join(", ")}.`,
          400,
        );
      }
      updateFields.standard = stdNum;
    }

    // 7. Playing Style
    if (body.playingStyle !== undefined) {
      if (
        !Array.isArray(body.playingStyle) ||
        body.playingStyle.length < 1 ||
        body.playingStyle.length > 2
      ) {
        return errorResponse("Select 1 to 2 playing styles.", 400);
      }
      for (const style of body.playingStyle) {
        if (!PLAYING_STYLES.includes(style)) {
          return errorResponse(`Invalid playing style: "${style}".`, 400);
        }
      }
      updateFields.playingStyle = body.playingStyle;
    }

    // 8. Player Role (playerType)
    if (body.playerType !== undefined || body.role !== undefined) {
      const roleVal = body.playerType || body.role;
      if (!PLAYER_ROLES.includes(roleVal)) {
        return errorResponse(
          `Invalid player role. Must be one of: ${PLAYER_ROLES.join(", ")}`,
          400,
        );
      }
      updateFields.playerType = roleVal;
    }

    // 9. T-Shirt Size
    if (body.tShirtSize !== undefined) {
      if (!TSHIRT_SIZES.includes(body.tShirtSize)) {
        return errorResponse(
          `Invalid T-shirt size. Must be one of: ${TSHIRT_SIZES.join(", ")}`,
          400,
        );
      }
      updateFields.tShirtSize = body.tShirtSize;
    }

    // 10. T-Shirt Number
    if (body.tShirtNumber !== undefined) {
      const num = Number(body.tShirtNumber);
      if (
        !Number.isInteger(num) ||
        num < TSHIRT_NUMBER_MIN ||
        num > TSHIRT_NUMBER_MAX
      ) {
        return errorResponse(
          `T-shirt number must be an integer between ${TSHIRT_NUMBER_MIN} and ${TSHIRT_NUMBER_MAX}.`,
          400,
        );
      }
      updateFields.tShirtNumber = num;
    }

    // 11. T-Shirt Name
    if (body.tShirtName !== undefined) {
      const tName = String(body.tShirtName).trim().toUpperCase();
      if (!tName || tName.length > TSHIRT_NAME_MAX_LENGTH) {
        return errorResponse(
          `T-shirt name is required and cannot exceed ${TSHIRT_NAME_MAX_LENGTH} characters.`,
          400,
        );
      }
      updateFields.tShirtName = tName;
    }

    // 12. Player Pool
    if (body.playerPool !== undefined) {
      const poolNum = Number(body.playerPool);
      if (isNaN(poolNum)) {
        return errorResponse("Player pool must be a number.", 400);
      }
      updateFields.playerPool = poolNum;
    }

    // 13. Player Category
    if (body.playerCategory !== undefined) {
      updateFields.playerCategory = String(body.playerCategory).trim();
    }

    // 14. Payment Method
    if (body.paymentMethod !== undefined) {
      if (!["Cash", "Online"].includes(body.paymentMethod)) {
        return errorResponse("Payment method must be 'Cash' or 'Online'.", 400);
      }
      updateFields.paymentMethod = body.paymentMethod;
    }

    // 15. Transaction ID
    if (body.transactionId !== undefined) {
      const txn = String(body.transactionId).trim().toUpperCase();
      if (!txn || txn.length < 4) {
        return errorResponse("Transaction ID must be at least 4 characters.", 400);
      }
      if (txn !== existingPlayer.transactionId) {
        const dup = await Player.findOne({ transactionId: txn, _id: { $ne: id } });
        if (dup) {
          return errorResponse(
            `Transaction ID "${txn}" is already used by another player.`,
            409,
          );
        }
      }
      updateFields.transactionId = txn;
    }

    // 16. Practice Days
    if (body.practice !== undefined) {
      const pracNum = Number(body.practice);
      if (
        !Number.isInteger(pracNum) ||
        pracNum < PRACTICE_MIN ||
        pracNum > PRACTICE_MAX
      ) {
        return errorResponse(
          `Practice days must be an integer between ${PRACTICE_MIN} and ${PRACTICE_MAX}.`,
          400,
        );
      }
      updateFields.practice = pracNum;
    }

    // 17. Status
    if (body.status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(body.status)) {
        return errorResponse("Invalid status value.", 400);
      }
      updateFields.status = body.status;
    }

    // 18. Image replacement & cleanup
    if (body.playerPhoto && body.playerPhoto.url && body.playerPhoto.public_id) {
      if (
        existingPlayer.playerPhoto?.public_id &&
        existingPlayer.playerPhoto.public_id !== body.playerPhoto.public_id
      ) {
        try {
          await deleteFromCloudinary(existingPlayer.playerPhoto.public_id);
        } catch (cleanupErr) {
          console.error("Old photo cleanup error:", cleanupErr);
        }
      }
      updateFields.playerPhoto = body.playerPhoto;
    }

    if (
      body.paymentScreenshot &&
      body.paymentScreenshot.url &&
      body.paymentScreenshot.public_id
    ) {
      if (
        existingPlayer.paymentScreenshot?.public_id &&
        existingPlayer.paymentScreenshot.public_id !==
          body.paymentScreenshot.public_id
      ) {
        try {
          await deleteFromCloudinary(existingPlayer.paymentScreenshot.public_id);
        } catch (cleanupErr) {
          console.error("Old payment screenshot cleanup error:", cleanupErr);
        }
      }
      updateFields.paymentScreenshot = body.paymentScreenshot;
    }

    // 19. Previous Performance Records
    if (body.previousPerformance !== undefined) {
      if (!Array.isArray(body.previousPerformance)) {
        return errorResponse(
          "previousPerformance must be an array of season records.",
          400,
        );
      }
      updateFields.previousPerformance = body.previousPerformance.map((item) => ({
        year:
          item.year !== undefined && item.year !== null && item.year !== ""
            ? Number(item.year)
            : undefined,
        matches: Number(item.matches) || 0,
        runs: Number(item.runs) || 0,
        wickets: Number(item.wickets) || 0,
        fielding: Number(item.fielding) || 0,
        mom: Number(item.mom) || 0,
        battingAvg: Number(item.battingAvg) || 0,
        strikeRate: Number(item.strikeRate) || 0,
        economy: Number(item.economy) || 0,
      }));
    }

    // Execute atomic update
    const updatedPlayerRaw = await Player.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true },
    )
      .select(SELECT_FIELDS)
      .lean();

    const player = {
      ...updatedPlayerRaw,
      calculatedAge: calculateAge(
        updatedPlayerRaw.dateOfBirth,
        updatedPlayerRaw.Age,
      ),
    };

    return successResponse({ player }, "Player details updated successfully.");
  } catch (error) {
    console.error("Player update error:", error);
    if (error.name === "ValidationError" || error.code === 11000) {
      const parsed = parseMongooseErrors(error);
      return errorResponse(parsed.message, parsed.status, parsed.errors);
    }
    return errorResponse("Failed to update player information.", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!verifyAdminAuth(request)) {
      return errorResponse("Unauthorized. Please log in as admin.", 401);
    }

    await connectDB();
    const { id } = await params;

    const player = await Player.findById(id);
    if (!player) {
      return errorResponse("Player not found.", 404);
    }

    // Clean up uploaded Cloudinary assets
    if (player.playerPhoto?.public_id) {
      try {
        await deleteFromCloudinary(player.playerPhoto.public_id);
      } catch (err) {
        console.error("Failed to delete player photo from Cloudinary:", err);
      }
    }

    if (player.paymentScreenshot?.public_id) {
      try {
        await deleteFromCloudinary(player.paymentScreenshot.public_id);
      } catch (err) {
        console.error("Failed to delete payment screenshot from Cloudinary:", err);
      }
    }

    await Player.findByIdAndDelete(id);

    return successResponse(
      { id, playerID: player.playerID, name: player.playerName },
      `Player #${player.playerID ?? ""} (${player.playerName}) deleted successfully.`,
    );
  } catch (error) {
    console.error("Player delete error:", error);
    return errorResponse("Failed to delete player record.", 500);
  }
}
