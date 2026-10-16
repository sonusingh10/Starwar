import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  Split,
  Compass,
  Radio,
  Volume2,
  VolumeX,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sliders,
  Layers,
  Activity,
  MousePointer,
  Sun,
  Box,
  Play,
  Pause,
  FastForward,
  Heart,
  Dna,
  Orbit,
  Rocket,
  Crosshair,
  Wand2,
  Swords,
  Disc,
  Target,
  Navigation,
  Shield,
  Bot,
  Flame,
} from 'lucide-react';
import {
  BrainwaveFrequency,
  ClickMode,
  ColorThemeId,
  MorphShapeId,
  SimulationConfig,
} from '../types';
import { COLOR_THEMES } from '../geometry/brainGenerator';
import { MORPH_SHAPES_LIST } from '../geometry/morphShapes';

interface ControlOverlayProps {
  config: SimulationConfig;
  onChangeConfig: (newConfig: Partial<SimulationConfig>) => void;
  stats: { count: number; fps: number; activeShockwaves: number };
  onTriggerAction: (
    action:
      | 'shockwave'
      | 'scatter'
      | 'split'
      | 'pulse'
      | 'hyperspace'
      | 'blaster'
      | 'force'
      | 'saberclash'
      | 'superlaser'
  ) => void;
  onNextShape: () => void;
  lastTriggeredMode: ClickMode | null;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  config,
  onChangeConfig,
  stats,
  onTriggerAction,
  onNextShape,
  lastTriggeredMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'shapes' | 'interaction' | 'brainwaves' | 'themes' | 'settings'
  >('shapes');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'starwars' | 'neural' | 'cosmic'>('all');

  const clickModes: { id: ClickMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'shockwave',
      label: 'Shockwave Ripple',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      desc: 'Radiates normal waves displacing wireframe triangles along surface',
    },
    {
      id: 'blaster',
      label: 'Turbolaser Blasters',
      icon: <Crosshair className="w-4 h-4 text-emerald-400" />,
      desc: 'Fires high-velocity emerald/ruby plasma bolts that detonate on impact',
    },
    {
      id: 'force',
      label: 'The Force Push',
      icon: <Wand2 className="w-4 h-4 text-cyan-400" />,
      desc: 'Telekinetically levitates & spins triangles in a mystical Force field',
    },
    {
      id: 'hyperspace',
      label: 'Hyperspace Jump',
      icon: <Rocket className="w-4 h-4 text-sky-400" />,
      desc: 'Stretches stars & mesh into lightspeed warp lines with sonic boom',
    },
    {
      id: 'saberclash',
      label: 'Lightsaber Clash',
      icon: <Swords className="w-4 h-4 text-rose-400" />,
      desc: 'Violent plasma impact clash triggering brilliant sparks & hum',
    },
    {
      id: 'scatter',
      label: 'Scatter & Reform',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      desc: 'Explodes triangles into space with spring-loaded quantum reassembly',
    },
    {
      id: 'split',
      label: 'Split Hemispheres',
      icon: <Split className="w-4 h-4 text-purple-400" />,
      desc: 'Dynamically divides left & right cerebral hemispheres / starship hull',
    },
    {
      id: 'vortex',
      label: 'Vortex Attractor',
      icon: <Compass className="w-4 h-4 text-teal-400" />,
      desc: 'Pulls nearby triangles into a swirling gravitational vortex around cursor',
    },
    {
      id: 'pulse',
      label: 'Frontal Pulse',
      icon: <Activity className="w-4 h-4 text-rose-400" />,
      desc: 'Fires high-velocity synaptic charge from frontal pole to occiput',
    },
  ];

  const brainwaves: { id: BrainwaveFrequency; label: string; hz: string; state: string }[] = [
    { id: 'gamma', label: 'Gamma', hz: '40 Hz', state: 'Peak Focus & Hyper-Awareness' },
    { id: 'beta', label: 'Beta', hz: '20 Hz', state: 'Active Thinking & Cognition' },
    { id: 'alpha', label: 'Alpha', hz: '10 Hz', state: 'Calm Flow & Deep Clarity' },
    { id: 'theta', label: 'Theta', hz: '6 Hz', state: 'REM Dream & Subconscious' },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const filteredShapes = MORPH_SHAPES_LIST.filter(
    (shape) => categoryFilter === 'all' || shape.category === categoryFilter
  );

  const getShapeIcon = (id: MorphShapeId) => {
    switch (id) {
      case 'xwing':
        return <Rocket className="w-3.5 h-3.5 text-cyan-400" />;
      case 'falcon':
        return <Disc className="w-3.5 h-3.5 text-amber-400" />;
      case 'tiefighter':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'deathstar':
        return <Target className="w-3.5 h-3.5 text-rose-400" />;
      case 'stardestroyer':
        return <Navigation className="w-3.5 h-3.5 text-sky-400" />;
      case 'atat':
        return <Bot className="w-3.5 h-3.5 text-amber-300" />;
      case 'vader':
        return <Flame className="w-3.5 h-3.5 text-purple-400" />;
      case 'lightsaber':
        return <Swords className="w-3.5 h-3.5 text-cyan-300" />;
      case 'brain':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'dna':
        return <Dna className="w-3.5 h-3.5 text-cyan-400" />;
      case 'heart':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'galaxy':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'torus':
        return <Orbit className="w-3.5 h-3.5 text-emerald-400" />;
      case 'sphere':
        return <Compass className="w-3.5 h-3.5 text-sky-400" />;
      case 'skull':
        return <Box className="w-3.5 h-3.5 text-amber-300" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const currentShapeObj = MORPH_SHAPES_LIST.find((s) => s.id === config.currentShape);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-6 overflow-hidden">
      {/* Top Header: Clean Spec Badge & Live Telemetry (Top-Left) */}
      <div className="flex items-start justify-between w-full flex-wrap gap-2">
        <div className="pointer-events-auto bg-[#090a12]/92 backdrop-blur-md border border-amber-500/30 rounded-xl p-3 shadow-2xl max-w-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="text-xs font-mono font-semibold tracking-wider text-amber-300 uppercase truncate">
                {currentShapeObj?.name || '3D Neural Mesh'}
              </h1>
            </div>
            {config.starwarsTour && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1.5 py-0.5 rounded font-bold animate-pulse">
                WARP CRUISE
              </span>
            )}
            {!config.starwarsTour && config.autoMorph && (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                AUTO-EVOLVING
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-300 font-light leading-snug">
            {currentShapeObj?.description || 'Holographic wireframe mesh with intense gold base, electric cyan & magenta body.'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <div>
              <span className="text-neutral-500">TRIANGLES: </span>
              <span className="text-amber-400 font-medium">{stats.count.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500">FPS: </span>
              <span className="text-emerald-400 font-medium">{stats.fps}</span>
            </div>
            <div>
              <span className="text-neutral-500">BLOOM: </span>
              <span className={config.bloomEnabled ? 'text-amber-400 font-medium' : 'text-neutral-600 font-medium'}>
                {config.bloomEnabled ? `${config.bloomIntensity.toFixed(1)}x` : 'OFF'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">MODE: </span>
              <span className="text-cyan-300 uppercase">{config.clickMode}</span>
            </div>
          </div>
        </div>

        {/* Top-Right Quick Action Chips & Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#090a12]/92 backdrop-blur-md border border-neutral-800/80 rounded-xl p-1.5 shadow-xl flex-wrap">
          {/* Star Wars Hyperspace Jump Button */}
          <button
            onClick={() => onTriggerAction('hyperspace')}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(56,189,248,0.25)] active:scale-95"
            title="Trigger Star Wars Lightspeed Hyperspace Jump"
          >
            <Rocket className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold">HYPERSPACE</span>
          </button>

          {/* Star Wars Turbolaser Blaster Button */}
          <button
            onClick={() => onTriggerAction('blaster')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all active:scale-95"
            title="Fire Star Wars Turbolaser Blasters"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">BLASTERS</span>
          </button>

          {/* The Force Push Button */}
          <button
            onClick={() => onTriggerAction('force')}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all active:scale-95"
            title="Unleash The Force Telekinetic Wave"
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">THE FORCE</span>
          </button>

          {/* Star Wars Fleet Tour Toggle */}
          <button
            onClick={() => onChangeConfig({ starwarsTour: !config.starwarsTour, autoMorph: false })}
            className={`p-1.5 px-2.5 rounded-lg transition-all text-xs flex items-center gap-1.5 ${
              config.starwarsTour
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title="Automatically tour all Star Wars ships with Hyperspace Jumps"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-mono">WARP TOUR</span>
          </button>

          {/* Star Wars Dogfight Combat Mode Toggle */}
          <button
            onClick={() => onChangeConfig({ combatMode: !config.combatMode })}
            className={`p-1.5 px-2.5 rounded-lg transition-all text-xs flex items-center gap-1.5 ${
              config.combatMode
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title="Toggle Star Wars dogfight target ships, destruction & arcade score"
          >
            <Target className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline font-mono font-bold">DOGFIGHT COMBAT</span>
          </button>

          {/* Next Form Button */}
          <button
            onClick={onNextShape}
            className="p-1.5 px-2.5 rounded-lg text-amber-300 hover:bg-amber-500/20 border border-transparent hover:border-amber-500/30 transition-all text-xs flex items-center gap-1.5"
            title="Morph to Next 3D Form"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-mono">NEXT FORM</span>
          </button>

          {/* Bloom Light Emission Toggle */}
          <button
            onClick={() => onChangeConfig({ bloomEnabled: !config.bloomEnabled })}
            className={`p-2 rounded-lg transition-all text-xs flex items-center gap-1.5 ${
              config.bloomEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title="Toggle Post-Processing Bloom Light Emission"
          >
            <Sun className={`w-3.5 h-3.5 ${config.bloomEnabled ? 'text-amber-400' : ''}`} />
          </button>

          {/* Audio Synthesizer */}
          <button
            onClick={() => onChangeConfig({ soundEnabled: !config.soundEnabled })}
            className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1.5 ${
              config.soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title={config.soundEnabled ? 'Mute Audio Synthesizer' : 'Unmute Audio Synthesizer'}
          >
            {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => onChangeConfig({ autoRotate: !config.autoRotate })}
            className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1.5 ${
              config.autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
            title="Toggle Continuous Orbit"
          >
            <RotateCw className={`w-3.5 h-3.5 ${config.autoRotate ? 'text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            title="Fullscreen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Click Instruction Hint (Center-Top, unobtrusive) */}
      <div className="flex justify-center pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a0c16]/85 backdrop-blur-md border border-neutral-700/60 text-xs font-mono text-neutral-300 shadow-lg">
          <MousePointer className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>
            Click to activate <strong className="text-amber-300">{clickModes.find((m) => m.id === config.clickMode)?.label}</strong> • Click any Star Wars or Neural form below
          </span>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <div className="pointer-events-auto self-center w-full max-w-5xl flex flex-col items-center">
        {/* Collapse / Expand Tab Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#0e101c]/95 border-t border-x border-neutral-700/60 text-[11px] font-mono uppercase tracking-wider text-neutral-300 hover:text-amber-400 hover:bg-[#151829] transition-all cursor-pointer shadow-md"
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isCollapsed ? 'Show Controls Dock (H)' : 'Hide Dock'}</span>
        </button>

        {/* Main Dock Container */}
        <div
          className={`w-full bg-[#0c0d18]/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl transition-all duration-300 ease-out overflow-hidden ${
            isCollapsed
              ? 'max-h-0 opacity-0 pointer-events-none p-0 border-transparent'
              : 'max-h-[560px] opacity-100 p-3.5 md:p-4'
          }`}
        >
          {/* Dock Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5 mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#06070c] p-1 rounded-xl border border-neutral-800/70 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('shapes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'shapes'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>3D Forms ({MORPH_SHAPES_LIST.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('interaction')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'interaction'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Click Dynamics</span>
              </button>

              <button
                onClick={() => setActiveTab('brainwaves')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'brainwaves'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Brainwaves</span>
              </button>

              <button
                onClick={() => setActiveTab('themes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'themes'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Color Palettes</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>FX & Sliders</span>
              </button>
            </div>

            {/* Instant Star Wars & Dynamics Action Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-neutral-500 uppercase mr-0.5 hidden sm:inline">
                Instant Fire:
              </span>
              <button
                onClick={() => onTriggerAction('hyperspace')}
                className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-mono font-medium transition-transform active:scale-95 flex items-center gap-1"
                title="Warp Jump to Hyperspace"
              >
                <Rocket className="w-3 h-3 text-sky-400" />
                <span>Warp</span>
              </button>
              <button
                onClick={() => onTriggerAction('blaster')}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-medium transition-transform active:scale-95 flex items-center gap-1"
                title="Fire Turbolaser Blaster Cannons"
              >
                <Crosshair className="w-3 h-3 text-emerald-400" />
                <span>Blaster</span>
              </button>
              <button
                onClick={() => onTriggerAction('force')}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-medium transition-transform active:scale-95 flex items-center gap-1"
                title="Unleash The Force Push"
              >
                <Wand2 className="w-3 h-3 text-cyan-400" />
                <span>Force</span>
              </button>
              <button
                onClick={() => onTriggerAction('saberclash')}
                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-mono font-medium transition-transform active:scale-95 flex items-center gap-1"
                title="Clash Lightsabers"
              >
                <Swords className="w-3 h-3 text-rose-400" />
                <span>Saber</span>
              </button>
              <button
                onClick={() => onTriggerAction('superlaser')}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-medium transition-transform active:scale-95 flex items-center gap-1"
                title="Death Star Superlaser Mega Beam"
              >
                <Target className="w-3 h-3 text-amber-400" />
                <span>Superlaser</span>
              </button>
              <button
                onClick={() => onTriggerAction('scatter')}
                className="px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-medium transition-transform active:scale-95 flex items-center gap-1"
                title="Scatter triangles into space"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Scatter</span>
              </button>
            </div>
          </div>

          {/* Tab Content 0: 3D Morph Forms with Star Wars Categories */}
          {activeTab === 'shapes' && (
            <div className="space-y-2.5">
              {/* Category Filter Pills & Auto-Morph Controls */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#090b16] border border-amber-500/20 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono font-semibold text-neutral-400 mr-1">Filter:</span>
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    All ({MORPH_SHAPES_LIST.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter('starwars')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 ${
                      categoryFilter === 'starwars'
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                        : 'bg-neutral-800/80 text-amber-300/80 hover:text-amber-200'
                    }`}
                  >
                    <Rocket className="w-3 h-3 text-amber-400" />
                    <span>Star Wars Fleet & Icons (8)</span>
                  </button>
                  <button
                    onClick={() => setCategoryFilter('neural')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      categoryFilter === 'neural'
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Neural & Bio (4)
                  </button>
                  <button
                    onClick={() => setCategoryFilter('cosmic')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      categoryFilter === 'cosmic'
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 font-bold'
                        : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Cosmic & Quantum (3)
                  </button>
                </div>

                {/* Auto Evolution Speed */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-400">Cruise Speed:</span>
                  {[5, 8, 12].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => onChangeConfig({ autoMorphInterval: sec })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        config.autoMorphInterval === sec
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                  <button
                    onClick={onNextShape}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono flex items-center gap-1 transition-transform active:scale-95"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400" />
                    <span>Next Form ➔</span>
                  </button>
                </div>
              </div>

              {/* Grid of 3D Morph Forms */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredShapes.map((shape) => {
                  const isActive = config.currentShape === shape.id;
                  const isStarWars = shape.category === 'starwars';
                  return (
                    <button
                      key={shape.id}
                      onClick={() => {
                        onChangeConfig({ currentShape: shape.id });
                        if (isStarWars) {
                          onTriggerAction('hyperspace');
                        }
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                        isActive
                          ? 'bg-neutral-800/90 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-[#101222]/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-[#14172a]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="p-1 rounded-md bg-neutral-900/90">
                            {getShapeIcon(shape.id)}
                          </span>
                          <div className="flex items-center gap-1">
                            {isStarWars && (
                              <span className="text-[8px] font-mono text-amber-400/90 bg-amber-950/60 border border-amber-500/30 px-1 rounded">
                                STAR WARS
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/20 px-1 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-neutral-100 flex items-center gap-1">
                          <span>{shape.name}</span>
                        </div>
                        <div className="text-[10px] text-amber-300/80 font-mono mt-0.5 truncate">
                          {shape.subtitle}
                        </div>
                      </div>
                      <div className="text-[9px] text-neutral-400 leading-tight mt-1 line-clamp-2">
                        {shape.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Aesthetic Commitment Callout */}
              <div className="px-3 py-1.5 rounded-lg bg-[#06070e] border border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400 flex-wrap gap-2">
                <span className="text-amber-300/90 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Color Aesthetic: Intense Golden Base & Rim • Electric Cyan & Magenta Bodies • Diamond-White Flares
                </span>
                <span className="text-neutral-500 hidden md:inline">
                  {stats.count.toLocaleString()} Dynamic Holographic Triangles
                </span>
              </div>
            </div>
          )}

          {/* Tab Content 1: Click Modes */}
          {activeTab === 'interaction' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2">
              {clickModes.map((mode) => {
                const isActive = config.clickMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onChangeConfig({ clickMode: mode.id })}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-neutral-800/80 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-[#101222]/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-[#14172a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-lg bg-neutral-900/80">{mode.icon}</span>
                      {isActive && <span className="text-[10px] font-mono text-amber-400 font-bold">ACTIVE</span>}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-100">{mode.label}</div>
                      <div className="text-[10px] text-neutral-400 leading-tight mt-0.5 line-clamp-2">
                        {mode.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content 2: Brainwave Oscillations */}
          {activeTab === 'brainwaves' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {brainwaves.map((bw) => {
                const isActive = config.brainwave === bw.id;
                return (
                  <button
                    key={bw.id}
                    onClick={() => onChangeConfig({ brainwave: bw.id })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/10 border-cyan-400/80 ring-1 ring-cyan-400/40'
                        : 'bg-[#101222]/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-[#14172a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-neutral-200">{bw.label}</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded">
                        {bw.hz}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{bw.state}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content 3: Color Themes */}
          {activeTab === 'themes' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {Object.values(COLOR_THEMES).map((theme) => {
                const isActive = config.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onChangeConfig({ theme: theme.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-800/80 border-amber-400/80 ring-1 ring-amber-400/30'
                        : 'bg-[#101222]/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-[#14172a]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.baseColor }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.midColor }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.highColor }}
                      />
                    </div>
                    <div className="text-xs font-semibold text-neutral-100">{theme.name}</div>
                    <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">{theme.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content 4: Settings & Fine-Tuning Sliders */}
          {activeTab === 'settings' && (
            <div className="space-y-3.5 text-xs font-mono text-neutral-300">
              {/* Post-Processing Bloom Section */}
              <div className="p-3 rounded-xl bg-[#090b16] border border-amber-500/20">
                <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Post-Processing Bloom Light Emission</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-500 uppercase mr-1">Presets:</span>
                    <button
                      onClick={() =>
                        onChangeConfig({
                          bloomEnabled: true,
                          bloomIntensity: 2.5,
                          bloomRadius: 0.7,
                          bloomThreshold: 0.12,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] border border-amber-500/30"
                    >
                      Supernova
                    </button>
                    <button
                      onClick={() =>
                        onChangeConfig({
                          bloomEnabled: true,
                          bloomIntensity: 1.6,
                          bloomRadius: 0.55,
                          bloomThreshold: 0.18,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] border border-cyan-500/30"
                    >
                      Neon
                    </button>
                    <button
                      onClick={() =>
                        onChangeConfig({
                          bloomEnabled: true,
                          bloomIntensity: 0.8,
                          bloomRadius: 0.4,
                          bloomThreshold: 0.25,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] border border-neutral-700"
                    >
                      Subtle
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-400">Bloom Intensity:</span>
                      <span className="text-amber-400">{config.bloomIntensity.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={config.bloomIntensity}
                      onChange={(e) => onChangeConfig({ bloomIntensity: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-400">Glow Spread Radius:</span>
                      <span className="text-cyan-400">{config.bloomRadius.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.2"
                      step="0.05"
                      value={config.bloomRadius}
                      onChange={(e) => onChangeConfig({ bloomRadius: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-400">Emission Threshold:</span>
                      <span className="text-purple-400">{config.bloomThreshold.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.02"
                      value={config.bloomThreshold}
                      onChange={(e) => onChangeConfig({ bloomThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Star Wars Hologram & Scene Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">Triangle Scale:</span>
                    <span className="text-amber-400">{config.triangleScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.0"
                    step="0.05"
                    value={config.triangleScale}
                    onChange={(e) => onChangeConfig({ triangleScale: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">Rotation Velocity:</span>
                    <span className="text-cyan-400">{config.rotationSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.5"
                    step="0.1"
                    value={config.rotationSpeed}
                    onChange={(e) => onChangeConfig({ rotationSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col justify-center gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showSynapticLines}
                      onChange={(e) => onChangeConfig({ showSynapticLines: e.target.checked })}
                      className="accent-amber-400 rounded cursor-pointer"
                    />
                    <span>Show Synaptic Network Lines</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.hologramScanlines}
                      onChange={(e) => onChangeConfig({ hologramScanlines: e.target.checked })}
                      className="accent-cyan-400 rounded cursor-pointer"
                    />
                    <span>Imperial Hologram Scanlines</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoRotate}
                      onChange={(e) => onChangeConfig({ autoRotate: e.target.checked })}
                      className="accent-cyan-400 rounded cursor-pointer"
                    />
                    <span>Continuous 360° Orbit</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
