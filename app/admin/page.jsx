"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  STANDARDS,
  PLAYER_ROLES,
  PLAYING_STYLES,
  TSHIRT_SIZES,
  TSHIRT_NUMBER_MIN,
  TSHIRT_NUMBER_MAX,
  TSHIRT_NAME_MAX_LENGTH,
  PRACTICE_MIN,
  PRACTICE_MAX,
} from "../../constants/playerOptions";
import { calculateAge } from "../../utils/apiHelpers";

/* ─── styling constants ─────────────────────────────────────── */
const STATUS_COLORS = {
  pending: { bg: "#FFF8E1", text: "#D97706", border: "#FDE68A" },
  approved: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

const STATUS_OPTIONS = ["pending", "approved", "rejected"];

function Badge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: "3px 12px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

function Avatar({ src, name, size = 40 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: size * 0.35,
          flexShrink: 0,
        }}
      >
        {(name || "?")[0].toUpperCase()}
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name || "Player"}
      onError={() => setErr(true)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: "2px solid #E2E8F0",
      }}
    />
  );
}

// Format date helper with fallback
function formatDate(d) {
  if (!d) return "Not Available";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "Not Available";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Parse previous performance string format: "2025 :- M:5, R:120, W:3, F:2 | 2024 :- M:4, R:80, W:1, F:1"
function parsePreviousPerformance(recordString) {
  if (!recordString || recordString === "N/A") return [];

  return recordString
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((season) => {
      const match = season.match(/(\d{4})\s*:-\s*(.*)/);
      if (!match) return null;

      const year = Number(match[1]);
      const statsPart = match[2];

      const data = {
        year,
        matches: 0,
        runs: 0,
        wickets: 0,
        fielding: 0,
        mom: 0,
        battingAvg: 0,
        strikeRate: 0,
        economy: 0,
      };

      statsPart.split(",").forEach((pair) => {
        const [k, v] = pair.split(":").map((x) => x?.trim());
        const value = Number(v) || 0;

        if (k === "M") data.matches = value;
        if (k === "R") data.runs = value;
        if (k === "W") data.wickets = value;
        if (k === "F") data.fielding = value;
        if (k === "MOM") data.mom = value;
        if (k === "AVG") data.battingAvg = value;
        if (k === "SR") data.strikeRate = value;
        if (k === "ECON") data.economy = value;
      });

      return data;
    })
    .filter(Boolean);
}

// Format previous performance array to summary string
function formatPerformanceSummary(perfArray) {
  if (!Array.isArray(perfArray) || perfArray.length === 0) return "None";
  return perfArray
    .map(
      (s) =>
        `${s.year} :- M:${s.matches || 0}, R:${s.runs || 0}, W:${s.wickets || 0}, F:${s.fielding || 0}${s.mom ? `, MOM:${s.mom}` : ""}`
    )
    .join(" | ");
}

/* ─── Main Admin Component ──────────────────────────────────── */
export default function PlayersAdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Data & Table state
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [selectedPlayer, setSelected] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingPlayer, setDeletingPlayer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterStatus, setFStatus] = useState("");
  const [filterType, setFType] = useState("");
  const [filterPool, setFPool] = useState("");
  const [filterStandard, setFStandard] = useState("");
  const [filterPayment, setFPayment] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    batsmen: 0,
    bowlers: 0,
    allRounders: 0,
    cash: 0,
    online: 0,
  });

  const debounceRef = useRef(null);

  // Show toast notification
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Check initial admin auth session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setPasswordInput("");
        showToast("Logged in successfully! Welcome to Admin Panel.");
      } else {
        setLoginError(data.message || "Invalid password");
      }
    } catch {
      setLoginError("Login request failed. Check server status.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    setPlayers([]);
    showToast("Logged out successfully.");
  };

  // Recalculate stats from list
  const refreshStats = useCallback(async () => {
    try {
      const r = await fetch(`/api/players?limit=10000`);
      const d = await r.json();
      if (d.success) {
        const all = d.data.players;
        setStats({
          total: all.length,
          pending: all.filter((p) => p.status === "pending").length,
          approved: all.filter((p) => p.status === "approved").length,
          rejected: all.filter((p) => p.status === "rejected").length,
          batsmen: all.filter((p) => p.playerType === "Batsman").length,
          bowlers: all.filter((p) => p.playerType === "Bowler").length,
          allRounders: all.filter((p) => p.playerType === "All Rounder").length,
          cash: all.filter((p) => p.paymentMethod === "Cash").length,
          online: all.filter((p) => p.paymentMethod === "Online").length,
        });
      }
    } catch (e) {
      console.error("Stats refresh error:", e);
    }
  }, []);

  // Fetch players with active filters
  const fetchPlayers = useCallback(
    async (overrides = {}) => {
      if (!isAuthenticated) return;
      setLoading(true);
      const targetPage = overrides.page ?? page;
      const targetSearch =
        overrides.search !== undefined ? overrides.search : search;
      const targetStatus =
        overrides.filterStatus !== undefined
          ? overrides.filterStatus
          : filterStatus;
      const targetType =
        overrides.filterType !== undefined ? overrides.filterType : filterType;
      const targetPool =
        overrides.filterPool !== undefined ? overrides.filterPool : filterPool;
      const targetStd =
        overrides.filterStandard !== undefined
          ? overrides.filterStandard
          : filterStandard;
      const targetPay =
        overrides.filterPayment !== undefined
          ? overrides.filterPayment
          : filterPayment;

      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString(),
        ...(targetSearch && { search: targetSearch }),
        ...(targetStatus && { status: targetStatus }),
        ...(targetType && { playerType: targetType }),
        ...(targetPool && { playerPool: targetPool }),
        ...(targetStd && { standard: targetStd }),
        ...(targetPay && { paymentMethod: targetPay }),
      });

      try {
        const r = await fetch(`/api/players?${params.toString()}`);
        const data = await r.json();
        if (data.success) {
          setPlayers(data.data.players);
          setPagination(data.data.pagination);
        } else {
          showToast(data.message || "Failed to fetch players", "error");
        }
      } catch {
        showToast("Network error while fetching players", "error");
      } finally {
        setLoading(false);
      }
    },
    [
      isAuthenticated,
      page,
      limit,
      search,
      filterStatus,
      filterType,
      filterPool,
      filterStandard,
      filterPayment,
    ],
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlayers();
      refreshStats();
    }
  }, [isAuthenticated, fetchPlayers, refreshStats]);

  useEffect(() => {
    if (!isAuthenticated) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPlayers({ page: 1, search });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search, isAuthenticated, fetchPlayers]);

  // Status update
  const updateStatus = async (playerId, newStatus) => {
    try {
      const r = await fetch(`/api/players/${playerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await r.json();
      if (data.success) {
        setPlayers((prev) =>
          prev.map((p) =>
            p._id === playerId ? { ...p, status: newStatus } : p,
          ),
        );
        if (selectedPlayer?._id === playerId) {
          setSelected((prev) => ({ ...prev, status: newStatus }));
        }
        showToast(`Status updated to "${newStatus}"`);
        refreshStats();
      } else {
        showToast(data.message || "Status update failed", "error");
      }
    } catch {
      showToast("Network error updating status", "error");
    }
  };

  // Delete player
  const handleDeletePlayer = async () => {
    if (!deletingPlayer) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/players/${deletingPlayer._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPlayers((prev) => prev.filter((p) => p._id !== deletingPlayer._id));
        if (selectedPlayer?._id === deletingPlayer._id) {
          setSelected(null);
        }
        showToast(data.message || "Player deleted successfully!");
        setDeletingPlayer(null);
        refreshStats();
        fetchPlayers();
      } else {
        showToast(data.message || "Failed to delete player", "error");
      }
    } catch {
      showToast("Network error deleting player", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch all players for export
  const fetchAllForExport = async () => {
    const r = await fetch(`/api/players?limit=10000`);
    const d = await r.json();
    return d.success ? d.data.players : players;
  };

  // Excel Export
  const exportExcel = async () => {
    setExporting("excel");
    try {
      const all = await fetchAllForExport();
      const rows = all.map((p) => {
        const computed = calculateAge(p.dateOfBirth, p.Age);
        return {
          "Player ID": p.playerID ?? "Not Available",
          "Full Name": p.playerName || "Not Available",
          "Mobile Number": p.playerPhone || "Not Available",
          "Date of Birth": formatDate(p.dateOfBirth),
          "Calculated Age": computed !== null ? computed : "Not Available",
          "Father's Name": p.fatherName || "Not Available",
          "Mother's Name": p.motherName || "Not Available",
          Standard: p.standard ?? "Not Available",
          "Player Role": p.playerType || "Not Available",
          "Playing Style": Array.isArray(p.playingStyle)
            ? p.playingStyle.join(", ")
            : p.playingStyle || "Not Available",
          "T-Shirt Size": p.tShirtSize || "Not Available",
          "T-Shirt Number": p.tShirtNumber ?? "Not Available",
          "T-Shirt Name": p.tShirtName || "Not Available",
          "Practice Availability (Days)":
            p.practice !== undefined && p.practice !== null
              ? p.practice
              : "Not Available",
          "Payment Method": p.paymentMethod || "Not Available",
          "Transaction ID": p.transactionId || "Not Available",
          "Player Category": p.playerCategory || "Not Available",
          "Player Pool": p.playerPool ?? "Not Available",
          "Registration Status": p.status || "Not Available",
          "Previous Performance": formatPerformanceSummary(
            p.previousPerformance,
          ),
          "Player Photo URL": p.playerPhoto?.url || "Not Available",
          "Payment Screenshot URL": p.paymentScreenshot?.url || "Not Available",
          "Registration Date": p.createdAt
            ? new Date(p.createdAt).toLocaleString("en-IN")
            : "Not Available",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      ws["!cols"] = [
        { wch: 10 }, // Player ID
        { wch: 22 }, // Full Name
        { wch: 15 }, // Mobile
        { wch: 15 }, // DOB
        { wch: 14 }, // Age
        { wch: 20 }, // Father's Name
        { wch: 20 }, // Mother's Name
        { wch: 12 }, // Standard
        { wch: 14 }, // Role
        { wch: 28 }, // Playing Style
        { wch: 12 }, // T-Shirt Size
        { wch: 14 }, // T-Shirt Number
        { wch: 16 }, // T-Shirt Name
        { wch: 26 }, // Practice
        { wch: 16 }, // Payment Method
        { wch: 22 }, // Transaction ID
        { wch: 14 }, // Category
        { wch: 12 }, // Pool
        { wch: 16 }, // Status
        { wch: 45 }, // Performance
        { wch: 40 }, // Photo URL
        { wch: 40 }, // Payment Screenshot URL
        { wch: 22 }, // Registered Date
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MPL 2026 Kids");
      XLSX.writeFile(wb, `MPL_Kids_2026_Players_${Date.now()}.xlsx`);
      showToast("Excel exported successfully with accurate model fields!");
    } catch (e) {
      console.error("Export error:", e);
      showToast("Excel export failed", "error");
    } finally {
      setExporting("");
    }
  };

  /* ─── Player Edit Modal Component ────────────────────────── */
  const PlayerEditModal = ({ player, onClose, onSaveSuccess }) => {
    const [editForm, setEditForm] = useState({
      playerName: player.playerName || "",
      playerPhone: player.playerPhone || "",
      dateOfBirth: player.dateOfBirth
        ? new Date(player.dateOfBirth).toISOString().split("T")[0]
        : "",
      fatherName: player.fatherName || "",
      motherName: player.motherName || "",
      standard: player.standard !== undefined ? String(player.standard) : "",
      playingStyle: Array.isArray(player.playingStyle)
        ? player.playingStyle
        : [],
      playerType: player.playerType || "",
      tShirtSize: player.tShirtSize || "",
      tShirtNumber:
        player.tShirtNumber !== undefined ? String(player.tShirtNumber) : "",
      tShirtName: player.tShirtName || "",
      practice: player.practice !== undefined ? String(player.practice) : "23",
      paymentMethod: player.paymentMethod || "Cash",
      transactionId: player.transactionId || "",
      playerCategory: player.playerCategory || "Undefined",
      playerPool:
        player.playerPool !== undefined ? String(player.playerPool) : "0",
      status: player.status || "pending",
      previousPerformance: Array.isArray(player.previousPerformance)
        ? JSON.parse(JSON.stringify(player.previousPerformance))
        : [],
    });

    const [quickImportText, setQuickImportText] = useState("");
    const [editErrors, setEditErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const handleStyleToggle = (styleVal) => {
      setEditForm((prev) => {
        let updated = [...prev.playingStyle];
        if (updated.includes(styleVal)) {
          updated = updated.filter((s) => s !== styleVal);
        } else {
          if (updated.length >= 2) return prev;
          updated.push(styleVal);
        }
        return { ...prev, playingStyle: updated };
      });
      if (editErrors.playingStyle)
        setEditErrors((prev) => ({ ...prev, playingStyle: "" }));
    };

    const handleAddSeason = () => {
      setEditForm((prev) => ({
        ...prev,
        previousPerformance: [
          ...prev.previousPerformance,
          {
            year: new Date().getFullYear() - 1,
            matches: 0,
            runs: 0,
            wickets: 0,
            fielding: 0,
            mom: 0,
            battingAvg: 0,
            strikeRate: 0,
            economy: 0,
          },
        ],
      }));
    };

    const handleSeasonChange = (index, field, val) => {
      setEditForm((prev) => {
        const copy = [...prev.previousPerformance];
        copy[index] = {
          ...copy[index],
          [field]: val === "" ? "" : Number(val) || 0,
        };
        return { ...prev, previousPerformance: copy };
      });
    };

    const handleRemoveSeason = (index) => {
      setEditForm((prev) => ({
        ...prev,
        previousPerformance: prev.previousPerformance.filter(
          (_, i) => i !== index,
        ),
      }));
    };

    const handleImportQuickString = () => {
      if (!quickImportText.trim()) return;
      const parsed = parsePreviousPerformance(quickImportText.trim());
      if (parsed.length === 0) {
        showToast(
          "Invalid format. Example: 2025 :- M:5, R:120, W:3, F:2",
          "error",
        );
        return;
      }
      setEditForm((prev) => ({
        ...prev,
        previousPerformance: [...prev.previousPerformance, ...parsed],
      }));
      setQuickImportText("");
      showToast(`Added ${parsed.length} season record(s) from text!`);
    };

    const handleSave = async (e) => {
      e.preventDefault();
      const errs = {};

      if (!editForm.playerName.trim()) errs.playerName = "Name is required";
      if (!/^[6-9]\d{9}$/.test(editForm.playerPhone.trim())) {
        errs.playerPhone = "10-digit mobile starting with 6-9 required";
      }
      if (!editForm.dateOfBirth) errs.dateOfBirth = "Date of Birth required";
      if (!editForm.fatherName.trim())
        errs.fatherName = "Father's name required";
      if (!editForm.motherName.trim())
        errs.motherName = "Mother's name required";

      const stdNum = Number(editForm.standard);
      if (
        editForm.standard === "" ||
        !Number.isInteger(stdNum) ||
        !STANDARDS.includes(stdNum)
      ) {
        errs.standard = `Standard must be between ${STANDARDS[0]} and ${STANDARDS[STANDARDS.length - 1]}`;
      }

      if (!editForm.playingStyle || editForm.playingStyle.length === 0) {
        errs.playingStyle = "Select 1 to 2 playing styles";
      }
      if (!editForm.playerType) errs.playerType = "Player role is required";
      if (!editForm.tShirtSize) errs.tShirtSize = "T-shirt size is required";

      const num = Number(editForm.tShirtNumber);
      if (
        editForm.tShirtNumber === "" ||
        !Number.isInteger(num) ||
        num < TSHIRT_NUMBER_MIN ||
        num > TSHIRT_NUMBER_MAX
      ) {
        errs.tShirtNumber = `Number must be integer between ${TSHIRT_NUMBER_MIN} and ${TSHIRT_NUMBER_MAX}`;
      }

      if (
        !editForm.tShirtName.trim() ||
        editForm.tShirtName.trim().length > TSHIRT_NAME_MAX_LENGTH
      ) {
        errs.tShirtName = `T-shirt name required (max ${TSHIRT_NAME_MAX_LENGTH} chars)`;
      }

      const prac = Number(editForm.practice);
      if (
        editForm.practice === "" ||
        !Number.isInteger(prac) ||
        prac < PRACTICE_MIN ||
        prac > PRACTICE_MAX
      ) {
        errs.practice = `Practice days must be whole number between ${PRACTICE_MIN} and ${PRACTICE_MAX}`;
      }

      if (!editForm.transactionId.trim()) {
        errs.transactionId = "Transaction ID is required";
      }

      if (Object.keys(errs).length > 0) {
        setEditErrors(errs);
        showToast("Please correct the errors in the form", "error");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          playerName: editForm.playerName.trim(),
          playerPhone: editForm.playerPhone.trim(),
          dateOfBirth: editForm.dateOfBirth,
          fatherName: editForm.fatherName.trim(),
          motherName: editForm.motherName.trim(),
          standard: stdNum,
          playingStyle: editForm.playingStyle,
          playerType: editForm.playerType,
          tShirtSize: editForm.tShirtSize,
          tShirtNumber: num,
          tShirtName: editForm.tShirtName.trim().toUpperCase(),
          practice: prac,
          paymentMethod: editForm.paymentMethod,
          transactionId: editForm.transactionId.trim().toUpperCase(),
          playerCategory: editForm.playerCategory,
          playerPool: Number(editForm.playerPool) || 0,
          status: editForm.status,
          previousPerformance: editForm.previousPerformance,
        };

        const res = await fetch(`/api/players/${player._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          showToast("Player updated successfully!");
          onSaveSuccess(data.data.player);
          onClose();
        } else {
          showToast(data.message || "Failed to update player", "error");
        }
      } catch {
        showToast("Network error updating player", "error");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div
        style={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div style={{ ...styles.modal, maxWidth: 860, maxHeight: "92vh" }}>
          <div style={styles.modalHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar
                src={player.playerPhoto?.url}
                name={editForm.playerName}
                size={48}
              />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                  Edit Player #{player.playerID ?? "—"}
                </h2>
                <p style={{ fontSize: 12, color: "#64748B" }}>
                  Update registered details strictly consistent with Player model
                </p>
              </div>
            </div>
            <button onClick={onClose} style={styles.closeBtn}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSave} style={{ overflowY: "auto", padding: 24 }}>
            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>👤 Personal Information</h3>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.inputLabel}>Full Legal Name *</label>
                  <input
                    type="text"
                    value={editForm.playerName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, playerName: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.playerName && (
                    <span style={styles.errorText}>
                      {editErrors.playerName}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>Mobile Number *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.playerPhone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, playerPhone: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.playerPhone && (
                    <span style={styles.errorText}>
                      {editErrors.playerPhone}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>Date of Birth *</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dateOfBirth: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.dateOfBirth && (
                    <span style={styles.errorText}>
                      {editErrors.dateOfBirth}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>Standard / Grade *</label>
                  <select
                    value={editForm.standard}
                    onChange={(e) =>
                      setEditForm({ ...editForm, standard: e.target.value })
                    }
                    style={styles.select}
                  >
                    <option value="">Select Standard</option>
                    {STANDARDS.map((s) => (
                      <option key={s} value={s}>
                        Standard {s}
                      </option>
                    ))}
                  </select>
                  {editErrors.standard && (
                    <span style={styles.errorText}>{editErrors.standard}</span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>Father&apos;s Full Name *</label>
                  <input
                    type="text"
                    value={editForm.fatherName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fatherName: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.fatherName && (
                    <span style={styles.errorText}>
                      {editErrors.fatherName}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>Mother&apos;s Full Name *</label>
                  <input
                    type="text"
                    value={editForm.motherName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, motherName: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.motherName && (
                    <span style={styles.errorText}>
                      {editErrors.motherName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>🏏 Playing Details</h3>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.inputLabel}>Player Role *</label>
                  <select
                    value={editForm.playerType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, playerType: e.target.value })
                    }
                    style={styles.select}
                  >
                    <option value="">Select Role</option>
                    {PLAYER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {editErrors.playerType && (
                    <span style={styles.errorText}>
                      {editErrors.playerType}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>
                    Playing Styles (Select 1 to 2) *
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {PLAYING_STYLES.map((st) => {
                      const sel = editForm.playingStyle.includes(st);
                      return (
                        <button
                          type="button"
                          key={st}
                          onClick={() => handleStyleToggle(st)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: sel
                              ? "1px solid #16A34A"
                              : "1px solid #CBD5E1",
                            background: sel ? "#ECFDF5" : "#F8FAFC",
                            color: sel ? "#166534" : "#475569",
                          }}
                        >
                          {sel ? "✓ " : ""}
                          {st}
                        </button>
                      );
                    })}
                  </div>
                  {editErrors.playingStyle && (
                    <span style={styles.errorText}>
                      {editErrors.playingStyle}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>Player Pool (0–8)</label>
                  <select
                    value={editForm.playerPool}
                    onChange={(e) =>
                      setEditForm({ ...editForm, playerPool: e.target.value })
                    }
                    style={styles.select}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pool) => (
                      <option key={pool} value={pool}>
                        Pool {pool}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.inputLabel}>Player Category</label>
                  <input
                    type="text"
                    value={editForm.playerCategory}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        playerCategory: e.target.value,
                      })
                    }
                    placeholder="e.g. A, B, Undefined"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>👕 Merchandise</h3>
              <div style={styles.grid3}>
                <div>
                  <label style={styles.inputLabel}>T-Shirt Size *</label>
                  <select
                    value={editForm.tShirtSize}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tShirtSize: e.target.value })
                    }
                    style={styles.select}
                  >
                    <option value="">Select Size</option>
                    {TSHIRT_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        Size {sz}
                      </option>
                    ))}
                  </select>
                  {editErrors.tShirtSize && (
                    <span style={styles.errorText}>
                      {editErrors.tShirtSize}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>T-Shirt Number *</label>
                  <input
                    type="number"
                    min={TSHIRT_NUMBER_MIN}
                    max={TSHIRT_NUMBER_MAX}
                    value={editForm.tShirtNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tShirtNumber: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.tShirtNumber && (
                    <span style={styles.errorText}>
                      {editErrors.tShirtNumber}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>T-Shirt Name *</label>
                  <input
                    type="text"
                    maxLength={TSHIRT_NAME_MAX_LENGTH}
                    value={editForm.tShirtName}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        tShirtName: e.target.value.toUpperCase(),
                      })
                    }
                    style={styles.input}
                  />
                  {editErrors.tShirtName && (
                    <span style={styles.errorText}>
                      {editErrors.tShirtName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>💳 Payment & Practice</h3>
              <div style={styles.grid3}>
                <div>
                  <label style={styles.inputLabel}>Payment Method *</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    style={styles.select}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label style={styles.inputLabel}>
                    Receipt / Transaction ID *
                  </label>
                  <input
                    type="text"
                    value={editForm.transactionId}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        transactionId: e.target.value.toUpperCase(),
                      })
                    }
                    style={styles.input}
                  />
                  {editErrors.transactionId && (
                    <span style={styles.errorText}>
                      {editErrors.transactionId}
                    </span>
                  )}
                </div>

                <div>
                  <label style={styles.inputLabel}>
                    Practice Availability (0–23 days) *
                  </label>
                  <input
                    type="number"
                    min={PRACTICE_MIN}
                    max={PRACTICE_MAX}
                    value={editForm.practice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, practice: e.target.value })
                    }
                    style={styles.input}
                  />
                  {editErrors.practice && (
                    <span style={styles.errorText}>{editErrors.practice}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>📌 Registration Status</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, status: st })}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      border:
                        editForm.status === st
                          ? `2px solid ${STATUS_COLORS[st].text}`
                          : "1px solid #CBD5E1",
                      background:
                        editForm.status === st
                          ? STATUS_COLORS[st].bg
                          : "#F8FAFC",
                      color:
                        editForm.status === st
                          ? STATUS_COLORS[st].text
                          : "#64748B",
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formSection}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3 style={styles.formSectionTitle}>
                  📊 Previous Performance (Tournament Stats)
                </h3>
                <button
                  type="button"
                  onClick={handleAddSeason}
                  style={{
                    padding: "4px 10px",
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Season
                </button>
              </div>

              {/* Quick import text */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Quick string e.g. 2025 :- M:5, R:120, W:3, F:2"
                  value={quickImportText}
                  onChange={(e) => setQuickImportText(e.target.value)}
                  style={{ ...styles.input, flex: 1, fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleImportQuickString}
                  style={{
                    padding: "8px 12px",
                    background: "#1E3A8A",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  Parse
                </button>
              </div>

              {editForm.previousPerformance.map((season, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div style={{ width: 70 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>Year</label>
                    <input
                      type="number"
                      value={season.year ?? ""}
                      onChange={(e) =>
                        handleSeasonChange(idx, "year", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 55 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>M</label>
                    <input
                      type="number"
                      value={season.matches ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "matches", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 55 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>R</label>
                    <input
                      type="number"
                      value={season.runs ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "runs", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 55 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>W</label>
                    <input
                      type="number"
                      value={season.wickets ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "wickets", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 55 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>F</label>
                    <input
                      type="number"
                      value={season.fielding ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "fielding", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 55 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>MOM</label>
                    <input
                      type="number"
                      value={season.mom ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "mom", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 65 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>Avg</label>
                    <input
                      type="number"
                      value={season.battingAvg ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "battingAvg", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 65 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>SR</label>
                    <input
                      type="number"
                      value={season.strikeRate ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "strikeRate", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <div style={{ width: 65 }}>
                    <label style={{ fontSize: 9, color: "#64748B" }}>Econ</label>
                    <input
                      type="number"
                      value={season.economy ?? 0}
                      onChange={(e) =>
                        handleSeasonChange(idx, "economy", e.target.value)
                      }
                      style={{ ...styles.input, padding: "4px 6px" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSeason(idx)}
                    style={{
                      background: "#FEE2E2",
                      color: "#DC2626",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      marginTop: 14,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#475569",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: saving ? "#94A3B8" : "#16A34A",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  /* ─── Player Detail View Modal Component ─────────────────── */
  const PlayerModal = ({ player, onClose }) => {
    const [localStatus, setLocalStatus] = useState(player.status);
    const [saving, setSaving] = useState(false);
    const [playerPool, setPlayerPool] = useState(player.playerPool ?? 0);
    const computedAge = calculateAge(player.dateOfBirth, player.Age);

    const updatePool = async () => {
      try {
        const r = await fetch(`/api/players/${player._id}/pool`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerPool: Number(playerPool) }),
        });
        const data = await r.json();
        if (data.success) {
          setPlayers((prev) =>
            prev.map((p) =>
              p._id === player._id ? { ...p, playerPool: Number(playerPool) } : p,
            ),
          );
          setSelected((prev) => ({ ...prev, playerPool: Number(playerPool) }));
          showToast(`Player pool updated to ${playerPool}`);
        } else {
          showToast(data.message || "Failed to update pool", "error");
        }
      } catch {
        showToast("Error updating player pool", "error");
      }
    };

    const saveStatus = async () => {
      if (localStatus === player.status) {
        onClose();
        return;
      }
      setSaving(true);
      await updateStatus(player._id, localStatus);
      setSaving(false);
      onClose();
    };

    return (
      <div
        style={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div style={styles.modal}>
          {/* Header */}
          <div style={styles.modalHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar
                src={player.playerPhoto?.url}
                name={player.playerName}
                size={54}
              />
              <div>
                <div
                  style={{ fontWeight: 800, fontSize: 19, color: "#0F172A" }}
                >
                  {player.playerName}
                </div>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  Player ID: #{player.playerID ?? "—"} &nbsp;·&nbsp;{" "}
                  {player.playerType} &nbsp;·&nbsp;{" "}
                  <Badge status={player.status} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => {
                  setEditingPlayer(player);
                }}
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1E40AF",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ✏️ Edit Player
              </button>
              <button
                onClick={() => {
                  setDeletingPlayer(player);
                }}
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                🗑️ Delete
              </button>
              <button onClick={onClose} style={styles.closeBtn}>
                ✕
              </button>
            </div>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.twoCol}>
              {/* Left Column: Details */}
              <div>
                <Section title="Personal Information">
                  <Field label="Full Name" value={player.playerName} />
                  <Field label="Mobile Number" value={player.playerPhone} />
                  <Field
                    label="Date of Birth"
                    value={formatDate(player.dateOfBirth)}
                  />
                  <Field
                    label="Calculated Age"
                    value={
                      computedAge !== null
                        ? `${computedAge} years`
                        : "Not Available"
                    }
                  />
                  <Field
                    label="Father's Name"
                    value={player.fatherName || "Not Available"}
                  />
                  <Field
                    label="Mother's Name"
                    value={player.motherName || "Not Available"}
                  />
                  <Field
                    label="Standard"
                    value={
                      player.standard !== undefined
                        ? `Standard ${player.standard}`
                        : "Not Available"
                    }
                    highlight
                  />
                </Section>

                <Section title="Playing Information">
                  <Field
                    label="Player ID"
                    value={`#${player.playerID ?? "—"}`}
                  />
                  <Field label="Player Role" value={player.playerType} />
                  <Field
                    label="Playing Style"
                    value={
                      Array.isArray(player.playingStyle)
                        ? player.playingStyle.join(", ")
                        : player.playingStyle || "—"
                    }
                  />
                  <Field
                    label="Player Category"
                    value={player.playerCategory || "Undefined"}
                  />
                  <Field
                    label="Player Pool"
                    value={`Pool ${player.playerPool ?? "0"}`}
                  />
                </Section>

                <Section title="Merchandise Information">
                  <Field
                    label="T-Shirt Size"
                    value={player.tShirtSize || "Not Available"}
                  />
                  <Field
                    label="T-Shirt Number"
                    value={
                      player.tShirtNumber !== undefined
                        ? `#${player.tShirtNumber}`
                        : "Not Available"
                    }
                    mono
                  />
                  <Field
                    label="T-Shirt Name"
                    value={player.tShirtName || "Not Available"}
                    highlight
                  />
                </Section>

                <Section title="Payment & Practice">
                  <Field
                    label="Payment Method"
                    value={player.paymentMethod || "Cash"}
                  />
                  <Field
                    label="Transaction / Receipt ID"
                    value={player.transactionId}
                    mono
                  />
                  <Field
                    label="Days Available for Practice"
                    value={
                      player.practice !== undefined
                        ? `${player.practice} days`
                        : "23 days"
                    }
                    highlight
                  />
                  <Field
                    label="Registered On"
                    value={
                      player.createdAt
                        ? new Date(player.createdAt).toLocaleString("en-IN")
                        : "—"
                    }
                  />
                </Section>

                {/* Previous Performance Records */}
                {Array.isArray(player.previousPerformance) &&
                  player.previousPerformance.length > 0 && (
                    <Section title="Tournament Performance Records">
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 11,
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                background: "#F1F5F9",
                                textAlign: "left",
                              }}
                            >
                              <th style={{ padding: 6 }}>Year</th>
                              <th style={{ padding: 6 }}>M</th>
                              <th style={{ padding: 6 }}>R</th>
                              <th style={{ padding: 6 }}>W</th>
                              <th style={{ padding: 6 }}>F</th>
                              <th style={{ padding: 6 }}>MOM</th>
                              <th style={{ padding: 6 }}>Avg</th>
                              <th style={{ padding: 6 }}>SR</th>
                              <th style={{ padding: 6 }}>Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {player.previousPerformance.map((s, i) => (
                              <tr
                                key={i}
                                style={{ borderBottom: "1px solid #E2E8F0" }}
                              >
                                <td style={{ padding: 6, fontWeight: 700 }}>
                                  {s.year}
                                </td>
                                <td style={{ padding: 6 }}>{s.matches}</td>
                                <td style={{ padding: 6 }}>{s.runs}</td>
                                <td style={{ padding: 6 }}>{s.wickets}</td>
                                <td style={{ padding: 6 }}>{s.fielding}</td>
                                <td style={{ padding: 6 }}>{s.mom}</td>
                                <td style={{ padding: 6 }}>{s.battingAvg}</td>
                                <td style={{ padding: 6 }}>{s.strikeRate}</td>
                                <td style={{ padding: 6 }}>{s.economy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>
                  )}
              </div>

              {/* Right Column: Media & Actions */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div>
                  <div style={styles.imgLabel}>Player Photo</div>
                  {player.playerPhoto?.url ? (
                    <div
                      style={{ cursor: "zoom-in", position: "relative" }}
                      onClick={() => setLightboxImg(player.playerPhoto.url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={player.playerPhoto.url}
                        alt="Player Portrait"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      />
                      <span style={styles.zoomHint}>🔍 Click to enlarge</span>
                    </div>
                  ) : (
                    <div style={styles.imgPlaceholder}>No photo available</div>
                  )}
                </div>

                <div>
                  <div style={styles.imgLabel}>
                    Payment Receipt / Screenshot
                  </div>
                  {player.paymentScreenshot?.url ? (
                    <div
                      style={{ cursor: "zoom-in", position: "relative" }}
                      onClick={() =>
                        setLightboxImg(player.paymentScreenshot.url)
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={player.paymentScreenshot.url}
                        alt="Payment Proof"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      />
                      <span style={styles.zoomHint}>🔍 Click to enlarge</span>
                    </div>
                  ) : (
                    <div style={styles.imgPlaceholder}>
                      No payment proof available
                    </div>
                  )}
                </div>

                {/* Player Pool management */}
                <div style={styles.actionCard}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 8,
                      color: "#1E3A8A",
                    }}
                  >
                    🏆 Assign Player Pool
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={playerPool}
                      onChange={(e) => setPlayerPool(e.target.value)}
                      style={{ ...styles.select, flex: 1 }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pool) => (
                        <option key={pool} value={pool}>
                          Pool {pool}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={updatePool}
                      style={{
                        padding: "8px 14px",
                        background: "#1E3A8A",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Save Pool
                    </button>
                  </div>
                </div>

                {/* Status management */}
                <div style={styles.actionCard}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 8,
                      color: "#0F172A",
                    }}
                  >
                    ⚡ Update Registration Status
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, marginBottom: 10 }}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        onClick={() => setLocalStatus(st)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          border:
                            localStatus === st
                              ? `2px solid ${STATUS_COLORS[st].text}`
                              : "1px solid #CBD5E1",
                          background:
                            localStatus === st
                              ? STATUS_COLORS[st].bg
                              : "#F8FAFC",
                          color:
                            localStatus === st
                              ? STATUS_COLORS[st].text
                              : "#64748B",
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={saveStatus}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "9px 0",
                      background: "#16A34A",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Updating…" : "Confirm Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Delete Confirmation Modal ──────────────────────────── */
  const ConfirmDeleteModal = () => {
    if (!deletingPlayer) return null;

    return (
      <div
        style={styles.overlay}
        onClick={(e) =>
          !isDeleting && e.target === e.currentTarget && setDeletingPlayer(null)
        }
      >
        <div style={{ ...styles.modal, maxWidth: 440, padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#FEE2E2",
                color: "#DC2626",
                fontSize: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
              Delete Player Registration?
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>
              Are you sure you want to permanently delete player{" "}
              <strong>#{deletingPlayer.playerID ?? "—"} ({deletingPlayer.playerName})</strong>?
            </p>
          </div>

          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: 12,
              marginBottom: 20,
              fontSize: 12,
              color: "#475569",
            }}
          >
            <div>• This action cannot be undone.</div>
            <div>• Player record will be deleted from the database.</div>
            <div>• Associated photo and payment screenshot will be deleted from Cloudinary.</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeletingPlayer(null)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#475569",
                fontWeight: 600,
                cursor: isDeleting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeletePlayer}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                background: isDeleting ? "#FCA5A5" : "#DC2626",
                color: "#fff",
                fontWeight: 700,
                cursor: isDeleting ? "not-allowed" : "pointer",
              }}
            >
              {isDeleting ? "Deleting…" : "Yes, Delete Player"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Lightbox Modal ─────────────────────────────────────── */
  const Lightbox = () => {
    if (!lightboxImg) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
        onClick={() => setLightboxImg(null)}
      >
        <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt="Enlarged preview"
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: "absolute",
              top: -14,
              right: -14,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#fff",
              border: "none",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  /* ─── Render: Auth Check Loading ──────────────────────────── */
  if (authChecking) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 12, color: "#64748B", fontSize: 14 }}>
          Verifying administrator credentials…
        </p>
      </div>
    );
  }

  /* ─── Render: Admin Login Card ────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.loginCard}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 44 }}>🏏</span>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0F172A",
                marginTop: 8,
              }}
            >
              MPL Kids 2026 Admin
            </h1>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              Enter administrator password to access registration dashboard
            </p>
          </div>

          {loginError && (
            <div style={styles.loginErrorBanner}>
              <span>⚠️</span> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={styles.inputLabel}>Admin Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                required
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: loginLoading
                  ? "#94A3B8"
                  : "linear-gradient(135deg, #1E3A8A, #2563EB)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: loginLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
              }}
            >
              {loginLoading ? "Authenticating…" : "Unlock Admin Panel"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#94A3B8",
              marginTop: 16,
            }}
          >
            Authorized tournament administrators only.
          </p>
        </div>
      </div>
    );
  }

  /* ─── Render: Full Admin Dashboard ────────────────────────── */
  return (
    <div style={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "error" ? "#DC2626" : "#16A34A",
          }}
        >
          {toast.type === "error" ? "❌ " : "✅ "}
          {toast.msg}
        </div>
      )}

      {/* Lightbox for zooming photos */}
      <Lightbox />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal />

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Player Edit Modal */}
      {editingPlayer && (
        <PlayerEditModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSaveSuccess={(updated) => {
            setPlayers((prev) =>
              prev.map((p) => (p._id === updated._id ? updated : p)),
            );
            if (selectedPlayer?._id === updated._id) {
              setSelected(updated);
            }
            refreshStats();
          }}
        />
      )}

      {/* Top Bar Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>🏏 MPL Kids 2026 Admin Dashboard</h1>
          <p style={styles.pageSubtitle}>
            Complete Player Management, Verification, Status & Merchandise
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={exportExcel}
            disabled={exporting === "excel"}
            style={{
              ...styles.headerBtn,
              background: "#059669",
              color: "#fff",
            }}
          >
            {exporting === "excel" ? "Exporting…" : "📥 Export Excel"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              ...styles.headerBtn,
              background: "#F1F5F9",
              color: "#475569",
              border: "1px solid #CBD5E1",
            }}
          >
            🔒 Logout
          </button>
        </div>
      </div>

      {/* Statistics Dashboard Cards */}
      <div style={styles.statsGrid}>
        <StatCard label="Total Registered" value={stats.total} icon="📋" color="#2563EB" />
        <StatCard label="Pending Review" value={stats.pending} icon="⏳" color="#D97706" />
        <StatCard label="Approved Players" value={stats.approved} icon="✅" color="#16A34A" />
        <StatCard label="Rejected" value={stats.rejected} icon="❌" color="#DC2626" />
        <StatCard label="Batsmen" value={stats.batsmen} icon="🏏" color="#3B82F6" />
        <StatCard label="Bowlers" value={stats.bowlers} icon="⚡" color="#EF4444" />
        <StatCard label="All Rounders" value={stats.allRounders} icon="⭐" color="#10B981" />
        <StatCard label="Paid Online / Cash" value={`${stats.online} / ${stats.cash}`} icon="💳" color="#6366F1" />
      </div>

      {/* Filters Toolbar */}
      <div style={styles.filtersBar}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, phone, txn ID, player #, jersey…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...styles.input, maxWidth: 280 }}
        />

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFStatus(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Role Filter */}
        <select
          value={filterType}
          onChange={(e) => {
            setFType(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Roles</option>
          {PLAYER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Standard Filter */}
        <select
          value={filterStandard}
          onChange={(e) => {
            setFStandard(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Standards</option>
          {STANDARDS.map((s) => (
            <option key={s} value={s}>
              Standard {s}
            </option>
          ))}
        </select>

        {/* Pool Filter */}
        <select
          value={filterPool}
          onChange={(e) => {
            setFPool(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Pools</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pool) => (
            <option key={pool} value={pool}>
              Pool {pool}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={filterPayment}
          onChange={(e) => {
            setFPayment(e.target.value);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Payments</option>
          <option value="Cash">Cash</option>
          <option value="Online">Online</option>
        </select>

        {/* Clear Filters */}
        {(filterStatus ||
          filterType ||
          filterPool ||
          filterStandard ||
          filterPayment ||
          search) && (
          <button
            onClick={() => {
              setFStatus("");
              setFType("");
              setFPool("");
              setFStandard("");
              setFPayment("");
              setSearch("");
              setPage(1);
            }}
            style={styles.clearBtn}
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Players Table */}
      <div style={styles.tableWrap}>
        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <span style={{ color: "#64748B", marginLeft: 12 }}>
              Loading player records…
            </span>
          </div>
        ) : players.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 40 }}>🏏</div>
            <div style={{ color: "#64748B", marginTop: 8, fontWeight: 600 }}>
              No registered players match the criteria
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "ID",
                  "Player",
                  "Mobile",
                  "DOB / Age",
                  "Parents",
                  "Standard",
                  "Role",
                  "Style",
                  "Practice",
                  "Payment",
                  "Status",
                  "Registered",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const age = calculateAge(p.dateOfBirth, p.Age);
                return (
                  <tr
                    key={p._id}
                    style={styles.tr}
                    onClick={() => setSelected(p)}
                  >
                    {/* ID */}
                    <td style={styles.td}>
                      <span style={styles.idNum}>#{p.playerID ?? "—"}</span>
                    </td>

                    {/* Name & Avatar */}
                    <td style={{ ...styles.td, minWidth: 170 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar
                          src={p.playerPhoto?.url}
                          name={p.playerName}
                          size={36}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: "#0F172A" }}>
                            {p.playerName}
                          </div>
                          {p.tShirtNumber !== undefined && (
                            <div style={{ fontSize: 11, color: "#64748B" }}>
                              Jersey #{p.tShirtNumber}
                              {p.tShirtName ? ` (${p.tShirtName})` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td style={styles.td}>{p.playerPhone}</td>

                    {/* DOB / Age */}
                    <td style={styles.td}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0F172A",
                        }}
                      >
                        {formatDate(p.dateOfBirth)}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        {age !== null ? `${age} yrs` : "Age N/A"}
                      </div>
                    </td>

                    {/* Parents */}
                    <td style={{ ...styles.td, fontSize: 12, maxWidth: 140 }}>
                      <div>👨 {p.fatherName || "—"}</div>
                      <div style={{ color: "#64748B", fontSize: 11 }}>
                        👩 {p.motherName || "—"}
                      </div>
                    </td>

                    {/* Standard */}
                    <td style={styles.td}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#1E3A8A",
                          background: "#EFF6FF",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        Std {p.standard ?? "—"}
                      </span>
                    </td>

                    {/* Role */}
                    <td style={styles.td}>
                      <span style={styles.chip}>{p.playerType}</span>
                    </td>

                    {/* Playing Style */}
                    <td style={{ ...styles.td, fontSize: 11, maxWidth: 130 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={(p.playingStyle || []).join(", ")}
                      >
                        {(p.playingStyle || []).join(", ") || "—"}
                      </div>
                    </td>

                    {/* Practice */}
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>
                        {p.practice !== undefined ? `${p.practice}d` : "23d"}
                      </span>
                    </td>

                    {/* Payment */}
                    <td style={{ ...styles.td, fontSize: 11 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: p.paymentMethod === "Cash" ? "#D97706" : "#2563EB",
                        }}
                      >
                        {p.paymentMethod || "Online"}
                      </span>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748B",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.transactionId}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      <Badge status={p.status} />
                    </td>

                    {/* Registered Date */}
                    <td
                      style={{
                        ...styles.td,
                        fontSize: 11,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() => setEditingPlayer(p)}
                          title="Edit Player"
                          style={{
                            ...styles.quickBtn,
                            background: "#EFF6FF",
                            color: "#1E40AF",
                            border: "1px solid #BFDBFE",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeletingPlayer(p)}
                          title="Delete Player"
                          style={{
                            ...styles.quickBtn,
                            background: "#FEF2F2",
                            color: "#DC2626",
                            border: "1px solid #FECACA",
                          }}
                        >
                          🗑️
                        </button>
                        {STATUS_OPTIONS.filter((s) => s !== p.status).map(
                          (s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(p._id, s)}
                              title={`Set ${s}`}
                              style={{
                                ...styles.quickBtn,
                                background: STATUS_COLORS[s].bg,
                                color: STATUS_COLORS[s].text,
                                border: `1px solid ${STATUS_COLORS[s].border}`,
                              }}
                            >
                              {s === "approved"
                                ? "✓"
                                : s === "rejected"
                                  ? "✕"
                                  : "⏳"}
                            </button>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div style={styles.paginationWrap}>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            Showing page {pagination.page} of {pagination.totalPages} (Total:{" "}
            {pagination.total} registrations)
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              disabled={!pagination.hasPrev}
              onClick={() => {
                setPage((prev) => Math.max(prev - 1, 1));
              }}
              style={{
                ...styles.pageBtn,
                opacity: pagination.hasPrev ? 1 : 0.4,
                cursor: pagination.hasPrev ? "pointer" : "not-allowed",
              }}
            >
              ← Prev
            </button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => {
                setPage((prev) => prev + 1);
              }}
              style={{
                ...styles.pageBtn,
                opacity: pagination.hasNext ? 1 : 0.4,
                cursor: pagination.hasNext ? "pointer" : "not-allowed",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components & Helpers ──────────────────────────────── */
function StatCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${color}15`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#1E3A8A",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 12px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, mono, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: highlight ? "#16A34A" : "#0F172A",
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value || "Not Available"}
      </div>
    </div>
  );
}

/* ─── Stylesheet ────────────────────────────────────────────── */
const styles = {
  centerContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#F8FAFC",
    padding: 20,
  },
  loginCard: {
    width: "100%",
    maxWidth: 400,
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "32px 28px",
    boxShadow:
      "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
    border: "1px solid #E2E8F0",
  },
  loginErrorBanner: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#DC2626",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 12,
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    padding: "24px 32px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0F172A",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    margin: 0,
  },
  headerBtn: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  filtersBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    background: "#FFFFFF",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    marginBottom: 16,
  },
  input: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    fontSize: 13,
    outline: "none",
    background: "#FFFFFF",
    color: "#0F172A",
  },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    fontSize: 13,
    outline: "none",
    background: "#FFFFFF",
    color: "#0F172A",
    cursor: "pointer",
  },
  clearBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    background: "#F1F5F9",
    color: "#64748B",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  tableWrap: {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    overflowX: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
  },
  th: {
    padding: "12px 14px",
    background: "#F8FAFC",
    color: "#475569",
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #E2E8F0",
  },
  tr: {
    borderBottom: "1px solid #F1F5F9",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  td: {
    padding: "12px 14px",
    color: "#334155",
    verticalAlign: "middle",
  },
  idNum: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "#2563EB",
  },
  chip: {
    padding: "3px 8px",
    borderRadius: 6,
    background: "#F1F5F9",
    color: "#334155",
    fontSize: 11,
    fontWeight: 600,
  },
  quickBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    cursor: "pointer",
  },
  paginationWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  pageBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#1E293B",
    fontSize: 12,
    fontWeight: 600,
  },
  loadingWrap: {
    padding: 60,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    padding: 60,
    textAlign: "center",
  },
  spinner: {
    width: 28,
    height: 28,
    border: "3px solid #E2E8F0",
    borderTopColor: "#2563EB",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  toast: {
    position: "fixed",
    top: 20,
    right: 20,
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    zIndex: 10000,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 780,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    padding: "18px 24px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    background: "#F1F5F9",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748B",
  },
  modalBody: {
    padding: 24,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 24,
  },
  imgLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  zoomHint: {
    position: "absolute",
    bottom: 8,
    right: 8,
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 4,
  },
  imgPlaceholder: {
    height: 120,
    background: "#F1F5F9",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94A3B8",
    fontSize: 12,
  },
  actionCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    padding: 14,
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1E3A8A",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 10,
    borderBottom: "1px solid #E2E8F0",
    paddingBottom: 4,
  },
  inputLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  errorText: {
    display: "block",
    fontSize: 10,
    color: "#DC2626",
    marginTop: 3,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  },
};
