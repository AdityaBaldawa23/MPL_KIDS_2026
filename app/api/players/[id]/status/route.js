/**
 * PATCH /api/players/[id]/status
 * Update a player's registration status (pending | approved | rejected)
 */
import connectDB from "../../../../../lib/mongodb";
import Player from "../../../../../models/Player";
import {
  successResponse,
  errorResponse,
  calculateAge,
  verifyAdminAuth,
} from "../../../../../utils/apiHelpers";

const SELECT_FIELDS =
  "playerID playerName playerPhone dateOfBirth " +
  "fatherName motherName standard Age " +
  "playerPhoto.url playingStyle playerType playerPool playerCategory " +
  "previousPerformance tShirtSize tShirtNumber tShirtName " +
  "paymentMethod paymentScreenshot.url transactionId practice status createdAt updatedAt";

export async function PATCH(request, { params }) {
  try {
    if (!verifyAdminAuth(request)) {
      return errorResponse("Unauthorized. Please log in as admin.", 401);
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const VALID_STATUSES = ["pending", "approved", "rejected"];

    if (!status || !VALID_STATUSES.includes(status)) {
      return errorResponse(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        400,
      );
    }

    const playerRaw = await Player.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    )
      .select(SELECT_FIELDS)
      .lean();

    if (!playerRaw) {
      return errorResponse("Player not found.", 404);
    }

    const player = {
      ...playerRaw,
      calculatedAge: calculateAge(playerRaw.dateOfBirth, playerRaw.Age),
    };

    return successResponse({ player }, "Player status updated successfully.");
  } catch (error) {
    console.error("Update player status error:", error);
    return errorResponse("Failed to update player status.", 500);
  }
}
