"use client";

import { useStory } from "@/hooks/useStory";
import SetupScreen from "@/components/SetupScreen";
import StoryView from "@/components/StoryView";

export default function HomePage() {
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
    clearError,
    setCreativityPreference,
    remixLastBeat,
    generateVisualPrompt,
    savedStoryList,
    libraryLoading,
    dbEnabled,
    savedStoryId,
    openSavedStory,
    deleteSavedStory,
  } = useStory();

  if (state.phase === "setup") {
    return (
      <SetupScreen
        onStart={startStory}
        isLoading={state.isLoading}
        error={state.error}
        onClearError={clearError}
        savedStories={savedStoryList}
        libraryLoading={libraryLoading}
        dbEnabled={dbEnabled}
        savedStoryId={savedStoryId}
        onOpenSavedStory={openSavedStory}
        onDeleteSavedStory={deleteSavedStory}
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
      onClearError={clearError}
      onCreativityChange={setCreativityPreference}
      onRemix={remixLastBeat}
      onVisualize={generateVisualPrompt}
      savedStories={savedStoryList}
      libraryLoading={libraryLoading}
      dbEnabled={dbEnabled}
      savedStoryId={savedStoryId}
      onOpenSavedStory={openSavedStory}
      onDeleteSavedStory={deleteSavedStory}
    />
  );
}
