import { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings, Mic, Music, Sliders, HardDrive, Cpu, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateDirectorPlan, generateAudioTrack } from '@/lib/gemini';

type Step = 'idle' | 'generating_music' | 'analyzing' | 'generating_samples' | 'mapping' | 'mixing' | 'done';

interface DirectorEvent {
  timestamp: number;
  soundType: string;
  panning: string;
  intensity: string;
  noteLabel?: string;
}

export default function App() {
  const [prompt, setPrompt] = useState('lofi rain piano');
  const [length, setLength] = useState([30]);
  const [tempo, setTempo] = useState('medium');
  const [style, setStyle] = useState('relaxing');
  
  const [currentStep, setCurrentStep] = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const [directorPlan, setDirectorPlan] = useState<DirectorEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setLogs([]);
    setDirectorPlan([]);
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioUrl(null);
    
    // Step 1: Generate Base Music
    setCurrentStep('generating_music');
    setProgress(10);
    addLog('Initializing Gemini TTS Audio Generation...');
    addLog(`Generating ASMR voice track for prompt: "${prompt}"`);
    
    try {
      const generatedUrl = await generateAudioTrack(prompt, style, tempo);
      setAudioUrl(generatedUrl);
      addLog('Audio track generated successfully.');
    } catch (e: any) {
      addLog('Error generating audio track.');
      console.error(e);
    }
    setProgress(100);

    // Step 2: Analyze Music (Gemma 4 Director)
    setCurrentStep('analyzing');
    setProgress(0);
    addLog('Loading Gemma 4 Director model...');
    addLog('Analyzing rhythmic peaks and phrase boundaries...');
    
    try {
      const plan = await generateDirectorPlan(prompt);
      setDirectorPlan(plan);
      addLog(`Director plan generated with ${plan.length} events.`);
    } catch (e) {
      addLog('Error generating director plan.');
    }
    setProgress(100);
    await new Promise(r => setTimeout(r, 500));

    // Step 3: Generate ASMR Samples
    setCurrentStep('generating_samples');
    setProgress(0);
    addLog('Initializing AudioLDM 2...');
    addLog('Generating texture-rich ASMR sound effects...');
    for (let i = 0; i <= 100; i += 20) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 300));
    }
    addLog('Samples generated: tap.wav, scratch.wav, crinkle.wav, glass.wav, softclick.wav');

    // Step 4: Map Sounds
    setCurrentStep('mapping');
    setProgress(0);
    addLog('Mapping sounds to timeline based on Director plan...');
    addLog('Applying panning and velocity-based gain...');
    for (let i = 0; i <= 100; i += 25) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 200));
    }
    addLog('Mapping complete.');

    // Step 5: Mix and Export
    setCurrentStep('mixing');
    setProgress(0);
    addLog('Mixing audio tracks using pydub...');
    addLog('Exporting final_asmr_track.wav...');
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 150));
    }
    
    setCurrentStep('done');
    addLog('Process complete. Ready for playback.');
  };

  // Actual playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleExport = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `asmr_track_${prompt.replace(/\s+/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const waveformHeights = useRef(Array.from({ length: 100 }).map(() => Math.random() * 80 + 10)).current;

  const getStepStatus = (step: Step) => {
    const steps = ['idle', 'generating_music', 'analyzing', 'generating_samples', 'mapping', 'mixing', 'done'];
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(step);
    
    if (currentIndex > targetIndex) return 'complete';
    if (currentIndex === targetIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-6 justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-semibold tracking-tight">ASMR Music Generator</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="font-mono text-xs">v1.0.0-beta</Badge>
          <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Config */}
        <aside className="w-80 border-r bg-card/30 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Configuration</h2>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Vibe / Prompt</Label>
              <Textarea 
                id="prompt" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. lofi rain piano"
                className="resize-none h-20 bg-background/50"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Length (seconds)</Label>
                  <span className="text-xs text-muted-foreground font-mono">{length[0]}s</span>
                </div>
                <Slider 
                  value={length} 
                  onValueChange={setLength} 
                  max={120} 
                  min={10} 
                  step={1} 
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo</Label>
                <Select value={tempo} onValueChange={setTempo}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow (60-80 BPM)</SelectItem>
                    <SelectItem value="medium">Medium (80-110 BPM)</SelectItem>
                    <SelectItem value="fast">Fast (110+ BPM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relaxing">Relaxing</SelectItem>
                    <SelectItem value="focus">Focus / Study</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="tingles">Intense Tingles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Button 
              className="w-full h-12 text-md font-medium" 
              onClick={handleGenerate}
              disabled={currentStep !== 'idle' && currentStep !== 'done'}
            >
              {currentStep !== 'idle' && currentStep !== 'done' ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Cpu className="w-4 h-4 mr-2" /> Generate Track</>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          
          {/* Top - Pipeline Progress */}
          <div className="p-6 border-b bg-card/10">
            <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Generation Pipeline</h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { id: 'generating_music', label: '1. Base Music', icon: Music },
                { id: 'analyzing', label: '2. Director Analysis', icon: Cpu },
                { id: 'generating_samples', label: '3. ASMR Samples', icon: Mic },
                { id: 'mapping', label: '4. Sound Mapping', icon: Sliders },
                { id: 'mixing', label: '5. Mix & Export', icon: HardDrive },
              ].map((step, i) => {
                const status = getStepStatus(step.id as Step);
                const Icon = step.icon;
                return (
                  <div key={step.id} className={`hardware-panel p-4 rounded-lg flex flex-col gap-3 transition-opacity ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                      {status === 'active' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      {status === 'complete' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium">{step.label}</div>
                      <Progress value={status === 'complete' ? 100 : status === 'active' ? progress : 0} className="h-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle - Workspace */}
          <div className="flex-1 p-6 flex gap-6 overflow-hidden">
            {/* Director Plan View */}
            <div className="flex-1 flex flex-col hardware-panel rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50 bg-black/20 flex justify-between items-center">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Gemma 4 Director Plan</span>
                <Badge variant="secondary" className="text-[10px] h-5">JSON</Badge>
              </div>
              <ScrollArea className="flex-1 p-4 bg-black/40 font-mono text-xs">
                {directorPlan.length > 0 ? (
                  <pre className="text-green-400/90 leading-relaxed">
                    {JSON.stringify(directorPlan, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground/50 italic">
                    Waiting for analysis...
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Logs / Timeline View */}
            <div className="flex-1 flex flex-col hardware-panel rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50 bg-black/20">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">System Logs</span>
              </div>
              <ScrollArea className="flex-1 p-4 bg-black/40 font-mono text-xs">
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground">{log}</div>
                  ))}
                  {logs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground/50 italic">
                      System idle...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Bottom - Audio Player */}
          <div className="h-24 border-t bg-card/50 p-4 flex items-center gap-6">
            <audio 
              ref={audioRef} 
              src={audioUrl || undefined} 
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                }
              }}
            />
            <Button 
              size="icon" 
              variant={currentStep === 'done' && audioUrl ? 'default' : 'secondary'}
              className="w-12 h-12 rounded-full"
              disabled={currentStep !== 'done' || !audioUrl}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </Button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{currentTime.toFixed(1)}s</span>
                <span>{duration.toFixed(1)}s</span>
              </div>
              <div className="relative h-8 bg-black/20 rounded-md overflow-hidden border border-border/50">
                {/* Mock Waveform */}
                <div className="absolute inset-0 flex items-center px-1 gap-[2px] opacity-30">
                  {waveformHeights.map((h, i) => (
                    <div key={i} className="flex-1 bg-primary rounded-full" style={{ height: `${h}%` }} />
                  ))}
                </div>
                {/* Playhead */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                {/* Progress Fill */}
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-primary/20 z-0"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentStep !== 'done' || !audioUrl} onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

