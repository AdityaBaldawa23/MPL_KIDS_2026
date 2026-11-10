/**
 * GET /api/players
 * Fetch all registered players with pagination, advanced search, and filtering
 * Protected route — requires admin authentication
 */
import connectDB from "../../../lib/mongodb";
import Player from "../../../models/Player";
import {
  successResponse,
  errorResponse,
  calculateAge,
  verifyAdminAuth,
} from "../../../utils/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // 1. Verify Admin Authentication
    if (!verifyAdminAuth(request)) {
      return errorResponse("Unauthorized. Please log in as admin.", 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status"); // pending | approved | rejected
    const playerType = searchParams.get("playerType"); // Batsman | Bowler | All Rounder
    const playingStyle = searchParams.get("playingStyle"); // e.g. Right Arm Batting
    const search = searchParams.get("search"); // name, phone, transactionId, playerID, tShirtNumber
    const playerCategory = searchParams.get("playerCategory");
    const playerPool = searchParams.get("playerPool");
    const standard = searchParams.get("standard");
    const paymentMethod = searchParams.get("paymentMethod");

    // Sorting
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (playerType) query.playerType = playerType;
    if (playingStyle) query.playingStyle = { $in: [playingStyle] };
    if (playerCategory) query.playerCategory = playerCategory;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (standard !== null && standard !== undefined && standard !== "") {
      const stdNum = Number(standard);
      if (!isNaN(stdNum)) query.standard = stdNum;
    }
    if (playerPool !== null && playerPool !== undefined && playerPool !== "") {
      query.playerPool = Number(playerPool);
    }

    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const orConditions = [
        { playerName: { $regex: trimmedSearch, $options: "i" } },
        { playerPhone: { $regex: trimmedSearch, $options: "i" } },
        { transactionId: { $regex: trimmedSearch, $options: "i" } },
        { fatherName: { $regex: trimmedSearch, $options: "i" } },
        { motherName: { $regex: trimmedSearch, $options: "i" } },
      ];

      // If search is numeric, also search playerID and tShirtNumber
      const numericVal = Number(trimmedSearch);
      if (!isNaN(numericVal)) {
        orConditions.push({ playerID: numericVal });
        orConditions.push({ tShirtNumber: numericVal });
      }

      query.$or = orConditions;
    }

    // Allowed sort fields (strictly model-backed)
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "playerID",
      "playerName",
      "dateOfBirth",
      "standard",
      "tShirtNumber",
      "Age",
      "status",
      "playerType",
      "playerPool",
      "paymentMethod",
      "practice",
    ];
    const safeSortField = allowedSortFields.includes(sortField)
      ? sortField
      : "createdAt";

    // Execute query with pagination
    const [playersRaw, total] = await Promise.all([
      Player.find(query)
        .select(
          "playerID playerName playerPhone dateOfBirth " +
            "fatherName motherName standard Age " +
            "playerPhoto.url playingStyle playerType playerPool playerCategory " +
            "previousPerformance tShirtSize tShirtNumber tShirtName " +
            "paymentMethod paymentScreenshot.url transactionId practice status createdAt updatedAt",
        )
        .sort({ [safeSortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Player.countDocuments(query),
    ]);

    // Attach calculated age dynamically while preserving historical Age fallback
    const players = playersRaw.map((p) => ({
      ...p,
      calculatedAge: calculateAge(p.dateOfBirth, p.Age),
    }));

    return successResponse({
      players,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        status,
        playerType,
        playingStyle,
        playerCategory,
        playerPool,
        standard,
        paymentMethod,
        search,
      },
    });
  } catch (error) {
    console.error("Fetch players error:", error);
    return errorResponse("Failed to fetch players.", 500);
  }
}
