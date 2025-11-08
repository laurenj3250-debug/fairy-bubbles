import { useQuery, useMutation, useQueryClient } from '@tantml:query/react-query';

interface CreatureSpecies {
  id: number;
  name: string;
  description: string;
  baseStr: number;
  baseDex: number;
  baseWis: number;
}

interface UserCreature {
  id: number;
  speciesId: number;
  level: number;
  currentHp: number;
  hp: number;
  str: number;
  dex: number;
  wis: number;
  isInParty: boolean;
  partyPosition: number | null;
  species: CreatureSpecies;
}

interface PlayerStats {
  level: number;
  maxPartySize: number;
}

export default function PartyManagement() {
  const queryClient = useQueryClient();

  // Fetch all creatures
  const { data: creatures = [] } = useQuery<UserCreature[]>({
    queryKey: ['/api/creatures'],
  });

  // Fetch current party
  const { data: party = [] } = useQuery<UserCreature[]>({
    queryKey: ['/api/party'],
  });

  // Fetch player stats
  const { data: playerStats } = useQuery<PlayerStats>({
    queryKey: ['/api/player-stats'],
  });

  // Add to party mutation
  const addToPartyMutation = useMutation({
    mutationFn: async (creatureId: number) => {
      // Find next available position
      const usedPositions = party.map(c => c.partyPosition).filter(p => p !== null);
      let nextPosition = 1;
      while (usedPositions.includes(nextPosition)) {
        nextPosition++;
      }

      const response = await fetch(`/api/party/${creatureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: nextPosition }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to party');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/party'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creatures'] });
    },
  });

  // Remove from party mutation
  const removeFromPartyMutation = useMutation({
    mutationFn: async (creatureId: number) => {
      const response = await fetch(`/api/party/${creatureId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from party');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/party'] });
      queryClient.invalidateQueries({ queryKey: ['/api/creatures'] });
    },
  });

  const partyCreatures = creatures.filter(c => c.isInParty).sort((a, b) => (a.partyPosition || 0) - (b.partyPosition || 0));
  const benchCreatures = creatures.filter(c => !c.isInParty);
  const maxPartySize = playerStats?.maxPartySize || 1;

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Party Management</h1>
          <p className="text-teal-200">Manage your creature party for battles and exploration</p>
        </div>

        {/* Current Party */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Active Party</h2>
            <div className="text-teal-300">
              {partyCreatures.length} / {maxPartySize} Slots
            </div>
          </div>

          {partyCreatures.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No creatures in party. Add creatures from your collection below!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partyCreatures.map((creature) => (
                <div
                  key={creature.id}
                  className="bg-white/10 rounded-lg p-4 border border-teal-400/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xl font-bold text-white">
                        {creature.species.name}
                      </div>
                      <div className="text-sm text-teal-300">
                        Level {creature.level} • Position {creature.partyPosition}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromPartyMutation.mutate(creature.id)}
                      disabled={removeFromPartyMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>HP</span>
                      <span>{creature.currentHp} / {creature.hp}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${(creature.currentHp / creature.hp) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-xs text-white/60">STR</div>
                      <div className="text-white font-bold">{creature.str}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-xs text-white/60">DEX</div>
                      <div className="text-white font-bold">{creature.dex}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-xs text-white/60">WIS</div>
                      <div className="text-white font-bold">{creature.wis}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {partyCreatures.length < maxPartySize && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/50 rounded-lg text-blue-200 text-sm">
              💡 You have {maxPartySize - partyCreatures.length} empty party slot{maxPartySize - partyCreatures.length !== 1 ? 's' : ''}. Add more creatures below!
            </div>
          )}

          {playerStats && playerStats.level < 7 && (
            <div className="mt-4 p-3 bg-purple-500/20 border border-purple-400/50 rounded-lg text-purple-200 text-sm">
              🌟 Level up to unlock more party slots! (Level 3 → 2 slots, Level 5 → 3 slots, Level 7 → 4 slots)
            </div>
          )}
        </div>

        {/* Creature Collection */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Your Collection</h2>

          {benchCreatures.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              All your creatures are in the party!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benchCreatures.map((creature) => (
                <div
                  key={creature.id}
                  className="bg-white/10 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {creature.species.name}
                      </div>
                      <div className="text-sm text-teal-300">
                        Level {creature.level}
                      </div>
                    </div>
                    <button
                      onClick={() => addToPartyMutation.mutate(creature.id)}
                      disabled={
                        addToPartyMutation.isPending ||
                        partyCreatures.length >= maxPartySize
                      }
                      className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                        partyCreatures.length >= maxPartySize
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-teal-500 hover:bg-teal-600 text-white'
                      }`}
                    >
                      {partyCreatures.length >= maxPartySize ? 'Party Full' : 'Add'}
                    </button>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>HP</span>
                      <span>{creature.currentHp} / {creature.hp}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${(creature.currentHp / creature.hp) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-white/60">STR</div>
                      <div className="text-white font-bold">{creature.str}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-white/60">DEX</div>
                      <div className="text-white font-bold">{creature.dex}</div>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-white/60">WIS</div>
                      <div className="text-white font-bold">{creature.wis}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {creatures.length === 0 && (
          <div className="mt-8 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-white font-semibold mb-2">No Creatures Yet!</h3>
            <p className="text-yellow-200">
              Explore the Outside World to find and battle wild creatures!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
