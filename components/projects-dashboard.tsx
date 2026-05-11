"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Sparkles, Folder, ArrowRight, Loader2, Trash2,
  Settings, Key, ShieldCheck, AlertCircle,
  ChevronDown, Check, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Custom Instagram icon
const Instagram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export function ProjectsDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Projects states
  const projects = useQuery(api.projects.listProjects) || [];
  const createProject = useMutation(api.projects.createProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // API Key states
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Instagram states
  const [igToken, setIgToken] = useState("");
  const [isConnectingIg, setIsConnectingIg] = useState(false);
  const [igError, setIgError] = useState<string | null>(null);
  const [activeIgAccount, setActiveIgAccount] = useState<string | null>(null);
  const [igPopoverOpen, setIgPopoverOpen] = useState(false);

  const igAccounts = useQuery(api.instagram.listAccounts) || [];
  const connectIgAccount = useAction(api.instagram.connectAccount);
  const removeIgAccount = useMutation(api.instagram.removeAccount);

  useEffect(() => {
    const savedKey = localStorage.getItem("RUNWAYML_API_SECRET");
    if (savedKey) {
      setApiKey(savedKey);
      setTempKey(savedKey);
    }
    const savedIg = localStorage.getItem("ACTIVE_IG_ACCOUNT");
    if (savedIg) setActiveIgAccount(savedIg);
  }, []);

  const saveApiKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem("RUNWAYML_API_SECRET", tempKey.trim());
      setApiKey(tempKey.trim());
      setIsSettingsOpen(false);
    }
  };

  const handleConnectIg = async () => {
    if (!igToken.trim()) return;
    setIsConnectingIg(true);
    setIgError(null);
    try {
      const result = await connectIgAccount({ accessToken: igToken.trim() });
      localStorage.setItem(`IG_TOKEN_${result.igUserId}`, igToken.trim());
      setActiveIgAccount(result.igUserId);
      localStorage.setItem("ACTIVE_IG_ACCOUNT", result.igUserId);
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
    if (activeIgAccount === igUserId) {
      const remaining = igAccounts.filter(a => a.igUserId !== igUserId);
      if (remaining.length > 0) {
        setActiveIgAccount(remaining[0].igUserId);
        localStorage.setItem("ACTIVE_IG_ACCOUNT", remaining[0].igUserId);
      } else {
        setActiveIgAccount(null);
        localStorage.removeItem("ACTIVE_IG_ACCOUNT");
      }
    }
  };

  const handleSelectIgAccount = (igUserId: string) => {
    setActiveIgAccount(igUserId);
    localStorage.setItem("ACTIVE_IG_ACCOUNT", igUserId);
    setIgPopoverOpen(false);
  };

  const activeIg = igAccounts.find(a => a.igUserId === activeIgAccount);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setIsCreating(true);
    try {
      const projectId = await createProject({ name: projectName });
      setIsDialogOpen(false);
      setProjectName("");
      router.push(`/dashboard?project=${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30 font-sans flex w-full">
        {/* Background Decor */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        </div>

        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar/50 backdrop-blur-xl z-20">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="hover:bg-accent data-[state=open]:bg-accent">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-sidebar-foreground">Studio</span>
                    <span className="text-xs text-muted-foreground">Generative AI</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Your Projects" isActive className="hover:bg-accent hover:text-accent-foreground text-foreground/70">
                      <Link href="/projects">
                        <Folder className="text-purple-500" />
                        <span>Your Projects</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover open={igPopoverOpen} onOpenChange={setIgPopoverOpen}>
                  <PopoverTrigger >
                    <SidebarMenuButton tooltip="Instagram Connect" className="hover:bg-accent hover:text-accent-foreground text-foreground/70">
                      <Instagram className="text-pink-500" />
                      <span>{activeIg ? `@${activeIg.username}` : "Connect IG"}</span>
                      <ChevronDown className="ml-auto opacity-50" />
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-card border-border text-card-foreground p-0 shadow-2xl" side="right" align="end">
                    <div className="p-3 border-b border-border">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accounts</p>
                    </div>
                    {igAccounts.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        <Instagram className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No accounts connected</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {igAccounts.map((acc) => (
                          <div
                            key={acc.igUserId}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all hover:bg-accent group",
                              activeIgAccount === acc.igUserId && "bg-pink-500/10"
                            )}
                            onClick={() => handleSelectIgAccount(acc.igUserId)}
                          >
                            <div className="relative">
                              {acc.profilePicture ? (
                                <img src={acc.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-pink-500/30 transition-all" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {acc.username[0]?.toUpperCase()}
                                </div>
                              )}
                              {activeIgAccount === acc.igUserId && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                                  <Check className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">@{acc.username}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDisconnectIg(acc.igUserId); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full h-9 text-sm text-pink-500 hover:text-pink-600 hover:bg-pink-500/10"
                        onClick={() => { setIgPopoverOpen(false); setIsSettingsOpen(true); }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Account
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
                  className="hover:bg-accent hover:text-accent-foreground text-foreground/70"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="text-yellow-500" /> : <Moon className="text-blue-500" />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger >
                    <SidebarMenuButton tooltip="Settings" className="hover:bg-accent hover:text-accent-foreground text-foreground/70 relative">
                      <Settings className="text-purple-500" />
                      <span>Settings</span>
                      {!apiKey && <span className="absolute right-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-xl max-w-lg max-h-[90vh] overflow-y-auto z-50">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Key className="w-5 h-5 text-purple-500" />
                        API Configuration
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground pt-2">
                        Connect your APIs to unlock all features. Keys are stored locally in your browser.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                      {/* RunwayML Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-500/10 rounded-md flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-wider">RunwayML</h3>
                          {apiKey && <span className="ml-auto text-[10px] text-green-500 font-bold uppercase tracking-widest">Connected</span>}
                        </div>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="sk_..."
                            className="bg-muted border-border h-11 pr-10 focus:border-purple-500/50 transition-all rounded-xl text-foreground"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                          />
                          <ShieldCheck className={cn(
                            "absolute right-3 top-3 w-5 h-5 transition-colors",
                            tempKey ? "text-green-500" : "text-muted-foreground"
                          )} />
                        </div>
                        <Button
                          onClick={saveApiKey}
                          disabled={!tempKey.trim()}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white h-10 rounded-xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-40"
                        >
                          Save Runway Key
                        </Button>
                      </div>

                      <div className="border-t border-border" />

                      {/* Instagram Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-md flex items-center justify-center">
                            <Instagram className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-wider">Instagram</h3>
                        </div>

                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="Instagram Access Token..."
                            className="bg-muted border-border h-11 pr-10 focus:border-pink-500/50 transition-all rounded-xl text-foreground"
                            value={igToken}
                            onChange={(e) => { setIgToken(e.target.value); setIgError(null); }}
                          />
                          <Instagram className={cn(
                            "absolute right-3 top-3 w-5 h-5 transition-colors",
                            igToken ? "text-pink-500" : "text-muted-foreground"
                          )} />
                        </div>

                        {igError && (
                          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-2 items-start">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-[11px] text-destructive leading-relaxed">{igError}</p>
                          </div>
                        )}

                        <Button
                          onClick={handleConnectIg}
                          disabled={!igToken.trim() || isConnectingIg}
                          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-10 rounded-xl font-bold shadow-lg shadow-pink-500/20 disabled:opacity-40"
                        >
                          {isConnectingIg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Instagram className="w-4 h-4 mr-2" />}
                          Connect Account
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-transparent relative z-10 flex flex-1 flex-col overflow-hidden">
          <header className="h-16 flex shrink-0 items-center gap-2 border-b border-border bg-background/50 backdrop-blur-md px-4 sticky top-0 z-20 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4 bg-border mx-2" />
            <h1 className="text-xl font-semibold">Projects</h1>

            <div className="ml-auto">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger >
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-9 px-4 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Folder className="w-5 h-5 text-purple-500" />
                      New Project
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Give your new generative workspace a name.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project Name</label>
                      <Input
                        placeholder="e.g. Cyberpunk Cinematic"
                        className="bg-muted border-border h-12 focus:border-purple-500/50 transition-all rounded-xl text-foreground"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateProject();
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectName.trim() || isCreating}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white h-11 rounded-xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Project"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl w-full mx-auto">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 px-6 border-2 border-dashed border-border bg-card/50 rounded-[2rem] text-center max-w-2xl mx-auto mt-10">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                    <Folder className="w-8 h-8 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">No projects yet</h2>
                  <p className="text-muted-foreground mb-8 max-w-md text-sm">
                    Create a new project to start organizing your generative AI workflows, video generations, and digital characters.
                  </p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 rounded-xl font-bold shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card key={project._id} className="bg-card border-border hover:border-border/80 transition-all group overflow-hidden flex flex-col relative shadow-sm hover:shadow-md">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center border border-border">
                            <Folder className="w-5 h-5 text-purple-500" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              deleteProject({ id: project._id });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition-colors">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mb-6 flex-1">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>

                        <Link href={`/dashboard?project=${project._id}`}>
                          <Button variant="ghost" className="w-full justify-between hover:bg-accent text-foreground/70 hover:text-foreground px-0">
                            Open Project
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
