"use client";

import { useState, useTransition } from "react";
import type { Player } from "@/domain/entities";
import { recordResultAction } from "./actions";

interface ScorerRow {
  id: number;
  playerId: string;
  goals: number;
}

interface Props {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: Player[];
  awayPlayers: Player[];
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function storageKey(matchId: string): string {
  return `idempotency:result:${matchId}`;
}

function getOrCreateKey(matchId: string): string {
  const key = storageKey(matchId);
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const fresh = generateUUID();
  sessionStorage.setItem(key, fresh);
  return fresh;
}

function clearKey(matchId: string): void {
  sessionStorage.removeItem(storageKey(matchId));
}

let _rowId = 0;
function nextId(): number {
  return ++_rowId;
}

export function RecordResultForm({
  matchId,
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
}: Props) {
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [homeScorers, setHomeScorers] = useState<ScorerRow[]>([]);
  const [awayScorers, setAwayScorers] = useState<ScorerRow[]>([]);
  const [result, setResult] = useState<{ ok: boolean; message?: string; detail?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Validation ────────────────────────────────────────────────
  const homeSum = homeScorers.reduce((s, r) => s + r.goals, 0);
  const awaySum = awayScorers.reduce((s, r) => s + r.goals, 0);
  const homeMissingPlayer = homeScorers.some((r) => !r.playerId);
  const awayMissingPlayer = awayScorers.some((r) => !r.playerId);
  // If a team has no registered players, scorer entry cannot be required
  const homeValid =
    homePlayers.length === 0 || (!homeMissingPlayer && homeSum === homeGoals);
  const awayValid =
    awayPlayers.length === 0 || (!awayMissingPlayer && awaySum === awayGoals);
  const canSubmit = homeValid && awayValid;

  // Show inline validation only once the user has touched scorers or goals
  const showHomeHint = homePlayers.length > 0 && (homeScorers.length > 0 || homeGoals > 0);
  const showAwayHint = awayPlayers.length > 0 && (awayScorers.length > 0 || awayGoals > 0);

  // ── Scorer helpers ────────────────────────────────────────────
  function addRow(team: "home" | "away") {
    const row: ScorerRow = { id: nextId(), playerId: "", goals: 1 };
    if (team === "home") setHomeScorers((p) => [...p, row]);
    else setAwayScorers((p) => [...p, row]);
  }

  function removeRow(team: "home" | "away", id: number) {
    if (team === "home") setHomeScorers((p) => p.filter((r) => r.id !== id));
    else setAwayScorers((p) => p.filter((r) => r.id !== id));
  }

  function updateRow(team: "home" | "away", id: number, patch: Partial<Omit<ScorerRow, "id">>) {
    const upd = (prev: ScorerRow[]) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
    if (team === "home") setHomeScorers(upd);
    else setAwayScorers(upd);
  }

  // ── Submit ────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeGoals < 0 || awayGoals < 0) {
      setResult({ ok: false, message: "Goals cannot be negative." });
      return;
    }
    if (!canSubmit) return;

    const idempotencyKey = getOrCreateKey(matchId);

    startTransition(async () => {
      const res = await recordResultAction(
        matchId,
        {
          homeGoals,
          awayGoals,
          goalsByPlayer: [
            ...homeScorers
              .filter((r) => r.playerId)
              .map((r) => ({ playerId: r.playerId, goals: r.goals })),
            ...awayScorers
              .filter((r) => r.playerId)
              .map((r) => ({ playerId: r.playerId, goals: r.goals })),
          ],
        },
        idempotencyKey,
      );
      setResult(res);
      if (res.ok) clearKey(matchId);
    });
  }

  // ── Scorer section renderer ───────────────────────────────────
  function renderScorerSection(
    team: "home" | "away",
    players: Player[],
    scorers: ScorerRow[],
    teamName: string,
    sum: number,
    totalGoals: number,
    missingPlayer: boolean,
    isValid: boolean,
    showHint: boolean,
  ) {
    return (
      <div className="scorer-section">
        <p className="section-title">{teamName} Scorers</p>

        {players.length === 0 ? (
          <p className="scorer-no-players">No players registered — scorer data will not be recorded.</p>
        ) : (
          <>
            {scorers.map((row) => (
              <div key={row.id} className="scorer-row">
                <select
                  className="filter-select"
                  value={row.playerId}
                  onChange={(e) => updateRow(team, row.id, { playerId: e.target.value })}
                >
                  <option value="">Select player…</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                      {p.number != null ? ` (#${p.number})` : ""}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  className="filter-input scorer-goals-input"
                  value={row.goals}
                  onChange={(e) =>
                    updateRow(team, row.id, { goals: Math.max(1, Number(e.target.value)) })
                  }
                />
                <span className="scorer-goals-label">goal{row.goals !== 1 ? "s" : ""}</span>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removeRow(team, row.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button type="button" className="btn-secondary" onClick={() => addRow(team)}>
              + Add Scorer
            </button>

            {showHint && (
              <p className={`scorer-hint${isValid ? "" : " scorer-hint--error"}`}>
                {sum} / {totalGoals} goals assigned
                {missingPlayer && " · select a player for each row"}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  const succeeded = result?.ok === true;

  return (
    <form onSubmit={handleSubmit} className="result-form">
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
        {/* ── Goals ── */}
        <div className="goals-row">
          <div className="form-group">
            <label className="form-label" htmlFor="homeGoals">
              {homeTeamName} Goals
            </label>
            <input
              id="homeGoals"
              type="number"
              min={0}
              className="filter-input goals-input"
              value={homeGoals}
              disabled={succeeded}
              onChange={(e) => setHomeGoals(Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="awayGoals">
              {awayTeamName} Goals
            </label>
            <input
              id="awayGoals"
              type="number"
              min={0}
              className="filter-input goals-input"
              value={awayGoals}
              disabled={succeeded}
              onChange={(e) => setAwayGoals(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        {/* ── Scorer sections ── */}
        {renderScorerSection(
          "home",
          homePlayers,
          homeScorers,
          homeTeamName,
          homeSum,
          homeGoals,
          homeMissingPlayer,
          homeValid,
          showHomeHint,
        )}

        {renderScorerSection(
          "away",
          awayPlayers,
          awayScorers,
          awayTeamName,
          awaySum,
          awayGoals,
          awayMissingPlayer,
          awayValid,
          showAwayHint,
        )}

        {/* ── Validation summary ── */}
        {!canSubmit && (showHomeHint || showAwayHint) && (
          <div className="alert-error" style={{ marginBottom: "1rem" }}>
            {!homeValid && homePlayers.length > 0 && (
              <p>
                {homeTeamName}:{" "}
                {homeMissingPlayer
                  ? "select a player for each scorer row."
                  : `${homeSum} goal${homeSum !== 1 ? "s" : ""} assigned but ${homeGoals} expected.`}
              </p>
            )}
            {!awayValid && awayPlayers.length > 0 && (
              <p>
                {awayTeamName}:{" "}
                {awayMissingPlayer
                  ? "select a player for each scorer row."
                  : `${awaySum} goal${awaySum !== 1 ? "s" : ""} assigned but ${awayGoals} expected.`}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isPending || !canSubmit || succeeded}
        >
          {isPending ? "Saving…" : "Record Result"}
        </button>
      </div>

      {/* ── Result feedback ── */}
      {result && (
        <div className={result.ok ? "alert-success" : "alert-error"}>
          {result.ok ? (
            "Result recorded successfully."
          ) : (
            <>
              <strong>Error:</strong> {result.message}
              {result.detail && (
                <p style={{ marginTop: "0.25rem", fontSize: "0.875em" }}>{result.detail}</p>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}
