import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { containsProfanity } from "@/lib/nameUtils";

/**
 * Prompt shown when a player sets a new high score.
 *  - onSubmit(name): save the chosen (clean) name
 *  - onSkip(): opt out -> caller generates a goofy name
 */
export default function NamePromptModal({ defaultValue, score, onSubmit, onSkip, editMode }) {
  const [name, setName] = useState(defaultValue || "");
  const [error, setError] = useState("");

  const trimmed = name.trim().slice(0, 16);

  const submit = () => {
    if (!trimmed) {
      onSkip();
      return;
    }
    if (containsProfanity(trimmed)) {
      setError("That name isn’t allowed. Try another or surprise me.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-950/80 px-5 safe-modal-5 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 14, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 8, scale: 0.98 }}
        className="w-full max-w-xs rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10"
      >
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 ring-1 ring-amber-300/30">
            <Pencil className="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-amber-300/80">
              {editMode ? "Leaderboard Name" : "New High Score"}
            </p>
            <h2 className="text-lg font-semibold text-white">
              {editMode ? "Edit your name" : "Name your runner"}
            </h2>
          </div>
        </div>

        {!editMode && (
          <p className="mt-2 text-sm text-white/50">
            You reached{" "}
            <span className="font-semibold text-white">Level {score?.level ?? 0}</span>{" "}
            with a {score?.streak ?? 0}-level streak.
          </p>
        )}

        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          maxLength={16}
          placeholder="Enter a name"
          className="mt-4 border-white/10 bg-white/5 text-white placeholder:text-white/30"
        />
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button
            onClick={submit}
            className="flex-1 rounded-full bg-amber-400 text-amber-950 hover:bg-amber-300"
          >
            Save
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="flex items-center gap-1.5 rounded-full text-white/60 hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-fuchsia-300" />
            Surprise me
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}