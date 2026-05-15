"use client";

import { useState, useEffect } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUploadInput } from "@/components/media-upload-input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Video,
  Image as ImageIcon,
  Plus,
  Loader2,
  Play,
  ArrowRight,
  Settings,
  UserCircle,
  History,
  Sparkles,
  Zap,
  Users,
  MessageSquare,
  Mic,
  Key,
  ShieldCheck,
  AlertCircle,
  Trash2,
  ChevronDown,
  Check,
  ExternalLink,
  Volume2,
  Globe,
  Wand2,
  Music,
  AudioLines,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Custom Instagram icon (removed from lucide-react in recent versions)
const Instagram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const VOICES = [
  { id: "victoria", name: "Victoria" },
  { id: "vincent", name: "Vincent" },
  { id: "clara", name: "Clara" },
  { id: "drew", name: "Drew" },
  { id: "skye", name: "Skye" },
  { id: "adrian", name: "Adrian" },
  { id: "nina", name: "Nina" },
  { id: "max", name: "Max" },
  { id: "morgan", name: "Morgan" },
  { id: "felix", name: "Felix" },
  { id: "mia", name: "Mia" },
  { id: "marcus", name: "Marcus" },
];

const TTS_VOICES = [
  "Maya", "Arjun", "Serene", "Bernard", "Billy", "Mark", "Clint", "Mabel", "Chad",
  "Leslie", "Eleanor", "Elias", "Elliot", "Sandra", "Kirk", "Kylie", "Lara", "Lisa",
  "Malachi", "Marlene", "Martin", "Miriam", "Paula", "Pip", "Rusty", "Ragnar",
  "Maggie", "Jack", "Katie", "Noah", "James", "Rina", "Ella", "Mariah", "Frank",
  "Claudia", "Niki", "Vincent", "Kendrick", "Tom", "Wanda", "Benjamin", "Kiana", "Rachel",
];

const LANGUAGES = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" },
  { code: "de", name: "German" }, { code: "pt", name: "Portuguese" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "zh", name: "Chinese" }, { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" }, { code: "ru", name: "Russian" }, { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" }, { code: "tr", name: "Turkish" }, { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" }, { code: "da", name: "Danish" }, { code: "fi", name: "Finnish" },
];

const VIDEO_MODELS = ["gen4.5", "gen4_turbo", "veo3", "veo3.1", "veo3.1_fast"];
const IMAGE_MODELS = ["gen4_image", "gen4_image_turbo", "gemini_image3_pro", "gpt_image_2", "gemini_2.5_flash"];

export function RunwayDashboard() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // API Key states
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Active IG Account (selected from connected ones)
  const [activeIgAccount, setActiveIgAccount] = useState<string | null>(null);
  const [igPopoverOpen, setIgPopoverOpen] = useState(false);

  // Avatar states
  const [avatarName, setAvatarName] = useState("");
  const [avatarImg, setAvatarImg] = useState("");
  const [avatarPersonality, setAvatarPersonality] = useState("");
  const [avatarVoice, setAvatarVoice] = useState("victoria");
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);

  // New generation form states
  const [videoUri, setVideoUri] = useState("");
  const [refImageUri, setRefImageUri] = useState("");
  const [audioUri, setAudioUri] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [sfxDuration, setSfxDuration] = useState(10);
  const [sfxLoop, setSfxLoop] = useState(false);
  const [ttsVoice, setTtsVoice] = useState("Maya");
  const [genLoading, setGenLoading] = useState<string | null>(null);

  const [t2vModel, setT2vModel] = useState("gen4.5");
  const [i2vModel, setI2vModel] = useState("gen4.5");
  const [t2iModel, setT2iModel] = useState("gen4_image");

  const tasks = useQuery(api.runway.listTasks) || [];
  const avatars = useQuery(api.runway.listAvatars) || [];
  const startGeneration = useAction(api.runway.createTask);
  const createAvatar = useAction(api.runway.createAvatar);
  const pollTask = useAction(api.runway.pollTask);

  // New API actions
  const createTextToVideo = useAction(api.runway.createTextToVideo);
  const createImageToVideo = useAction(api.runway.createImageToVideo);
  const createVideoToVideo = useAction(api.runway.createVideoToVideo);
  const createTextToImage = useAction(api.runway.createTextToImage);
  const createCharacterPerformance = useAction(api.runway.createCharacterPerformance);
  const createSoundEffect = useAction(api.runway.createSoundEffect);
  const createTextToSpeech = useAction(api.runway.createTextToSpeech);
  const createSpeechToSpeech = useAction(api.runway.createSpeechToSpeech);
  const createVoiceDubbing = useAction(api.runway.createVoiceDubbing);
  const createVoiceIsolation = useAction(api.runway.createVoiceIsolation);
  const createAvatarVideo = useAction(api.runway.createAvatarVideo);

  // Instagram
  const igAccounts = useQuery(api.instagram.listAccounts) || [];

  // Poll for pending tasks
  useEffect(() => {
    if (!apiKey) return;

    const interval = setInterval(() => {
      const pendingTasks = tasks.filter(t => t.status === "PENDING" || t.status === "RUNNING");
      pendingTasks.forEach(task => {
        pollTask({ taskId: task.taskId, apiKey });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [tasks, apiKey, pollTask]);

  useEffect(() => {
    const savedKey = localStorage.getItem("RUNWAYML_API_SECRET");
    if (savedKey) {
      setApiKey(savedKey);
    }
    // Load active IG account
    const savedIg = localStorage.getItem("ACTIVE_IG_ACCOUNT");
    if (savedIg) setActiveIgAccount(savedIg);
  }, []);

  const handleSelectIgAccount = (igUserId: string) => {
    setActiveIgAccount(igUserId);
    localStorage.setItem("ACTIVE_IG_ACCOUNT", igUserId);
    setIgPopoverOpen(false);
  };

  const activeIg = igAccounts.find(a => a.igUserId === activeIgAccount);

  // Generic action runner with loading state
  const runAction = async (key: string, fn: () => Promise<any>) => {
    if (!apiKey) return;
    setGenLoading(key);
    try { await fn(); setPrompt(""); setImageUrl(""); setVideoUri(""); setAudioUri(""); setRefImageUri(""); }
    catch (e: any) { console.error(`Failed: ${key}`, e); }
    finally { setGenLoading(null); }
  };

  const handleGenerate = async (type: "text_to_video" | "image_to_video") => {
    if (!prompt || !apiKey) return;
    setIsGenerating(true);
    try {
      await startGeneration({
        type,
        promptText: prompt,
        promptImage: type === "image_to_video" ? imageUrl : undefined,
        model: type === "text_to_video" ? "veo3.1" : "gen3a_turbo",
        apiKey: apiKey,
      });
      setPrompt("");
      setImageUrl("");
    } catch (error) {
      console.error("Failed to start generation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateAvatar = async () => {
    if (!avatarName || !avatarImg || !avatarPersonality || !apiKey) return;
    setIsCreatingAvatar(true);
    try {
      await createAvatar({
        name: avatarName,
        referenceImage: avatarImg,
        personality: avatarPersonality,
        voiceId: avatarVoice,
        apiKey: apiKey,
      });
      setAvatarName("");
      setAvatarImg("");
      setAvatarPersonality("");
    } catch (error) {
      console.error("Failed to create avatar:", error);
    } finally {
      setIsCreatingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 border-b border-border bg-background/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/projects" className="mr-2 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Runway Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings */}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary relative">
                <Settings className="w-5 h-5" />
                {!apiKey && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </Link>

            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

        </div>
      </header>

      {!apiKey && (
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-border bg-card backdrop-blur-sm rounded-[3rem] text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <Key className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Setup Required</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              To access Runway's generative models, you need to configure your API key. This is stored securely in your browser.
            </p>
            <Button
              onClick={() => router.push("/settings")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-xl font-bold"
            >
              Configure API Key
            </Button>
          </div>
        </div>
      )}

      {apiKey && (
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          <Tabs defaultValue="generation" className="w-full space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <TabsList className="bg-transparent gap-6 h-auto p-0 flex-wrap">
                <TabsTrigger value="generation" className="bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 pb-4 h-auto font-semibold tracking-wide">
                  Video
                </TabsTrigger>
                <TabsTrigger value="image" className="bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 pb-4 h-auto font-semibold tracking-wide">
                  Image
                </TabsTrigger>
                <TabsTrigger value="audio" className="bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 pb-4 h-auto font-semibold tracking-wide">
                  Audio & Voice
                </TabsTrigger>
                <TabsTrigger value="characters" className="bg-transparent text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-0 pb-4 h-auto font-semibold tracking-wide">
                  Characters
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="generation" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Generation Controls */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="bg-card border-border backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-500 fill-purple-500" />
                        Magic Generation
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Transform your ideas into cinematic video with GWM-1.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Tabs defaultValue="text" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-secondary p-1 border border-border h-12 rounded-xl">
                          <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground text-xs">
                            <Video className="w-3.5 h-3.5 mr-1.5" />
                            Text→Video
                          </TabsTrigger>
                          <TabsTrigger value="img2vid" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground text-xs">
                            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                            Img→Video
                          </TabsTrigger>
                          <TabsTrigger value="vid2vid" className="rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-foreground text-xs">
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            Vid→Video
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="text" className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</label>
                            <Select value={t2vModel} onValueChange={(val) => val && setT2vModel(val)}>
                              <SelectTrigger className="bg-background border-border h-10 text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-neutral-900 border-border text-foreground max-h-60">{VIDEO_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
                            <Textarea placeholder="A cinematic drone shot of a futuristic neon city..." className="bg-background border-border min-h-[120px] focus:border-purple-500/50 text-foreground placeholder:text-muted-foreground rounded-xl resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                          </div>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-purple-500/20" onClick={() => runAction("t2v", () => createTextToVideo({ promptText: prompt, model: t2vModel, apiKey: apiKey! }))} disabled={genLoading === "t2v" || !prompt}>
                            {genLoading === "t2v" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Video <Sparkles className="w-4 h-4 ml-2" /></>}
                          </Button>
                        </TabsContent>

                        <TabsContent value="img2vid" className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</label>
                            <Select value={i2vModel} onValueChange={(val) => val && setI2vModel(val)}>
                              <SelectTrigger className="bg-background border-border h-10 text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-neutral-900 border-border text-foreground max-h-60">{VIDEO_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Image URL</label>
                            <MediaUploadInput placeholder="https://example.com/image.jpg" value={imageUrl} onChange={setImageUrl} accept="image/*" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Motion Description</label>
                            <Textarea placeholder="Add realistic rain and lightning..." className="bg-background border-border min-h-[100px] text-foreground placeholder:text-muted-foreground rounded-xl resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                          </div>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-purple-500/20" onClick={() => runAction("i2v", () => createImageToVideo({ promptText: prompt, promptImage: imageUrl, model: i2vModel, apiKey: apiKey! }))} disabled={genLoading === "i2v" || !prompt || !imageUrl}>
                            {genLoading === "i2v" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Animate Image <Play className="w-4 h-4 ml-2" /></>}
                          </Button>
                        </TabsContent>

                        <TabsContent value="vid2vid" className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Video URL</label>
                            <MediaUploadInput placeholder="https://example.com/video.mp4" value={videoUri} onChange={setVideoUri} accept="video/*" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
                            <Textarea placeholder="Transform this video into an anime style..." className="bg-background border-border min-h-[100px] text-foreground placeholder:text-muted-foreground rounded-xl resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Image (optional)</label>
                            <MediaUploadInput placeholder="https://example.com/style-ref.jpg" value={refImageUri} onChange={setRefImageUri} accept="image/*" />
                          </div>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-purple-500/20" onClick={() => runAction("v2v", () => createVideoToVideo({ promptText: prompt, videoUri, referenceImageUri: refImageUri || undefined, apiKey: apiKey! }))} disabled={genLoading === "v2v" || !prompt || !videoUri}>
                            {genLoading === "v2v" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Transform Video <Wand2 className="w-4 h-4 ml-2" /></>}
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: History Feed */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <History className="w-5 h-5 text-muted-foreground" />
                      Recent Generations
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.length === 0 ? (
                      <div className="col-span-2 py-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl text-muted-foreground">
                        <Video className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No generations yet. Start by creating something magic.</p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <Card key={task.taskId} className="bg-card border-border overflow-hidden group hover:border-border hover:border-foreground/20 transition-all">
                          <div className="aspect-video bg-background flex items-center justify-center relative overflow-hidden">
                            {task.outputUrl ? (
                              <video
                                src={task.outputUrl}
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{task.status}</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest border border-border text-foreground/80">
                              {task.model}
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <p className="text-sm text-foreground/80 line-clamp-2 font-medium leading-relaxed">
                              {task.promptText}
                            </p>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                              <span className="text-purple-500">{task.type.replace("_", " ")}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ─── Image Tab ─── */}
            <TabsContent value="image" className="mt-0 focus-visible:outline-none">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-card border-border backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600" />
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-emerald-500" />
                      Image Generation
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Generate images from text prompts with optional reference images.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</label>
                      <Select value={t2iModel} onValueChange={(val) => val && setT2iModel(val)}>
                        <SelectTrigger className="bg-background border-border h-10 text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-border text-foreground max-h-60">{IMAGE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
                      <Textarea placeholder="A serene landscape with mountains at golden hour..." className="bg-background border-border min-h-[120px] text-foreground placeholder:text-muted-foreground rounded-xl resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Image URL (optional)</label>
                      <MediaUploadInput placeholder="https://example.com/reference.jpg" value={refImageUri} onChange={setRefImageUri} accept="image/*" />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-emerald-500/20" onClick={() => runAction("t2i", () => createTextToImage({ promptText: prompt, model: t2iModel, referenceImages: refImageUri ? [{ uri: refImageUri }] : undefined, apiKey: apiKey! }))} disabled={genLoading === "t2i" || !prompt}>
                      {genLoading === "t2i" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Image <Sparkles className="w-4 h-4 ml-2" /></>}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── Audio & Voice Tab ─── */}
            <TabsContent value="audio" className="mt-0 focus-visible:outline-none">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-card border-border backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600" />
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                      <AudioLines className="w-6 h-6 text-orange-500" />
                      Audio & Voice Tools
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Sound effects, speech generation, dubbing, and isolation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="sfx" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 bg-secondary p-1 border border-border h-10 rounded-xl mb-6">
                        <TabsTrigger value="sfx" className="rounded-lg data-[state=active]:bg-secondary text-[10px]">SFX</TabsTrigger>
                        <TabsTrigger value="tts" className="rounded-lg data-[state=active]:bg-secondary text-[10px]">TTS</TabsTrigger>
                        <TabsTrigger value="sts" className="rounded-lg data-[state=active]:bg-secondary text-[10px]">STS</TabsTrigger>
                        <TabsTrigger value="dub" className="rounded-lg data-[state=active]:bg-secondary text-[10px]">Dub</TabsTrigger>
                        <TabsTrigger value="isolate" className="rounded-lg data-[state=active]:bg-secondary text-[10px]">Isolate</TabsTrigger>
                      </TabsList>

                      {/* Sound Effects */}
                      <TabsContent value="sfx" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                          <Textarea placeholder="A thunderstorm with heavy rain..." className="bg-background border-border min-h-[100px] text-foreground placeholder:text-muted-foreground rounded-xl resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration (s)</label>
                            <Input type="number" min={0.5} max={30} step={0.5} className="bg-background border-border h-10 text-foreground rounded-xl" value={sfxDuration} onChange={(e) => setSfxDuration(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2 flex flex-col justify-end">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                              <input type="checkbox" checked={sfxLoop} onChange={(e) => setSfxLoop(e.target.checked)} className="rounded" /> Loop
                            </label>
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold h-12 rounded-xl" onClick={() => runAction("sfx", () => createSoundEffect({ promptText: prompt, duration: sfxDuration, loop: sfxLoop, apiKey: apiKey! }))} disabled={genLoading === "sfx" || !prompt}>
                          {genLoading === "sfx" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate SFX <Music className="w-4 h-4 ml-2" /></>}
                        </Button>
                      </TabsContent>

                      {/* Text to Speech */}
                      <TabsContent value="tts" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Text</label>
                          <Textarea placeholder="The quick brown fox jumps over the lazy dog..." className="bg-background border-border min-h-[100px] text-foreground placeholder:text-muted-foreground rounded-xl resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voice</label>
                          <Select value={ttsVoice} onValueChange={(val) => val && setTtsVoice(val)}>
                            <SelectTrigger className="bg-background border-border h-10 text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-border text-foreground max-h-60">{TTS_VOICES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold h-12 rounded-xl" onClick={() => runAction("tts", () => createTextToSpeech({ promptText: prompt, voicePresetId: ttsVoice, apiKey: apiKey! }))} disabled={genLoading === "tts" || !prompt}>
                          {genLoading === "tts" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Speech <Volume2 className="w-4 h-4 ml-2" /></>}
                        </Button>
                      </TabsContent>

                      {/* Speech to Speech */}
                      <TabsContent value="sts" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio / Video URL</label>
                          <MediaUploadInput placeholder="https://example.com/audio.mp3" value={audioUri} onChange={setAudioUri} accept="audio/*,video/*" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Voice</label>
                          <Select value={ttsVoice} onValueChange={(val) => val && setTtsVoice(val)}>
                            <SelectTrigger className="bg-background border-border h-10 text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-border text-foreground max-h-60">{TTS_VOICES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold h-12 rounded-xl" onClick={() => runAction("sts", () => createSpeechToSpeech({ mediaType: "audio", mediaUri: audioUri, voicePresetId: ttsVoice, apiKey: apiKey! }))} disabled={genLoading === "sts" || !audioUri}>
                          {genLoading === "sts" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Convert Voice <Mic className="w-4 h-4 ml-2" /></>}
                        </Button>
                      </TabsContent>

                      {/* Voice Dubbing */}
                      <TabsContent value="dub" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio URL</label>
                          <MediaUploadInput placeholder="https://example.com/audio.mp3" value={audioUri} onChange={setAudioUri} accept="audio/*" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Language</label>
                          <Select value={targetLang} onValueChange={(val) => val && setTargetLang(val)}>
                            <SelectTrigger className="bg-background border-border h-10 text-foreground rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-border text-foreground max-h-60">{LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold h-12 rounded-xl" onClick={() => runAction("dub", () => createVoiceDubbing({ audioUri, targetLang, apiKey: apiKey! }))} disabled={genLoading === "dub" || !audioUri}>
                          {genLoading === "dub" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Dub Audio <Globe className="w-4 h-4 ml-2" /></>}
                        </Button>
                      </TabsContent>

                      {/* Voice Isolation */}
                      <TabsContent value="isolate" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio URL (min 4.6s)</label>
                          <MediaUploadInput placeholder="https://example.com/audio.mp3" value={audioUri} onChange={setAudioUri} accept="audio/*" />
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold h-12 rounded-xl" onClick={() => runAction("iso", () => createVoiceIsolation({ audioUri, apiKey: apiKey! }))} disabled={genLoading === "iso" || !audioUri}>
                          {genLoading === "iso" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Isolate Voice <AudioLines className="w-4 h-4 ml-2" /></>}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="characters" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                  <Card className="bg-card border-border backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-500" />
                        Create Character
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Design a digital persona from a single image.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                        <Input
                          placeholder="Character Name"
                          className="bg-background border-border h-12 text-foreground placeholder:text-muted-foreground rounded-xl"
                          value={avatarName}
                          onChange={(e) => setAvatarName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Image URL</label>
                        <MediaUploadInput
                          placeholder="https://example.com/character.jpg"
                          value={avatarImg}
                          onChange={setAvatarImg}
                          accept="image/*"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Personality & Knowledge</label>
                        <Textarea
                          placeholder="Describe how the character should behave and what they know..."
                          className="bg-background border-border min-h-[100px] text-foreground placeholder:text-muted-foreground rounded-xl resize-none"
                          value={avatarPersonality}
                          onChange={(e) => setAvatarPersonality(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voice Preset</label>
                        <Select value={avatarVoice} onValueChange={(val) => val && setAvatarVoice(val)}>
                          <SelectTrigger className="bg-background border-border h-12 text-foreground rounded-xl">
                            <SelectValue placeholder="Select a voice" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-900 border-border text-foreground">
                            {VOICES.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 rounded-xl transition-all"
                        onClick={handleCreateAvatar}
                        disabled={isCreatingAvatar || !avatarName || !avatarImg}
                      >
                        {isCreatingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Character"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    My Characters
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {avatars.length === 0 ? (
                      <div className="col-span-2 py-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No characters deployed yet.</p>
                      </div>
                    ) : (
                      avatars.map((avatar) => (
                        <Card key={avatar.avatarId} className="bg-card border-border overflow-hidden hover:border-border hover:border-foreground/20 transition-all flex flex-col">
                          <div className="aspect-[4/5] bg-background relative">
                            <img src={avatar.referenceImage} alt={avatar.name} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <h3 className="text-lg font-bold">{avatar.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Mic className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Voice: {avatar.voiceId}</span>
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-4 flex-1 flex flex-col justify-between">
                            <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                              "{avatar.personality}"
                            </p>
                            <div className="mt-4 flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1 bg-secondary border-border text-foreground text-[10px] uppercase tracking-widest font-bold h-8">
                                <MessageSquare className="w-3 h-3 mr-2" />
                                Chat
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 bg-secondary border-border text-foreground text-[10px] uppercase tracking-widest font-bold h-8">
                                <Video className="w-3 h-3 mr-2" />
                                Generate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      )}
    </div>
  );
}
