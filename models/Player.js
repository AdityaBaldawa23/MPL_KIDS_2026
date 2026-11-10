/**
 * Player Registration Schema
 * Mongoose model for cricket tournament player registrations
 * Single Source of Truth for all allowed player fields
 */
import mongoose from "mongoose";
import PlayerCounter from "./PlayerCounter";
import {
  STANDARDS,
  PLAYER_ROLES,
  PLAYING_STYLES,
  TSHIRT_SIZES,
  TSHIRT_NUMBER_MIN,
  TSHIRT_NUMBER_MAX,
  PRACTICE_MIN,
  PRACTICE_MAX,
} from "../constants/playerOptions";

const previousPerformanceSchema = new mongoose.Schema(
  {
    year: Number,
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    fielding: { type: Number, default: 0 },
    mom: { type: Number, default: 0 },
    battingAvg: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
  },
  { _id: false },
);

const PlayerSchema = new mongoose.Schema(
  {
    playerID: {
      type: Number,
      unique: true,
    },
    // Player's full name
    playerName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    // Indian mobile number (10 digits)
    playerPhone: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number"],
    },

    // Date of Birth
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
      minlength: [2, "Father's name must be at least 2 characters"],
      maxlength: [100, "Father's name cannot exceed 100 characters"],
    },

    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
      minlength: [2, "Mother's name must be at least 2 characters"],
      maxlength: [100, "Mother's name cannot exceed 100 characters"],
    },

    standard: {
      type: Number,
      required: [true, "Standard is required"],
      enum: {
        values: STANDARDS,
        message: "{VALUE} is not a valid standard",
      },
      validate: {
        validator: Number.isInteger,
        message: "Standard must be a whole integer",
      },
    },

    // Historical Age field - preserved for backward compatibility
    Age: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Player photo stored in Cloudinary
    playerPhoto: {
      url: {
        type: String,
        required: [true, "Player photo is required"],
      },
      public_id: {
        type: String,
        required: [true, "Player photo public ID is required"],
      },
    },

    // Playing styles (1 to 2 selections)
    playingStyle: {
      type: [String],
      required: [true, "At least one playing style is required"],
      enum: {
        values: PLAYING_STYLES,
        message: "{VALUE} is not a valid playing style",
      },
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length >= 1 && arr.length <= 2;
        },
        message: "Select 1 to 2 playing styles only",
      },
    },

    // Player role in the team
    playerType: {
      type: String,
      required: [true, "Player role is required"],
      enum: {
        values: PLAYER_ROLES,
        message: "{VALUE} is not a valid role",
      },
    },

    previousPerformance: [previousPerformanceSchema],

    tShirtSize: {
      type: String,
      required: [true, "T-shirt size is required"],
      enum: {
        values: TSHIRT_SIZES,
        message: "{VALUE} is not a valid clothing size",
      },
    },

    tShirtNumber: {
      type: Number,
      required: [true, "T-shirt number is required"],
      min: [
        TSHIRT_NUMBER_MIN,
        `T-shirt number cannot be less than ${TSHIRT_NUMBER_MIN}`,
      ],
      max: [
        TSHIRT_NUMBER_MAX,
        `T-shirt number cannot exceed ${TSHIRT_NUMBER_MAX}`,
      ],
      validate: {
        validator: Number.isInteger,
        message: "T-shirt number must be a whole integer",
      },
    },

    tShirtName: {
      type: String,
      required: [true, "T-shirt name is required"],
      trim: true,
      uppercase: true,
      maxlength: [20, "T-shirt name cannot exceed 20 characters"],
    },

    playerPool: {
      type: Number,
      default: 0,
    },

    playerCategory: {
      type: String,
      default: "Undefined",
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Online"],
      required: true,
      default: "Cash",
    },

    // Payment screenshot stored in Cloudinary
    paymentScreenshot: {
      url: {
        type: String,
        required: [true, "Payment screenshot is required"],
      },
      public_id: {
        type: String,
        required: [true, "Payment screenshot public ID is required"],
      },
    },

    // Unique transaction ID from payment
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    practice: {
      type: Number,
      min: PRACTICE_MIN,
      max: PRACTICE_MAX,
      validate: {
        validator: Number.isInteger,
        message: "Practice days must be a whole number.",
      },
      default: 23,
    },

    // Registration status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    // Auto timestamps: createdAt & updatedAt
    timestamps: true,
  },
);

PlayerSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await PlayerCounter.findOneAndUpdate(
      { id: "playerID" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.playerID = counter.seq;
  }
  next();
});

// Indexes for faster queries
PlayerSchema.index({ playerPhone: 1 });
PlayerSchema.index({ status: 1 });
PlayerSchema.index({ createdAt: -1 });
PlayerSchema.index({ standard: 1 });
PlayerSchema.index({ tShirtNumber: 1 });

// Prevent model overwrite in development (hot reload)
const Player = mongoose.models.Player || mongoose.model("Player", PlayerSchema);

export default Player;
