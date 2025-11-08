import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface Biome {
  id: number;
  name: string;
  description: string;
  unlockPlayerLevel: number;
  lootWeight: number;
  encounterWeight: number;
  minPartySize: number;
  requiredTag: string | null;
}

interface DailyProgress {
  habitPointsEarned: number;
  threshold1Reached: boolean;
  threshold2Reached: boolean;
  threshold3Reached: boolean;
  runsAvailable: number;
  runsUsed: number;
}

interface PlayerStats {
  level: number;
  experience: number;
  maxPartySize: number;
}

interface EventResult {
  eventType: 'loot' | 'encounter';
  loot?: {
    itemId: number;
    itemName: string;
    quantity: number;
    rarity: string;
  };
  encounter?: {
    encounterId: number;
    speciesId: number;
    speciesName: string;
    level: number;
  };
}

export default function OutsideWorld() {
  const [, navigate] = useLocation();
  const [selectedBiome, setSelectedBiome] = useState<number | null>(null);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch biomes
  const { data: biomes = [] } = useQuery<Biome[]>({
    queryKey: ['/api/biomes'],
  });

  // Fetch daily progress
  const { data: dailyProgress } = useQuery<DailyProgress>({
    queryKey: ['/api/daily-progress'],
  });

  // Fetch player stats
  const { data: playerStats } = useQuery<PlayerStats>({
    queryKey: ['/api/player-stats'],
  });

  // Use run mutation
  const useRunMutation = useMutation({
    mutationFn: async (biomeId: number) => {
      const response = await fetch('/api/runs/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biomeId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to use run');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      setEventResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/encounters'] });
    },
    onError: (err: Error) => {
      console.error('[OutsideWorld] Mutation error:', err);
      setError(err.message);
      setEventResult(null);
    },
  });

  const handleExplore = (biomeId: number) => {
    // Navigate to exploration view
    navigate(`/explore/${biomeId}`);
  };

  const runsRemaining = (dailyProgress?.runsAvailable || 0) - (dailyProgress?.runsUsed || 0);

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Outside World</h1>
          <p className="text-teal-200">Explore magical biomes and discover creatures</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-teal-200 text-sm mb-1">Player Level</div>
            <div className="text-3xl font-bold text-white">
              {playerStats?.level || 1}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-teal-200 text-sm mb-1">Habit Points Today</div>
            <div className="text-3xl font-bold text-white">
              {dailyProgress?.habitPointsEarned || 0}
            </div>
            <div className="text-xs text-teal-300 mt-1">
              Next threshold: {dailyProgress?.threshold3Reached ? '12+' : dailyProgress?.threshold2Reached ? '12' : dailyProgress?.threshold1Reached ? '9' : '6'} points
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-teal-200 text-sm mb-1">Runs Available</div>
            <div className="text-3xl font-bold text-white">
              {runsRemaining}
            </div>
            <div className="text-xs text-teal-300 mt-1">
              {dailyProgress?.runsUsed || 0} used / {dailyProgress?.runsAvailable || 0} total
            </div>
          </div>
        </div>

        {/* Threshold Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
          <h3 className="text-white font-semibold mb-4">Daily Threshold Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                dailyProgress?.threshold1Reached ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                {dailyProgress?.threshold1Reached ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">6 Habit Points → 1 Run</div>
                <div className="text-teal-300 text-sm">Complete 6 habit points to unlock your first run</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                dailyProgress?.threshold2Reached ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                {dailyProgress?.threshold2Reached ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">9 Habit Points → 2 Runs</div>
                <div className="text-teal-300 text-sm">Complete 9 habit points for a second run</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                dailyProgress?.threshold3Reached ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                {dailyProgress?.threshold3Reached ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">12 Habit Points → 3 Runs</div>
                <div className="text-teal-300 text-sm">Complete 12 habit points for maximum runs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 mb-8">
            <h3 className="text-red-300 font-semibold mb-2">⚠️ Error</h3>
            <p className="text-white">{error}</p>
          </div>
        )}

        {/* Event Result */}
        {eventResult && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-300/30 mb-8">
            {eventResult.eventType === 'loot' && eventResult.loot && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">🎁 Loot Found!</h3>
                <div className="text-teal-200 text-lg">
                  You found <span className="font-bold text-yellow-300">{eventResult.loot.quantity}x {eventResult.loot.itemName}</span>
                </div>
                <div className="text-sm text-purple-300 mt-2">
                  Rarity: <span className="capitalize">{eventResult.loot.rarity}</span>
                </div>
              </div>
            )}

            {eventResult.eventType === 'encounter' && eventResult.encounter && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">⚔️ Wild Encounter!</h3>
                <div className="text-teal-200 text-lg">
                  A wild <span className="font-bold text-yellow-300">Lv.{eventResult.encounter.level} {eventResult.encounter.speciesName}</span> appeared!
                </div>
                <button
                  onClick={() => {
                    if (eventResult.encounter) {
                      navigate(`/combat/${eventResult.encounter.encounterId}`);
                    }
                  }}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Start Battle →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Biomes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {biomes.map((biome) => {
            const isUnlocked = (playerStats?.level || 1) >= biome.unlockPlayerLevel;
            const canExplore = isUnlocked && runsRemaining > 0;

            return (
              <div
                key={biome.id}
                className={`rounded-lg p-6 border-2 transition-all ${
                  isUnlocked
                    ? 'bg-white/10 backdrop-blur-sm border-teal-400/50 hover:border-teal-400'
                    : 'bg-gray-800/50 border-gray-600 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{biome.name}</h3>
                    <p className="text-teal-200 text-sm">{biome.description}</p>
                  </div>
                  {!isUnlocked && (
                    <div className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">
                      Lv.{biome.unlockPlayerLevel}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-teal-300">🎁 Loot:</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${biome.lootWeight}%` }}
                      />
                    </div>
                    <span className="text-white">{biome.lootWeight}%</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-teal-300">⚔️ Encounter:</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${biome.encounterWeight}%` }}
                      />
                    </div>
                    <span className="text-white">{biome.encounterWeight}%</span>
                  </div>

                  {biome.minPartySize > 0 && (
                    <div className="text-sm text-purple-300">
                      Requires: {biome.minPartySize}+ creatures in party
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleExplore(biome.id)}
                  disabled={!canExplore || useRunMutation.isPending}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    canExplore
                      ? 'bg-teal-500 hover:bg-teal-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {useRunMutation.isPending && selectedBiome === biome.id
                    ? 'Exploring...'
                    : !isUnlocked
                    ? `Unlock at Lv.${biome.unlockPlayerLevel}`
                    : runsRemaining === 0
                    ? 'No Runs Available'
                    : 'Explore Biome'}
                </button>
              </div>
            );
          })}
        </div>

        {/* No Runs Message */}
        {runsRemaining === 0 && (
          <div className="mt-8 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">🌟</div>
            <h3 className="text-white font-semibold mb-2">Complete More Habits!</h3>
            <p className="text-yellow-200">
              You've used all your runs for today. Complete habits to unlock more adventures!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
