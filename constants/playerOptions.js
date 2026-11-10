/**
 * Shared Player Options Constants - Single Source of Truth
 * Strictly mapped to Mongoose Player model.
 * Used across Frontend, Backend API, Mongoose Schema, and Admin Dashboard.
 */

// Standards 1 through 9 for tournament eligibility
export const STANDARDS = [4, 5, 6, 7, 8, 9];

export const PLAYER_ROLES = ["Batsman", "Bowler", "All Rounder"];

export const PLAYING_STYLES = [
  "Right Arm Batting",
  "Right Arm Balling",
  "Left Arm Batting",
  "Left Arm Balling",
];

export const TSHIRT_SIZES = [
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
];

export const TSHIRT_NUMBER_MIN = 0;
export const TSHIRT_NUMBER_MAX = 9999;
export const TSHIRT_NAME_MAX_LENGTH = 20;

export const PRACTICE_MIN = 0;
export const PRACTICE_MAX = 23;

export const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
