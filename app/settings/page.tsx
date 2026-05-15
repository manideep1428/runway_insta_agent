"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Key,
  ShieldCheck,
  Sparkles,
  Bot,
  Database,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";

// Custom Instagram icon
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function SettingsPage() {
  // API Keys states
  const [runwayKey, setRunwayKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [composioKey, setComposioKey] = useState("");

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"api" | "social">("api");

  // Visibility toggles
  const [showRunway, setShowRunway] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showComposio, setShowComposio] = useState(false);
  const [showIg, setShowIg] = useState(false);

  // Instagram states
  const [igToken, setIgToken] = useState("");
  const [isConnectingIg, setIsConnectingIg] = useState(false);
  const [igError, setIgError] = useState<string | null>(null);

  const igAccounts = useQuery(api.instagram.listAccounts) || [];
  const connectIgAccount = useAction(api.instagram.connectAccount);
  const removeIgAccount = useMutation(api.instagram.removeAccount);

  useEffect(() => {
    setRunwayKey(localStorage.getItem("RUNWAYML_API_SECRET") || "");
    setOpenaiKey(localStorage.getItem("OPENAI_API_KEY") || "");
    setComposioKey(localStorage.getItem("COMPOSIO_API_KEY") || "");
  }, []);

  const saveKey = (name: string, value: string, storageKey: string) => {
    localStorage.setItem(storageKey, value.trim());
    setSavedStatus(prev => ({ ...prev, [name]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [name]: false }));
    }, 2000);
  };

  const handleConnectIg = async () => {
    if (!igToken.trim()) return;
    setIsConnectingIg(true);
    setIgError(null);
    try {
      const result = await connectIgAccount({ accessToken: igToken.trim() });
      localStorage.setItem(`IG_TOKEN_${result.igUserId}`, igToken.trim());
      setIgToken("");
    } catch (err: any) {
      setIgError(err.message || "Failed to connect Instagram account");
    } finally {
      setIsConnectingIg(false);
    }
  };

  const handleDisconnectIg = async (igUserId: string) => {
    await removeIgAccount({ igUserId });
    localStorage.removeItem(`IG_TOKEN_${igUserId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-purple-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <header className="flex items-center gap-4 mb-12">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your workspace connections and API configurations.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation Sidebar (Local to page) */}
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("api")}
              className={`w-full justify-start gap-3 font-semibold rounded-xl px-4 py-6 ${activeTab === "api" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <ShieldCheck className={`w-5 h-5 ${activeTab === "api" ? "text-purple-500" : ""}`} />
              API & Security
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("social")}
              className={`w-full justify-start gap-3 font-semibold rounded-xl px-4 py-6 ${activeTab === "social" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              <InstagramIcon className={`w-5 h-5 ${activeTab === "social" ? "text-pink-500" : ""}`} />
              Social Accounts
            </Button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {activeTab === "api" && (
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold">API Configuration</h2>
              </div>

              <div className="grid gap-6">
                {/* RunwayML Key */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                        </div>
                        <CardTitle className="text-base font-semibold">RunwayML API Secret</CardTitle>
                      </div>
                      {runwayKey && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Active</span>}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">Used for video and image generation tasks.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative flex items-center">
                      <Input
                        type={showRunway ? "text" : "password"}
                        value={runwayKey}
                        onChange={(e) => setRunwayKey(e.target.value)}
                        placeholder="sk_..."
                        className="bg-background border-border h-11 pr-20 focus:border-purple-500/50 rounded-xl"
                      />
                      <div className="absolute right-3 flex items-center gap-2">
                        <button type="button" onClick={() => setShowRunway(!showRunway)} className="text-muted-foreground hover:text-foreground">
                          {showRunway ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <Lock className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    </div>
                    <Button
                      onClick={() => saveKey("runway", runwayKey, "RUNWAYML_API_SECRET")}
                      className="w-full bg-secondary hover:bg-secondary text-foreground border border-border h-10 rounded-xl font-semibold"
                    >
                      {savedStatus["runway"] ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : null}
                      {savedStatus["runway"] ? "Saved" : "Update Runway Key"}
                    </Button>
                  </CardContent>
                </Card>

                {/* OpenAI Key */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-emerald-500" />
                        </div>
                        <CardTitle className="text-base font-semibold">OpenAI API Key</CardTitle>
                      </div>
                      {openaiKey && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Active</span>}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">Powers the AI Agentic Assistant and chat features.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative flex items-center">
                      <Input
                        type={showOpenai ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="bg-background border-border h-11 pr-20 focus:border-emerald-500/50 rounded-xl"
                      />
                      <div className="absolute right-3 flex items-center gap-2">
                        <button type="button" onClick={() => setShowOpenai(!showOpenai)} className="text-muted-foreground hover:text-foreground">
                          {showOpenai ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <Lock className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    </div>
                    <Button
                      onClick={() => saveKey("openai", openaiKey, "OPENAI_API_KEY")}
                      className="w-full bg-secondary hover:bg-secondary text-foreground border border-border h-10 rounded-xl font-semibold"
                    >
                      {savedStatus["openai"] ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : null}
                      {savedStatus["openai"] ? "Saved" : "Update OpenAI Key"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Composio Key */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Database className="w-4 h-4 text-blue-500" />
                        </div>
                        <CardTitle className="text-base font-semibold">Composio API Key</CardTitle>
                      </div>
                      {composioKey && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Active</span>}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">Connects the assistant to external tools and actions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative flex items-center">
                      <Input
                        type={showComposio ? "text" : "password"}
                        value={composioKey}
                        onChange={(e) => setComposioKey(e.target.value)}
                        placeholder="ak_..."
                        className="bg-background border-border h-11 pr-20 focus:border-blue-500/50 rounded-xl"
                      />
                      <div className="absolute right-3 flex items-center gap-2">
                        <button type="button" onClick={() => setShowComposio(!showComposio)} className="text-muted-foreground hover:text-foreground">
                          {showComposio ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <Lock className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    </div>
                    <Button
                      onClick={() => saveKey("composio", composioKey, "COMPOSIO_API_KEY")}
                      className="w-full bg-secondary hover:bg-secondary text-foreground border border-border h-10 rounded-xl font-semibold"
                    >
                      {savedStatus["composio"] ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : null}
                      {savedStatus["composio"] ? "Saved" : "Update Composio Key"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
            )}

            {activeTab === "social" && (
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <InstagramIcon className="w-5 h-5 text-pink-500" />
                <h2 className="text-xl font-bold">Instagram Accounts</h2>
              </div>

              <div className="space-y-4">
                {/* Connected accounts list */}
                {igAccounts.length > 0 && (
                  <div className="grid gap-3">
                    {igAccounts.map((acc) => (
                      <div key={acc.igUserId} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {acc.profilePicture ? (
                              <img src={acc.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-border" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold">
                                {acc.username[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-foreground" />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-tight">@{acc.username}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                              {acc.followersCount?.toLocaleString() || 0} Followers · {acc.mediaCount || 0} Posts
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisconnectIg(acc.igUserId)}
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new account */}
                <Card className="bg-card border-border border-dashed overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Account
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Connect a new Instagram Professional account using a Graph API token.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative flex items-center">
                        <Input
                          type={showIg ? "text" : "password"}
                          value={igToken}
                          onChange={(e) => { setIgToken(e.target.value); setIgError(null); }}
                          placeholder="Instagram Access Token..."
                          className="bg-background border-border h-11 pr-20 focus:border-pink-500/50 rounded-xl"
                        />
                        <div className="absolute right-3 flex items-center gap-2">
                          <button type="button" onClick={() => setShowIg(!showIg)} className="text-muted-foreground hover:text-foreground">
                            {showIg ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <InstagramIcon className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Requires a long-lived User Access Token with `instagram_basic` and `instagram_content_publish` scopes.
                      </p>
                    </div>

                    {igError && (
                      <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-[11px] text-red-400">
                        {igError}
                      </div>
                    )}

                    <Button
                      onClick={handleConnectIg}
                      disabled={!igToken.trim() || isConnectingIg}
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-11 rounded-xl font-bold shadow-lg shadow-pink-500/20 disabled:opacity-40"
                    >
                      {isConnectingIg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Connect Instagram Account
                    </Button>

                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      className="flex items-center justify-center gap-2 text-[10px] text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-widest font-bold"
                    >
                      Open Graph Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
