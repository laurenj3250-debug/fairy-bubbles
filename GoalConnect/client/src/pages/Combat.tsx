import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';

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
  species: CreatureSpecies;
}

interface CombatState {
  encounterId: number;
  playerParty: UserCreature[];
  wildCreature: {
    speciesId: number;
    species: CreatureSpecies;
    level: number;
    currentHp: number;
    maxHp: number;
    ac: number;
    str: number;
    dex: number;
    wis: number;
  };
  turn: number;
  phase: 'player' | 'enemy';
  status: 'ongoing' | 'victory' | 'defeat' | 'captured' | 'fled';
}

interface CombatResult {
  success: boolean;
  state: CombatState;
  log: string[];
  rewards?: {
    xp: number;
    capturedCreature?: {
      speciesId: number;
      level: number;
    };
  };
}

interface CombatProps {
  encounterId: number;
}

export default function Combat({ encounterId }: CombatProps) {
  const [, navigate] = useLocation();
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<'attack' | 'item' | 'capture' | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<number | null>(null);

  // Initialize combat
  const { data: initialState, isLoading } = useQuery<CombatState>({
    queryKey: [`/api/combat/start/${encounterId}`],
    queryFn: async () => {
      const response = await fetch('/api/combat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to start combat');
      }

      return response.json();
    },
  });

  // Set initial state
  useEffect(() => {
    if (initialState && !combatState) {
      setCombatState(initialState);
    }
  }, [initialState, combatState]);

  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: async (action: any) => {
      const response = await fetch('/api/combat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: combatState,
          action,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to execute action');
      }

      return response.json() as Promise<CombatResult>;
    },
    onSuccess: (result) => {
      setCombatState(result.state);
      setCombatLog(prev => [...prev, ...result.log]);
      setSelectedAction(null);
      setSelectedCreature(null);

      // Handle combat end
      if (result.state.status !== 'ongoing') {
        setTimeout(() => {
          navigate('/outside-world');
        }, 3000);
      }
    },
  });

  const handleAttack = (creatureId: number) => {
    executeActionMutation.mutate({
      type: 'attack',
      creatureId,
    });
  };

  const handleCapture = () => {
    // TODO: Item selection
    // For now, just attempt capture with first capture item
    executeActionMutation.mutate({
      type: 'capture',
      itemId: 1, // Placeholder
    });
  };

  if (isLoading || !combatState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading combat...</div>
      </div>
    );
  }

  const aliveParty = combatState.playerParty.filter(c => c.currentHp > 0);

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Combat Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <span className="font-semibold">Turn {combatState.turn}</span>
              <span className="mx-2">•</span>
              <span className={combatState.phase === 'player' ? 'text-teal-300' : 'text-red-300'}>
                {combatState.phase === 'player' ? 'Your Turn' : 'Enemy Turn'}
              </span>
            </div>
            <div className="text-teal-200">
              Status: <span className="capitalize font-semibold">{combatState.status}</span>
            </div>
          </div>
        </div>

        {/* Battle Result */}
        {combatState.status !== 'ongoing' && (
          <div className={`rounded-lg p-6 mb-6 text-center ${
            combatState.status === 'victory' || combatState.status === 'captured'
              ? 'bg-green-500/20 border border-green-400'
              : 'bg-red-500/20 border border-red-400'
          }`}>
            <h2 className="text-3xl font-bold text-white mb-2">
              {combatState.status === 'victory' && '🎉 Victory!'}
              {combatState.status === 'captured' && '✨ Captured!'}
              {combatState.status === 'defeat' && '💀 Defeat'}
            </h2>
            <p className="text-white/80">Returning to Outside World...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Wild Creature */}
          <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border-2 border-red-400">
            <h3 className="text-white font-semibold mb-3">Wild Creature</h3>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-xl font-bold text-white mb-2">
                Lv.{combatState.wildCreature.level} {combatState.wildCreature.species.name}
              </div>

              {/* HP Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-white/80 mb-1">
                  <span>HP</span>
                  <span>{combatState.wildCreature.currentHp} / {combatState.wildCreature.maxHp}</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{
                      width: `${(combatState.wildCreature.currentHp / combatState.wildCreature.maxHp) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-white/5 rounded p-2 text-center">
                  <div className="text-white/60">STR</div>
                  <div className="text-white font-bold">{combatState.wildCreature.str}</div>
                </div>
                <div className="bg-white/5 rounded p-2 text-center">
                  <div className="text-white/60">DEX</div>
                  <div className="text-white font-bold">{combatState.wildCreature.dex}</div>
                </div>
                <div className="bg-white/5 rounded p-2 text-center">
                  <div className="text-white/60">WIS</div>
                  <div className="text-white font-bold">{combatState.wildCreature.wis}</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-white/60">
                AC: {combatState.wildCreature.ac}
              </div>
            </div>
          </div>

          {/* Player Party */}
          <div className="bg-teal-500/20 backdrop-blur-sm rounded-lg p-6 border-2 border-teal-400">
            <h3 className="text-white font-semibold mb-3">Your Party</h3>
            <div className="space-y-3">
              {combatState.playerParty.map((creature) => (
                <div
                  key={creature.id}
                  className={`bg-white/10 rounded-lg p-3 ${
                    creature.currentHp === 0 ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">
                      Lv.{creature.level} {creature.species.name}
                    </div>
                    {creature.currentHp > 0 && combatState.phase === 'player' && combatState.status === 'ongoing' && (
                      <button
                        onClick={() => handleAttack(creature.id)}
                        disabled={executeActionMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm font-semibold transition-colors"
                      >
                        Attack
                      </button>
                    )}
                  </div>

                  {/* HP Bar */}
                  <div className="mb-2">
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

                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-white/60">STR: {creature.str}</div>
                    <div className="text-white/60">DEX: {creature.dex}</div>
                    <div className="text-white/60">WIS: {creature.wis}</div>
                  </div>
                </div>
              ))}

              {aliveParty.length === 0 && (
                <div className="text-center text-white/60 py-4">
                  All creatures fainted!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Combat Actions */}
        {combatState.phase === 'player' && combatState.status === 'ongoing' && aliveParty.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
            <h3 className="text-white font-semibold mb-4">Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                disabled
                className="bg-gray-600 text-gray-400 px-4 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Attack (use buttons above)
              </button>
              <button
                disabled
                className="bg-gray-600 text-gray-400 px-4 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Item (coming soon)
              </button>
              <button
                onClick={handleCapture}
                disabled={executeActionMutation.isPending}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Capture
              </button>
              <button
                disabled
                className="bg-gray-600 text-gray-400 px-4 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Flee (coming soon)
              </button>
            </div>
          </div>
        )}

        {/* Combat Log */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-h-64 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3">Combat Log</h3>
          <div className="space-y-1 font-mono text-sm">
            {combatLog.length === 0 ? (
              <div className="text-white/60">Waiting for actions...</div>
            ) : (
              combatLog.map((entry, idx) => (
                <div key={idx} className="text-teal-200">
                  &gt; {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
