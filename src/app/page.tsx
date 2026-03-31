"use client";

import { useStory } from "@/hooks/useStory";
import SetupScreen from "@/components/SetupScreen";
import StoryView from "@/components/StoryView";

export default function Home() {
  const {
    state,
    startStory,
    continueStory,
    getChoices,
    selectChoice,
    concludeStory,
    undoLastAiTurn,
    dismissChoices,
    exportMarkdown,
    resetStory,
    setTemperature,
    clearError,
  } = useStory();

  if (state.phase === "setup") {
    return (
      <SetupScreen
        onStart={startStory}
        isLoading={state.isLoading}
        error={state.error}
        onClearError={clearError}
      />
    );
  }

  return (
    <StoryView
      state={state}
      onContinue={continueStory}
      onGetChoices={getChoices}
      onSelectChoice={selectChoice}
      onDismissChoices={dismissChoices}
      onConclude={concludeStory}
      onUndo={undoLastAiTurn}
      onExport={exportMarkdown}
      onReset={resetStory}
      onTemperatureChange={setTemperature}
      onClearError={clearError}
    />
  );
}
