import {
  createAdminToken,
  verifyAdminPassword,
  successResponse,
  errorResponse,
} from "../../../../utils/apiHelpers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!verifyAdminPassword(password)) {
      return errorResponse("Invalid admin password.", 401);
    }

    const token = createAdminToken();

    // Set HTTP-only secure cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookie = [
      `admin_token=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${60 * 60 * 24 * 7}`, // 7 days
      isProduction ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged in successfully.",
        data: { token },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      },
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return errorResponse("Admin login failed.", 500);
  }
}
