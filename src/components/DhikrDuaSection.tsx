import React from 'react';
import { DhikrLibraryScreen } from './DhikrLibraryScreen';
import { UserStats } from '../types';

interface DhikrDuaSectionProps {
  isDark: boolean;
  userStats: UserStats;
  onUpdateStats: (stats: Partial<UserStats>) => void;
  onOpenNoorAIWithPrompt?: (prompt: string) => void;
  isStandalonePage?: boolean;
}

export const DhikrDuaSection: React.FC<DhikrDuaSectionProps> = ({
  isDark,
  userStats,
  onUpdateStats,
  onOpenNoorAIWithPrompt,
  isStandalonePage = false,
}) => {
  return (
    <DhikrLibraryScreen
      isDark={isDark}
      userStats={userStats}
      onUpdateStats={onUpdateStats}
      onOpenNoorAIWithPrompt={onOpenNoorAIWithPrompt}
      onBackToJourney={isStandalonePage ? undefined : undefined}
    />
  );
};
