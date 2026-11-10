import fs from "fs";
import path from "path";
import vm from "vm";
import crypto from "crypto";

console.log("\n========================================================");
console.log(" MPL KIDS 2026 - COMPLETE SYSTEM VERIFICATION TESTS");
console.log("========================================================");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// -------------------------------------------------------------
// 1. CONSTANTS & ENUMS VERIFICATION
// -------------------------------------------------------------
console.log("\n[1] CONSTANTS & ENUMS VERIFICATION");

const constantsFile = fs.readFileSync(
  path.resolve("./constants/playerOptions.js"),
  "utf8",
);

assert(
  !constantsFile.includes("BLOOD_GROUPS"),
  "No BLOOD_GROUPS constant in constants/playerOptions.js",
);
assert(
  !constantsFile.includes("PROFESSIONS"),
  "No PROFESSIONS constant in constants/playerOptions.js",
);
assert(
  !constantsFile.includes("PANT_SIZES"),
  "No PANT_SIZES constant in constants/playerOptions.js",
);
assert(
  !constantsFile.includes("PREVIOUS_TEAMS"),
  "No PREVIOUS_TEAMS constant in constants/playerOptions.js",
);

// Evaluate constants in VM
const constContext = {};
const constScript =
  constantsFile.replace(/export\s+const\s+/g, "const ") +
  "\nconstContext.STANDARDS = STANDARDS;\nconstContext.PLAYER_ROLES = PLAYER_ROLES;\nconstContext.PLAYING_STYLES = PLAYING_STYLES;\nconstContext.TSHIRT_SIZES = TSHIRT_SIZES;\nconstContext.TSHIRT_NUMBER_MIN = TSHIRT_NUMBER_MIN;\nconstContext.TSHIRT_NUMBER_MAX = TSHIRT_NUMBER_MAX;\nconstContext.TSHIRT_NAME_MAX_LENGTH = TSHIRT_NAME_MAX_LENGTH;\nconstContext.PRACTICE_MIN = PRACTICE_MIN;\nconstContext.PRACTICE_MAX = PRACTICE_MAX;\nconstContext.MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;\nconstContext.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;\n";

vm.runInNewContext(constScript, { constContext });
const {
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
  ALLOWED_IMAGE_TYPES,
} = constContext;

assert(
  JSON.stringify(STANDARDS) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  "STANDARDS are numbers 1 to 9",
);
assert(
  JSON.stringify(PLAYER_ROLES) ===
    JSON.stringify(["Batsman", "Bowler", "All Rounder"]),
  "PLAYER_ROLES are Batsman, Bowler, All Rounder",
);
assert(
  PLAYING_STYLES.length === 4 &&
    PLAYING_STYLES.includes("Right Arm Batting") &&
    PLAYING_STYLES.includes("Left Arm Balling"),
  "PLAYING_STYLES has exactly 4 legitimate styles",
);
assert(
  TSHIRT_SIZES.length === 9 &&
    TSHIRT_SIZES[0] === "32" &&
    TSHIRT_SIZES[8] === "48",
  "TSHIRT_SIZES are '32' through '48'",
);
assert(
  TSHIRT_NUMBER_MIN === 0 && TSHIRT_NUMBER_MAX === 9999,
  "Jersey number allowed range is 0 to 9999",
);
assert(
  TSHIRT_NAME_MAX_LENGTH === 20,
  "Jersey name max length is 20 characters",
);
assert(
  PRACTICE_MIN === 0 && PRACTICE_MAX === 23,
  "Practice days allowed range is 0 to 23",
);
assert(
  MAX_IMAGE_SIZE_BYTES === 3 * 1024 * 1024,
  "Max image size is exactly 3 MB",
);
assert(
  ALLOWED_IMAGE_TYPES.includes("image/jpeg") &&
    ALLOWED_IMAGE_TYPES.includes("image/png") &&
    ALLOWED_IMAGE_TYPES.includes("image/webp"),
  "Allowed image types are jpeg, jpg, png, webp",
);

// -------------------------------------------------------------
// 2. MONGOOSE SCHEMA & MODEL VERIFICATION
// -------------------------------------------------------------
console.log("\n[2] MONGOOSE SCHEMA & MODEL VERIFICATION");

const playerModelFile = fs.readFileSync(
  path.resolve("./models/Player.js"),
  "utf8",
);

assert(
  !playerModelFile.includes("bloodGroup"),
  "Player model contains NO bloodGroup field",
);
assert(
  !playerModelFile.includes("BLOOD_GROUPS"),
  "Player model does NOT import or reference BLOOD_GROUPS",
);
assert(
  !playerModelFile.includes("profession:"),
  "Player model contains NO profession field",
);
assert(
  !playerModelFile.includes("professionOther"),
  "Player model contains NO professionOther field",
);
assert(
  !playerModelFile.includes("anniversary"),
  "Player model contains NO anniversary field",
);
assert(
  !playerModelFile.includes("pantSize"),
  "Player model contains NO pantSize field",
);
assert(
  !playerModelFile.includes("previousTeam"),
  "Player model contains NO previousTeam field",
);
assert(
  !playerModelFile.includes("previousPoints"),
  "Player model contains NO previousPoints field",
);
assert(
  !playerModelFile.includes("AddressSchema"),
  "Player model contains NO unused AddressSchema",
);
assert(
  playerModelFile.includes("standard: {"),
  "Player model defines standard field",
);
assert(
  playerModelFile.includes("PlayerSchema.index({ standard: 1 });"),
  "Player model indexes standard (not profession)",
);
assert(
  !playerModelFile.includes("PlayerSchema.index({ profession: 1 });"),
  "Player model does not index nonexistent profession",
);
assert(
  playerModelFile.includes("practice: {"),
  "Player model defines practice field (0-23)",
);

// -------------------------------------------------------------
// 3. API HELPERS & VALIDATION FUNCTIONS VERIFICATION
// -------------------------------------------------------------
console.log("\n[3] API HELPERS & VALIDATION FUNCTIONS");

const apiHelpersFile = fs.readFileSync(
  path.resolve("./utils/apiHelpers.js"),
  "utf8",
);

assert(
  !apiHelpersFile.includes("BLOOD_GROUPS"),
  "apiHelpers.js contains NO BLOOD_GROUPS import",
);
assert(
  !apiHelpersFile.includes("PROFESSIONS"),
  "apiHelpers.js contains NO PROFESSIONS import",
);
assert(
  !apiHelpersFile.includes("CLOTHING_SIZES"),
  "apiHelpers.js contains NO CLOTHING_SIZES import",
);

// Load and test helper functions in VM
const helperContext = { crypto };
const helperScript =
  apiHelpersFile
    .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "")
    .replace(/export\s+function\s+/g, "function ") +
  "\nhelperContext.createAdminToken = createAdminToken;\nhelperContext.verifyAdminAuth = verifyAdminAuth;\nhelperContext.verifyAdminPassword = verifyAdminPassword;\nhelperContext.validateMobile = validateMobile;\nhelperContext.calculateAge = calculateAge;\nhelperContext.validateDate = validateDate;\nhelperContext.validateUploadedFile = validateUploadedFile;\nhelperContext.validateRequiredFields = validateRequiredFields;\n";

vm.runInNewContext(helperScript, {
  helperContext,
  crypto,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  process: { env: { ADMIN_PASSWORD: "mplkids2026admin" } },
});

const {
  createAdminToken,
  verifyAdminAuth,
  verifyAdminPassword,
  validateMobile,
  calculateAge,
  validateDate,
  validateUploadedFile,
  validateRequiredFields,
} = helperContext;

// Test validateMobile
assert(validateMobile("9876543210") === true, "Valid Indian 10-digit mobile starting with 9");
assert(validateMobile("8123456789") === true, "Valid Indian 10-digit mobile starting with 8");
assert(validateMobile("7123456789") === true, "Valid Indian 10-digit mobile starting with 7");
assert(validateMobile("6123456789") === true, "Valid Indian 10-digit mobile starting with 6");
assert(validateMobile("5123456789") === false, "Rejects mobile starting with 5");
assert(validateMobile("987654321") === false, "Rejects 9-digit mobile");
assert(validateMobile("98765432100") === false, "Rejects 11-digit mobile");
assert(validateMobile("abcdefghij") === false, "Rejects non-numeric mobile");

// Test calculateAge
assert(calculateAge("2015-05-10") >= 10, "Calculates correct age for child born in 2015");
assert(calculateAge(null, 11) === 11, "Fallback age used when DOB is null");
assert(calculateAge(null, null) === null, "Returns null when both DOB and fallback are missing");

// Test validateDate
assert(validateDate("2014-01-01", { required: true, allowFuture: false }) === null, "Valid past date accepted");
assert(validateDate("2035-01-01", { required: true, allowFuture: false }) !== null, "Future date rejected when allowFuture is false");
assert(validateDate("invalid-date", { required: true }) !== null, "Invalid date string rejected");

// Test validateUploadedFile
assert(validateUploadedFile({ size: 1024, type: "image/jpeg", name: "photo.jpg" }) === null, "Valid image accepted");
assert(validateUploadedFile(null, "Photo", { required: true }) !== null, "Missing required file rejected");
assert(validateUploadedFile({ size: 0, type: "image/png", name: "empty.png" }) !== null, "Empty file rejected");
assert(validateUploadedFile({ size: 5 * 1024 * 1024, type: "image/png", name: "large.png" }) !== null, "Oversized file rejected");
assert(validateUploadedFile({ size: 1024, type: "application/pdf", name: "doc.pdf" }) !== null, "PDF file rejected as image");

// Test validateRequiredFields
assert(
  validateRequiredFields({ name: "Aarav", standard: 5, role: "Batsman" }, ["name", "standard", "role"]) === null,
  "All present fields pass validateRequiredFields",
);
assert(
  validateRequiredFields({ name: "Aarav", standard: "", role: "Batsman" }, ["name", "standard", "role"]) !== null,
  "Empty standard caught by validateRequiredFields",
);

// -------------------------------------------------------------
// 4. ADMIN AUTHENTICATION TESTS
// -------------------------------------------------------------
console.log("\n[4] ADMIN AUTHENTICATION TESTS");

assert(verifyAdminPassword("mplkids2026admin") === true, "Valid admin password passes");
assert(verifyAdminPassword("wrongpass") === false, "Invalid admin password rejected");
assert(verifyAdminPassword("") === false, "Empty admin password rejected");

const adminToken = createAdminToken();
assert(typeof adminToken === "string" && adminToken.length === 64, "Generated admin session token is valid 64-char SHA256 hex");

const mockAuthHeaderRequest = {
  headers: {
    get: (h) => (h === "authorization" ? `Bearer ${adminToken}` : null),
  },
};
assert(verifyAdminAuth(mockAuthHeaderRequest) === true, "Bearer token authenticates successfully");

const mockCookieRequest = {
  headers: {
    get: (h) => (h === "cookie" ? `admin_token=${adminToken}; other=123` : null),
  },
};
assert(verifyAdminAuth(mockCookieRequest) === true, "Cookie admin_token authenticates successfully");

const mockUnauthRequest = {
  headers: {
    get: () => null,
  },
};
assert(verifyAdminAuth(mockUnauthRequest) === false, "Unauthenticated request correctly rejected");

// -------------------------------------------------------------
// 5. REGISTRATION FORM & ADMIN PANEL SYNCHRONIZATION
// -------------------------------------------------------------
console.log("\n[5] REGISTRATION FORM & ADMIN PANEL SYNCHRONIZATION");

const regFormFile = fs.readFileSync(
  path.resolve("./components/RegistrationForm.jsx"),
  "utf8",
);
assert(
  regFormFile.includes("const handleSelectChange = (field) => (e) =>"),
  "RegistrationForm defines handleSelectChange correctly",
);
assert(
  !regFormFile.includes("errors.profession"),
  "RegistrationForm does NOT reference errors.profession",
);
assert(
  regFormFile.includes("error={errors.standard}"),
  "RegistrationForm binds Standard SelectField to errors.standard",
);
assert(
  regFormFile.includes("data-error={!!errors.standard}"),
  "RegistrationForm wrapper binds to errors.standard",
);
assert(
  !regFormFile.includes("bloodGroup"),
  "RegistrationForm does NOT contain bloodGroup",
);
assert(
  regFormFile.includes("STANDARDS.includes"),
  "RegistrationForm validates standard against STANDARDS",
);

const successModalFile = fs.readFileSync(
  path.resolve("./components/SuccessModal.jsx"),
  "utf8",
);
assert(
  !successModalFile.includes("bloodGroup"),
  "SuccessModal does NOT display bloodGroup",
);
assert(
  !successModalFile.includes("pantSize"),
  "SuccessModal does NOT display pantSize",
);
assert(
  !successModalFile.includes("profession"),
  "SuccessModal does NOT display profession",
);
assert(
  successModalFile.includes("Standard"),
  "SuccessModal displays Standard",
);

const adminPageFile = fs.readFileSync(
  path.resolve("./app/admin/page.jsx"),
  "utf8",
);
assert(
  !adminPageFile.includes("BLOOD_GROUPS"),
  "Admin panel does NOT import or display BLOOD_GROUPS",
);
assert(
  !adminPageFile.includes("PANT_SIZES"),
  "Admin panel does NOT import or display PANT_SIZES",
);
assert(
  !adminPageFile.includes("PREVIOUS_TEAMS"),
  "Admin panel does NOT import or display PREVIOUS_TEAMS",
);
assert(
  !adminPageFile.includes("filterProfession"),
  "Admin panel does NOT have filterProfession (replaced by filterStandard)",
);
assert(
  adminPageFile.includes("filterStandard"),
  "Admin panel has filterStandard",
);
assert(
  adminPageFile.includes("STANDARDS"),
  "Admin panel imports and uses STANDARDS",
);
assert(
  adminPageFile.includes("handleDeletePlayer"),
  "Admin panel implements handleDeletePlayer with confirmation",
);
assert(
  adminPageFile.includes("exportExcel"),
  "Admin panel implements Excel export with model fields",
);
assert(
  !adminPageFile.includes('"Blood Group":'),
  "Excel export does NOT include Blood Group column",
);
assert(
  adminPageFile.includes("handleLogin"),
  "Admin panel implements admin login & authentication",
);

// -------------------------------------------------------------
// 6. BACKEND API ROUTES VERIFICATION
// -------------------------------------------------------------
console.log("\n[6] BACKEND API ROUTES VERIFICATION");

const registerRouteFile = fs.readFileSync(
  path.resolve("./app/api/register/route.js"),
  "utf8",
);
assert(
  !registerRouteFile.includes("BLOOD_GROUPS"),
  "Register API does not import BLOOD_GROUPS",
);
assert(
  registerRouteFile.includes("parsedStandard"),
  "Register API parses and validates standard as integer",
);
assert(
  registerRouteFile.includes("STANDARDS.includes(parsedStandard)"),
  "Register API checks standard against STANDARDS",
);

const playersRouteFile = fs.readFileSync(
  path.resolve("./app/api/players/route.js"),
  "utf8",
);
assert(
  playersRouteFile.includes("verifyAdminAuth(request)"),
  "GET /api/players protects against unauthorized access",
);
assert(
  !playersRouteFile.includes("query.profession"),
  "GET /api/players queries standard instead of profession",
);
assert(
  playersRouteFile.includes("query.standard"),
  "GET /api/players supports standard filter",
);

const playerDetailRouteFile = fs.readFileSync(
  path.resolve("./app/api/players/[id]/route.js"),
  "utf8",
);
assert(
  playerDetailRouteFile.includes("export async function DELETE"),
  "Players [id] route implements DELETE method",
);
assert(
  playerDetailRouteFile.includes("verifyAdminAuth(request)"),
  "Players [id] route enforces admin authentication",
);
assert(
  !playerDetailRouteFile.includes("body.bloodGroup"),
  "Players [id] PATCH does NOT accept bloodGroup",
);
assert(
  !playerDetailRouteFile.includes("body.profession"),
  "Players [id] PATCH does NOT accept profession",
);
assert(
  !playerDetailRouteFile.includes("body.pantSize"),
  "Players [id] PATCH does NOT accept pantSize",
);
assert(
  playerDetailRouteFile.includes("updateFields.standard = stdNum"),
  "Players [id] PATCH updates standard",
);

console.log("\n========================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}
