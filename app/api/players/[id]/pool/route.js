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
    const { playerPool } = body;

    const poolNum = Number(playerPool);
    if (isNaN(poolNum)) {
      return errorResponse("playerPool must be a valid number.", 400);
    }

    const playerRaw = await Player.findByIdAndUpdate(
      id,
      { playerPool: poolNum },
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

    return successResponse({ player }, "Player pool updated successfully.");
  } catch (error) {
    console.error("Update player pool error:", error);
    return errorResponse("Failed to update player pool.", 500);
  }
}
