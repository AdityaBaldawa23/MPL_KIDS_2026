"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import InputField from "./InputField";
import SelectField from "./SelectField";
import ImageUpload from "./ImageUpload";
import PlayingStyleSelector from "./PlayingStyleSelector";
import RoleSelector from "./RoleSelector";
import PaymentQR from "./PaymentQR";
import SuccessModal from "./SuccessModal";
import {
  STANDARDS,
  PLAYER_ROLES,
  TSHIRT_SIZES,
  TSHIRT_NUMBER_MIN,
  TSHIRT_NUMBER_MAX,
  TSHIRT_NAME_MAX_LENGTH,
  PRACTICE_MIN,
  PRACTICE_MAX,
} from "../constants/playerOptions";
import { calculateAge } from "../utils/apiHelpers";

// Initial form state strictly corresponding to Player model
const INITIAL_STATE = {
  name: "",
  mobile: "",
  dateOfBirth: "",
  fatherName: "",
  motherName: "",
  standard: "",
  playerPhoto: null,
  playingStyle: [],
  role: "",
  paymentMethod: "Online",
  paymentScreenshot: null,
  transactionId: "",
  tShirtSize: "",
  tShirtNumber: "",
  tShirtName: "",
  practice: "23",
};

const INITIAL_ERRORS = {};

/**
 * Main Registration Form
 * Client component — handles form state, previews, comprehensive validation & submission
 */
export default function RegistrationForm() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Object URL preview state to prevent memory leaks
  const [photoPreview, setPhotoPreview] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [photoPreview, screenshotPreview]);

  // --- Field Handlers ---
  const handleChange = (field) => (e) => {
    let val = e.target.value;
    if (field === "tShirtName") {
      val = val.toUpperCase().slice(0, TSHIRT_NAME_MAX_LENGTH);
    } else if (field === "transactionId") {
      val = val.toUpperCase();
    }
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSelectChange = (field) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageSelect = (field) => (file, errorMsg) => {
    if (field === "playerPhoto") {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview("");
      }
      if (file) {
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
      }
    } else if (field === "paymentScreenshot") {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
        setScreenshotPreview("");
      }
      if (file) {
        const url = URL.createObjectURL(file);
        setScreenshotPreview(url);
      }
    }

    setForm((prev) => ({ ...prev, [field]: file || null }));
    setErrors((prev) => ({ ...prev, [field]: errorMsg || "" }));
  };

  const handlePlayingStyleChange = (styles) => {
    setForm((prev) => ({ ...prev, playingStyle: styles }));
    if (errors.playingStyle) {
      setErrors((prev) => ({ ...prev, playingStyle: "" }));
    }
  };

  const handleRoleChange = (role) => {
    setForm((prev) => ({ ...prev, role }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: "" }));
  };

  // --- Dynamic Age Display from DOB ---
  const computedAge = calculateAge(form.dateOfBirth);

  // --- Comprehensive Frontend Validation ---
  const validate = () => {
    const newErrors = {};

    // Full Name
    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }

    // Mobile
    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      newErrors.mobile =
        "Enter a valid 10-digit Indian mobile number (starts with 6-9)";
    }

    // Date of Birth
    if (!form.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dobDate = new Date(form.dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(dobDate.getTime())) {
        newErrors.dateOfBirth = "Enter a valid date of birth";
      } else if (dobDate > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    // Father's Name
    if (!form.fatherName.trim()) {
      newErrors.fatherName = "Father's full name is required";
    } else if (form.fatherName.trim().length < 2) {
      newErrors.fatherName = "Father's name must be at least 2 characters";
    } else if (form.fatherName.trim().length > 100) {
      newErrors.fatherName = "Father's name cannot exceed 100 characters";
    }

    // Mother's Name
    if (!form.motherName.trim()) {
      newErrors.motherName = "Mother's full name is required";
    } else if (form.motherName.trim().length < 2) {
      newErrors.motherName = "Mother's name must be at least 2 characters";
    } else if (form.motherName.trim().length > 100) {
      newErrors.motherName = "Mother's name cannot exceed 100 characters";
    }

    // Standard
    if (!form.standard) {
      newErrors.standard = "Standard is required";
    } else {
      const parsedStd = Number(form.standard);
      if (!Number.isInteger(parsedStd) || !STANDARDS.includes(parsedStd)) {
        newErrors.standard = "Select a valid standard (1 to 9)";
      }
    }

    // Player Photo
    if (!form.playerPhoto) {
      newErrors.playerPhoto = "Player photo is required";
    }

    // Playing Style (1 to 2)
    if (!form.playingStyle || form.playingStyle.length === 0) {
      newErrors.playingStyle = "Select at least 1 playing style";
    } else if (form.playingStyle.length > 2) {
      newErrors.playingStyle = "Maximum 2 playing styles allowed";
    }

    // Player Role
    if (!form.role) {
      newErrors.role = "Player role is required";
    } else if (!PLAYER_ROLES.includes(form.role)) {
      newErrors.role = "Select a valid player role";
    }

    // Payment Method
    if (!["Cash", "Online"].includes(form.paymentMethod)) {
      newErrors.paymentMethod = "Please select a valid payment method";
    }

    // Payment Screenshot
    if (!form.paymentScreenshot) {
      newErrors.paymentScreenshot =
        form.paymentMethod === "Cash"
          ? "Please upload a photo of the cash receipt"
          : "Please upload the online payment screenshot";
    }

    // Transaction ID
    if (!form.transactionId.trim()) {
      newErrors.transactionId =
        form.paymentMethod === "Cash"
          ? "Receipt number is required"
          : "Transaction ID is required";
    } else if (form.transactionId.trim().length < 4) {
      newErrors.transactionId = "Transaction ID must be at least 4 characters";
    }

    // Merchandise: T-Shirt Size
    if (!form.tShirtSize) {
      newErrors.tShirtSize = "T-shirt size is required";
    } else if (!TSHIRT_SIZES.includes(form.tShirtSize)) {
      newErrors.tShirtSize = "Select a valid T-shirt size";
    }

    // Practice days (0–23)
    const practiceDays = Number(form.practice);
    if (
      form.practice === "" ||
      !Number.isInteger(practiceDays) ||
      practiceDays < PRACTICE_MIN ||
      practiceDays > PRACTICE_MAX
    ) {
      newErrors.practice = `Practice days must be a whole number between ${PRACTICE_MIN} and ${PRACTICE_MAX}`;
    }

    // Merchandise: T-Shirt Number (0-9999)
    if (
      form.tShirtNumber === "" ||
      form.tShirtNumber === null ||
      form.tShirtNumber === undefined
    ) {
      newErrors.tShirtNumber = "T-shirt number is required";
    } else {
      const num = Number(form.tShirtNumber);
      if (!Number.isInteger(num)) {
        newErrors.tShirtNumber = "T-shirt number must be a whole number";
      } else if (num < TSHIRT_NUMBER_MIN || num > TSHIRT_NUMBER_MAX) {
        newErrors.tShirtNumber = `T-shirt number must be between ${TSHIRT_NUMBER_MIN} and ${TSHIRT_NUMBER_MAX}`;
      }
    }

    // Merchandise: T-Shirt Name
    if (!form.tShirtName.trim()) {
      newErrors.tShirtName = "T-shirt name is required";
    } else if (form.tShirtName.trim().length > TSHIRT_NAME_MAX_LENGTH) {
      newErrors.tShirtName = `T-shirt name cannot exceed ${TSHIRT_NAME_MAX_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error(
        "Please fill all required fields correctly before submitting.",
      );
      // Smoothly scroll to the first element with an error
      setTimeout(() => {
        const errorEl = document.querySelector('[data-error="true"]');
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting your registration...");

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("mobile", form.mobile.trim());
      formData.append("dateOfBirth", form.dateOfBirth);
      formData.append("fatherName", form.fatherName.trim());
      formData.append("motherName", form.motherName.trim());
      formData.append("standard", form.standard);
      formData.append("role", form.role);
      formData.append("playingStyle", JSON.stringify(form.playingStyle));
      formData.append("tShirtSize", form.tShirtSize);
      formData.append("tShirtNumber", form.tShirtNumber);
      formData.append("tShirtName", form.tShirtName.trim().toUpperCase());
      formData.append("transactionId", form.transactionId.trim().toUpperCase());
      formData.append("playerPhoto", form.playerPhoto);
      formData.append("paymentScreenshot", form.paymentScreenshot);
      formData.append("paymentMethod", form.paymentMethod);
      formData.append("practice", form.practice);

      const response = await axios.post("/api/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.dismiss(loadingToast);
      toast.success("Registration submitted successfully! 🏏");
      setSuccessData(response.data.data);
    } catch (err) {
      toast.dismiss(loadingToast);
      const serverMessage =
        err.response?.data?.message ||
        "Registration failed. Please review your details and try again.";
      toast.error(serverMessage);

      // Map server-returned field errors if available
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const serverFieldErrors = {};
        err.response.data.errors.forEach((e) => {
          if (e.field) serverFieldErrors[e.field] = e.message;
        });
        setErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Reset only after closing success modal ---
  const handleCloseSuccess = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setPhotoPreview("");
    setScreenshotPreview("");
    setSuccessData(null);
    setForm(INITIAL_STATE);
    setErrors(INITIAL_ERRORS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Success Modal */}
      {successData && (
        <SuccessModal player={successData} onClose={handleCloseSuccess} />
      )}

      {/* Form Card */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(6,18,33,0.98) 0%,
              rgba(10,25,48,0.98) 45%,
              rgba(4,10,20,0.98) 100%
            )
          `,
          border: "1px solid rgba(0,170,255,0.18)",
          boxShadow: `
            0 0 25px rgba(0,170,255,0.12),
            0 0 60px rgba(0,0,0,0.8),
            inset 0 0 18px rgba(255,140,0,0.06)
          `,
        }}
      >
        {/* Top tri-color accent line */}
        <div
          className="h-1 w-full"
          style={{
            background: `
              linear-gradient(
                90deg,
                rgba(0,170,255,1) 0%,
                rgba(255,183,0,1) 50%,
                rgba(231,111,6,1) 100%
              )
            `,
          }}
        />

        {/* Form fields */}
        <form
          onSubmit={handleSubmit}
          className="px-6 sm:px-8 py-8 flex flex-col gap-8"
          noValidate
        >
          {/* SECTION A: Personal Information */}
          <FormSection label="Personal Information" icon="👤" index={0}>
            {/* Full Name */}
            <div data-error={!!errors.name}>
              <InputField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Enter player's complete legal name"
                required
                error={errors.name}
                icon="✍️"
              />
            </div>

            {/* Mobile Number */}
            <div data-error={!!errors.mobile}>
              <InputField
                label="Mobile Number"
                name="mobile"
                type="tel"
                value={form.mobile}
                onChange={handleChange("mobile")}
                placeholder="10-digit mobile number"
                required
                error={errors.mobile}
                icon="📱"
                maxLength={10}
                hint="Indian mobile numbers only (starting with 6, 7, 8 or 9)"
              />
            </div>

            {/* DOB */}
            <div data-error={!!errors.dateOfBirth}>
              <InputField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange("dateOfBirth")}
                required
                error={errors.dateOfBirth}
                icon="🎂"
                hint={
                  computedAge !== null
                    ? `Calculated Age: ${computedAge} years`
                    : undefined
                }
              />
            </div>

            {/* Father's & Mother's Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-error={!!errors.fatherName}>
                <InputField
                  label="Father's Full Name"
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange("fatherName")}
                  placeholder="Enter Father's name"
                  required
                  error={errors.fatherName}
                  icon="👨"
                />
              </div>

              <div data-error={!!errors.motherName}>
                <InputField
                  label="Mother's Full Name"
                  name="motherName"
                  value={form.motherName}
                  onChange={handleChange("motherName")}
                  placeholder="Enter Mother's name"
                  required
                  error={errors.motherName}
                  icon="👩"
                />
              </div>
            </div>

            {/* Standard Dropdown */}
            <div data-error={!!errors.standard}>
              <SelectField
                label="Standard"
                name="standard"
                value={form.standard}
                onChange={handleSelectChange("standard")}
                options={STANDARDS.map((s) => ({
                  value: s,
                  label: `Standard ${s}`,
                }))}
                placeholder="Select Standard"
                required
                error={errors.standard}
                icon="🎓"
              />
            </div>
          </FormSection>

          {/* SECTION B: Player Photo */}
          <FormSection label="Player Photo" icon="📸" index={1}>
            <div data-error={!!errors.playerPhoto}>
              <ImageUpload
                label="Upload Player Photo"
                name="playerPhoto"
                onImageSelect={handleImageSelect("playerPhoto")}
                previewUrl={photoPreview}
                error={errors.playerPhoto}
                icon="🤳"
                hint="Clear front-facing passport or portrait photo — JPG, PNG, or WebP (max 3 MB)"
                required
              />
            </div>
          </FormSection>

          {/* SECTION C: Playing Details */}
          <FormSection label="Playing Details" icon="🏏" index={2}>
            <div data-error={!!errors.playingStyle}>
              <PlayingStyleSelector
                selected={form.playingStyle}
                onChange={handlePlayingStyleChange}
                error={errors.playingStyle}
              />
            </div>

            <div data-error={!!errors.role}>
              <RoleSelector
                selected={form.role}
                onChange={handleRoleChange}
                error={errors.role}
              />
            </div>
          </FormSection>

          {/* SECTION D: Merchandise Information */}
          <FormSection label="Merchandise Information" icon="👕" index={3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-error={!!errors.tShirtSize}>
                <SelectField
                  label="T-Shirt Size"
                  name="tShirtSize"
                  value={form.tShirtSize}
                  onChange={handleSelectChange("tShirtSize")}
                  options={TSHIRT_SIZES}
                  placeholder="Select T-Shirt Size"
                  required
                  error={errors.tShirtSize}
                  icon="👕"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-error={!!errors.tShirtNumber}>
                <InputField
                  label={`T-Shirt Number (${TSHIRT_NUMBER_MIN}–${TSHIRT_NUMBER_MAX})`}
                  name="tShirtNumber"
                  type="number"
                  min={TSHIRT_NUMBER_MIN}
                  max={TSHIRT_NUMBER_MAX}
                  value={form.tShirtNumber}
                  onChange={handleChange("tShirtNumber")}
                  placeholder="e.g. 7, 18, 45"
                  required
                  error={errors.tShirtNumber}
                  icon="🔢"
                  hint={`Whole number between ${TSHIRT_NUMBER_MIN} and ${TSHIRT_NUMBER_MAX}`}
                />
              </div>

              <div data-error={!!errors.tShirtName}>
                <InputField
                  label={`T-Shirt Name (${form.tShirtName.length}/${TSHIRT_NAME_MAX_LENGTH})`}
                  name="tShirtName"
                  value={form.tShirtName}
                  onChange={handleChange("tShirtName")}
                  placeholder="e.g. SHARMA, VIRAT"
                  required
                  error={errors.tShirtName}
                  icon="✍️"
                  maxLength={TSHIRT_NAME_MAX_LENGTH}
                  hint={`Max ${TSHIRT_NAME_MAX_LENGTH} uppercase characters to be printed on jersey`}
                />
              </div>
            </div>
          </FormSection>

          {/* SECTION E: Payment Information */}
          <FormSection label="Payment Information" icon="💳" index={4}>
            {/* Payment Method */}
            <SelectField
              label="Payment Method"
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleSelectChange("paymentMethod")}
              options={["Cash", "Online"]}
              required
              error={errors.paymentMethod}
            />

            {/* Payment QR - Online only */}
            {form.paymentMethod === "Online" && <PaymentQR />}

            {/* Receipt / Screenshot Upload - Both methods */}
            <ImageUpload
              label={
                form.paymentMethod === "Cash"
                  ? "Cash Payment Receipt Photo"
                  : "Online Payment Screenshot"
              }
              name="paymentScreenshot"
              onImageSelect={handleImageSelect("paymentScreenshot")}
              previewUrl={screenshotPreview}
              error={errors.paymentScreenshot}
              icon="📸"
              hint="Upload a clear photo of your payment receipt or online transaction screenshot."
              required
            />

            {/* Receipt Number / Transaction ID */}
            <InputField
              label={
                form.paymentMethod === "Cash"
                  ? "Receipt Number"
                  : "UPI / Transaction ID"
              }
              name="transactionId"
              value={form.transactionId}
              onChange={handleChange("transactionId")}
              placeholder={
                form.paymentMethod === "Cash"
                  ? "Enter receipt number"
                  : "Enter UPI transaction ID"
              }
              required
              error={errors.transactionId}
            />

            <InputField
              label="Number of days available for practice"
              name="practice"
              type="number"
              min={PRACTICE_MIN}
              max={PRACTICE_MAX}
              value={form.practice}
              onChange={handleChange("practice")}
              placeholder="e.g. 10, 20, 23"
              required
              error={errors.practice}
              icon="🔢"
              hint={`Whole number between ${PRACTICE_MIN} and ${PRACTICE_MAX}`}
            />
          </FormSection>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full py-4 rounded-xl font-bold text-base tracking-widest uppercase transition-all duration-200 overflow-hidden group shadow-lg"
              style={{
                background: isSubmitting
                  ? "rgba(34,197,94,0.3)"
                  : "linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.15em",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: isSubmitting
                  ? "none"
                  : "0 8px 32px rgba(34,197,94,0.35)",
                fontSize: "16px",
              }}
            >
              {/* Shimmer effect */}
              {!isSubmitting && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s linear infinite",
                  }}
                />
              )}

              {/* Button content */}
              <span className="relative flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Submitting Registration...
                  </>
                ) : (
                  <>
                    <span>🏏</span>
                    Submit MPL 2026 Registration
                    <span>→</span>
                  </>
                )}
              </span>
            </button>

            <p
              className="text-center text-xs mt-3"
              style={{ color: "var(--color-text-dim)" }}
            >
              By registering, you confirm all details provided are accurate and
              the payment has been completed.
              <br />
              All participants agree to abide by the rules and regulations of
              MPL 2026.
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

// Section wrapper component with label and accent line
function FormSection({ label, icon, index, children }) {
  return (
    <div
      className="form-section flex flex-col gap-5"
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm"
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          {icon}
        </div>
        <h3
          className="text-xs font-semibold tracking-widest uppercase"
          style={{
            color: "rgba(34,197,94,0.9)",
            fontFamily: "var(--font-accent)",
          }}
        >
          {label}
        </h3>
        <div
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(to right, rgba(34,197,94,0.2), transparent)",
          }}
        />
      </div>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

// Loading Spinner SVG
function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
      <path
        d="M9 2a7 7 0 0 1 7 7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
