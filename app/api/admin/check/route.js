import {
  verifyAdminAuth,
  successResponse,
  errorResponse,
} from "../../../../utils/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const isAuth = verifyAdminAuth(request);
    if (!isAuth) {
      return errorResponse("Unauthorized", 401);
    }
    return successResponse({ authenticated: true }, "Authenticated");
  } catch (error) {
    console.error("Admin check error:", error);
    return errorResponse("Authentication check failed.", 500);
  }
}
