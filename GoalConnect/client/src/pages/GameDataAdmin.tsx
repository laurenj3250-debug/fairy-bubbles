import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type Sprite = {
  id: number;
  filename: string;
  category: 'creature' | 'biome' | 'item' | 'ui' | 'uncategorized';
  name: string | null;
  data: string;
  mimeType: string;
};

type BiomeFormData = {
  name: string;
  description: string;
  unlockPlayerLevel: number;
  lootWeight: number;
  encounterWeight: number;
  minPartySize: number;
  backgroundSprite: string;
};

type CreatureFormData = {
  name: string;
  description: string;
  baseHp: number;
  baseStr: number;
  baseDex: number;
  baseWis: number;
  tag: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  captureDc: number;
  skill1Name: string;
  skill1Effect: string;
  skill2Name: string;
  skill2Effect: string;
  biomeId: number | null;
  spriteUrl: string;
};

type ItemFormData = {
  name: string;
  description: string;
  type: 'net' | 'charm' | 'snack' | 'gear' | 'cloak' | 'brace';
  rarity: 'common' | 'uncommon' | 'rare';
  effectType: string;
  effectValue: number;
  effectStat: string;
  consumable: boolean;
  equippable: boolean;
  spriteUrl: string;
};

type Biome = {
  id: number;
  name: string;
  description: string;
};

export default function GameDataAdmin() {
  const [activeTab, setActiveTab] = useState<'biomes' | 'creatures' | 'items'>('biomes');
  const [selectedSprite, setSelectedSprite] = useState<Sprite | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sprites
  const { data: sprites = [], isLoading: spritesLoading } = useQuery<Sprite[]>({
    queryKey: ['/api/sprites'],
  });

  // Fetch existing biomes for creature assignment
  const { data: biomes = [], isLoading: biomesLoading } = useQuery<Biome[]>({
    queryKey: ['/api/game/biomes'],
  });

  // Filter sprites by category
  const biomeSprites = sprites.filter(s => s.category === 'biome');
  const creatureSprites = sprites.filter(s => s.category === 'creature');
  const itemSprites = sprites.filter(s => s.category === 'item');

  // Biome form
  const [biomeForm, setBiomeForm] = useState<BiomeFormData>({
    name: '',
    description: '',
    unlockPlayerLevel: 1,
    lootWeight: 70,
    encounterWeight: 30,
    minPartySize: 0,
    backgroundSprite: '',
  });

  // Creature form
  const [creatureForm, setCreatureForm] = useState<CreatureFormData>({
    name: '',
    description: '',
    baseHp: 8,
    baseStr: 1,
    baseDex: 1,
    baseWis: 1,
    tag: '',
    rarity: 'common',
    captureDc: 10,
    skill1Name: '',
    skill1Effect: '',
    skill2Name: '',
    skill2Effect: '',
    biomeId: null,
    spriteUrl: '',
  });

  // Item form
  const [itemForm, setItemForm] = useState<ItemFormData>({
    name: '',
    description: '',
    type: 'snack',
    rarity: 'common',
    effectType: '',
    effectValue: 0,
    effectStat: '',
    consumable: true,
    equippable: false,
    spriteUrl: '',
  });

  // Create biome mutation
  const createBiomeMutation = useMutation({
    mutationFn: async (data: BiomeFormData) => {
      const res = await fetch('/api/game/biomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create biome');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: '✅ Biome created!' });
      queryClient.invalidateQueries({ queryKey: ['/api/game/biomes'] });
      setBiomeForm({
        name: '',
        description: '',
        unlockPlayerLevel: 1,
        lootWeight: 70,
        encounterWeight: 30,
        minPartySize: 0,
        backgroundSprite: '',
      });
      setSelectedSprite(null);
    },
  });

  // Create creature mutation
  const createCreatureMutation = useMutation({
    mutationFn: async (data: CreatureFormData) => {
      const res = await fetch('/api/game/creatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create creature');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: '✅ Creature created!' });
      queryClient.invalidateQueries({ queryKey: ['/api/game/creatures'] });
      setCreatureForm({
        name: '',
        description: '',
        baseHp: 8,
        baseStr: 1,
        baseDex: 1,
        baseWis: 1,
        tag: '',
        rarity: 'common',
        captureDc: 10,
        skill1Name: '',
        skill1Effect: '',
        skill2Name: '',
        skill2Effect: '',
        biomeId: null,
        spriteUrl: '',
      });
      setSelectedSprite(null);
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const res = await fetch('/api/game/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create item');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: '✅ Item created!' });
      queryClient.invalidateQueries({ queryKey: ['/api/game/items'] });
      setItemForm({
        name: '',
        description: '',
        type: 'snack',
        rarity: 'common',
        effectType: '',
        effectValue: 0,
        effectStat: '',
        consumable: true,
        equippable: false,
        spriteUrl: '',
      });
      setSelectedSprite(null);
    },
  });

  const handleSpriteSelect = (sprite: Sprite) => {
    setSelectedSprite(sprite);
    if (activeTab === 'biomes') {
      setBiomeForm(prev => ({ ...prev, backgroundSprite: `/api/sprites/${sprite.filename}` }));
    } else if (activeTab === 'creatures') {
      setCreatureForm(prev => ({ ...prev, spriteUrl: `/api/sprites/${sprite.filename}` }));
    } else if (activeTab === 'items') {
      setItemForm(prev => ({ ...prev, spriteUrl: `/api/sprites/${sprite.filename}` }));
    }
  };

  const handleBiomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBiomeMutation.mutate(biomeForm);
  };

  const handleCreatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCreatureMutation.mutate(creatureForm);
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItemMutation.mutate(itemForm);
  };

  if (spritesLoading || biomesLoading) {
    return (
      <div className="min-h-screen p-8 pb-24 max-w-7xl mx-auto relative z-10 bg-gray-900/50 flex items-center justify-center">
        <div className="glass-card p-8 rounded-lg">
          <div className="text-white text-xl font-semibold">Loading game data...</div>
          <div className="text-white/60 text-sm mt-2">Fetching sprites and biomes</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-24 max-w-7xl mx-auto relative z-10">
      <h1 className="text-3xl font-bold text-white mb-2">🎮 Game Data Admin</h1>
      <p className="text-white/60 mb-6">Create biomes, creatures, and items using your organized sprites.</p>

      {sprites.length === 0 && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-yellow-200 mb-2">No sprites uploaded yet!</h2>
          <p className="text-yellow-100 mb-4">
            You need to upload and organize sprites before you can create game data.
          </p>
          <button
            onClick={() => window.location.href = '/sprites/upload'}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Upload Sprites →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('biomes')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'biomes'
              ? 'bg-teal-500 text-white'
              : 'bg-white/10 text-teal-200 hover:bg-white/20'
          }`}
        >
          🌲 Biomes
        </button>
        <button
          onClick={() => setActiveTab('creatures')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'creatures'
              ? 'bg-teal-500 text-white'
              : 'bg-white/10 text-teal-200 hover:bg-white/20'
          }`}
        >
          🐉 Creatures
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'items'
              ? 'bg-teal-500 text-white'
              : 'bg-white/10 text-teal-200 hover:bg-white/20'
          }`}
        >
          💎 Items
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sprite Selector */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 relative z-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            {activeTab === 'biomes' && '🌲 Select Biome Background'}
            {activeTab === 'creatures' && '🐉 Select Creature Sprite'}
            {activeTab === 'items' && '💎 Select Item Sprite'}
          </h2>

          <div className="grid grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
            {activeTab === 'biomes' && biomeSprites.map(sprite => (
              <div
                key={sprite.id}
                onClick={() => handleSpriteSelect(sprite)}
                className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${
                  selectedSprite?.id === sprite.id
                    ? 'border-teal-400 bg-teal-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <img
                  src={sprite.data}
                  alt={sprite.filename}
                  className="w-full h-24 object-cover rounded"
                />
                <p className="text-xs text-teal-200 mt-1 truncate">{sprite.filename}</p>
              </div>
            ))}
            {activeTab === 'creatures' && creatureSprites.map(sprite => (
              <div
                key={sprite.id}
                onClick={() => handleSpriteSelect(sprite)}
                className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${
                  selectedSprite?.id === sprite.id
                    ? 'border-teal-400 bg-teal-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <img
                  src={sprite.data}
                  alt={sprite.filename}
                  className="w-full h-24 object-contain rounded"
                />
                <p className="text-xs text-teal-200 mt-1 truncate">{sprite.filename}</p>
              </div>
            ))}
            {activeTab === 'items' && itemSprites.map(sprite => (
              <div
                key={sprite.id}
                onClick={() => handleSpriteSelect(sprite)}
                className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${
                  selectedSprite?.id === sprite.id
                    ? 'border-teal-400 bg-teal-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <img
                  src={sprite.data}
                  alt={sprite.filename}
                  className="w-full h-24 object-contain rounded"
                />
                <p className="text-xs text-teal-200 mt-1 truncate">{sprite.filename}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 relative z-10">
          {activeTab === 'biomes' && (
            <form onSubmit={handleBiomeSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Create Biome</h2>

              <div>
                <label className="text-sm text-teal-200">Name</label>
                <input
                  type="text"
                  value={biomeForm.name}
                  onChange={(e) => setBiomeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-teal-200">Description</label>
                <textarea
                  value={biomeForm.description}
                  onChange={(e) => setBiomeForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-teal-200">Unlock Level</label>
                  <input
                    type="number"
                    value={biomeForm.unlockPlayerLevel}
                    onChange={(e) => setBiomeForm(prev => ({ ...prev, unlockPlayerLevel: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={1}
                  />
                </div>

                <div>
                  <label className="text-sm text-teal-200">Min Party Size</label>
                  <input
                    type="number"
                    value={biomeForm.minPartySize}
                    onChange={(e) => setBiomeForm(prev => ({ ...prev, minPartySize: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={0}
                  />
                </div>

                <div>
                  <label className="text-sm text-teal-200">Loot Weight (%)</label>
                  <input
                    type="number"
                    value={biomeForm.lootWeight}
                    onChange={(e) => setBiomeForm(prev => ({ ...prev, lootWeight: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <label className="text-sm text-teal-200">Encounter Weight (%)</label>
                  <input
                    type="number"
                    value={biomeForm.encounterWeight}
                    onChange={(e) => setBiomeForm(prev => ({ ...prev, encounterWeight: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              {selectedSprite && (
                <div className="p-3 bg-teal-500/20 border border-teal-400/50 rounded">
                  <p className="text-sm text-teal-200">Selected: {selectedSprite.filename}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!biomeForm.backgroundSprite || createBiomeMutation.isPending}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {createBiomeMutation.isPending ? 'Creating...' : 'Create Biome'}
              </button>
            </form>
          )}

          {activeTab === 'creatures' && (
            <form onSubmit={handleCreatureSubmit} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              <h2 className="text-xl font-semibold text-white mb-4">Create Creature</h2>

              <div>
                <label className="text-sm text-teal-200">Name</label>
                <input
                  type="text"
                  value={creatureForm.name}
                  onChange={(e) => setCreatureForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-teal-200">Description</label>
                <textarea
                  value={creatureForm.description}
                  onChange={(e) => setCreatureForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-teal-200">Biome</label>
                  <select
                    value={creatureForm.biomeId || ''}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, biomeId: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  >
                    <option value="">Select biome...</option>
                    {biomes.map(biome => (
                      <option key={biome.id} value={biome.id}>{biome.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-teal-200">Rarity</label>
                  <select
                    value={creatureForm.rarity}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, rarity: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-teal-200">HP</label>
                  <input
                    type="number"
                    value={creatureForm.baseHp}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, baseHp: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm text-teal-200">STR</label>
                  <input
                    type="number"
                    value={creatureForm.baseStr}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, baseStr: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm text-teal-200">DEX</label>
                  <input
                    type="number"
                    value={creatureForm.baseDex}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, baseDex: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm text-teal-200">WIS</label>
                  <input
                    type="number"
                    value={creatureForm.baseWis}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, baseWis: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-teal-200">Tag</label>
                  <input
                    type="text"
                    value={creatureForm.tag}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    placeholder="e.g., forest, water, fire"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-teal-200">Capture DC</label>
                  <input
                    type="number"
                    value={creatureForm.captureDc}
                    onChange={(e) => setCreatureForm(prev => ({ ...prev, captureDc: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-teal-200">Skill 1 Name</label>
                <input
                  type="text"
                  value={creatureForm.skill1Name}
                  onChange={(e) => setCreatureForm(prev => ({ ...prev, skill1Name: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                />
              </div>

              <div>
                <label className="text-sm text-teal-200">Skill 1 Effect</label>
                <input
                  type="text"
                  value={creatureForm.skill1Effect}
                  onChange={(e) => setCreatureForm(prev => ({ ...prev, skill1Effect: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                />
              </div>

              <div>
                <label className="text-sm text-teal-200">Skill 2 Name</label>
                <input
                  type="text"
                  value={creatureForm.skill2Name}
                  onChange={(e) => setCreatureForm(prev => ({ ...prev, skill2Name: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                />
              </div>

              <div>
                <label className="text-sm text-teal-200">Skill 2 Effect</label>
                <input
                  type="text"
                  value={creatureForm.skill2Effect}
                  onChange={(e) => setCreatureForm(prev => ({ ...prev, skill2Effect: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                />
              </div>

              {selectedSprite && (
                <div className="p-3 bg-teal-500/20 border border-teal-400/50 rounded">
                  <p className="text-sm text-teal-200">Selected: {selectedSprite.filename}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!creatureForm.spriteUrl || createCreatureMutation.isPending}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {createCreatureMutation.isPending ? 'Creating...' : 'Create Creature'}
              </button>
            </form>
          )}

          {activeTab === 'items' && (
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Create Item</h2>

              <div>
                <label className="text-sm text-teal-200">Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-teal-200">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-teal-200">Type</label>
                  <select
                    value={itemForm.type}
                    onChange={(e) => setItemForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  >
                    <option value="net">Net (Capture)</option>
                    <option value="charm">Charm (Capture)</option>
                    <option value="snack">Snack (Healing)</option>
                    <option value="gear">Gear (Equipment)</option>
                    <option value="cloak">Cloak (Equipment)</option>
                    <option value="brace">Brace (Equipment)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-teal-200">Rarity</label>
                  <select
                    value={itemForm.rarity}
                    onChange={(e) => setItemForm(prev => ({ ...prev, rarity: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-teal-200">Effect Type</label>
                  <input
                    type="text"
                    value={itemForm.effectType}
                    onChange={(e) => setItemForm(prev => ({ ...prev, effectType: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    placeholder="e.g., heal, buff"
                  />
                </div>
                <div>
                  <label className="text-sm text-teal-200">Effect Value</label>
                  <input
                    type="number"
                    value={itemForm.effectValue}
                    onChange={(e) => setItemForm(prev => ({ ...prev, effectValue: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-teal-200">Effect Stat</label>
                  <input
                    type="text"
                    value={itemForm.effectStat}
                    onChange={(e) => setItemForm(prev => ({ ...prev, effectStat: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded text-white"
                    placeholder="hp, str, dex"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-teal-200">
                  <input
                    type="checkbox"
                    checked={itemForm.consumable}
                    onChange={(e) => setItemForm(prev => ({ ...prev, consumable: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Consumable
                </label>
                <label className="flex items-center gap-2 text-teal-200">
                  <input
                    type="checkbox"
                    checked={itemForm.equippable}
                    onChange={(e) => setItemForm(prev => ({ ...prev, equippable: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Equippable
                </label>
              </div>

              {selectedSprite && (
                <div className="p-3 bg-teal-500/20 border border-teal-400/50 rounded">
                  <p className="text-sm text-teal-200">Selected: {selectedSprite.filename}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!itemForm.spriteUrl || createItemMutation.isPending}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {createItemMutation.isPending ? 'Creating...' : 'Create Item'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
