import { successResponse } from "../../../../utils/apiHelpers";

export async function POST() {
  const cookie = [
    "admin_token=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ].join("; ");

  return new Response(
    JSON.stringify({
      success: true,
      message: "Logged out successfully.",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    },
  );
}
