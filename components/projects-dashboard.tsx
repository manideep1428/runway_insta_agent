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
  Plus, Sparkles, Folder, ArrowRight, Loader2, Trash2, Edit2,
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
  const renameProject = useMutation(api.projects.renameProject);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Rename states
  const [renameId, setRenameId] = useState<any>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // API Key states
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("RUNWAYML_API_SECRET");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setIsCreating(true);
    try {
      const projectId = await createProject({ name: projectName });
      setIsDialogOpen(false);
      setProjectName("");
      router.push(`/chat?project=${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !renameId) return;
    setIsRenaming(true);
    try {
      await renameProject({ id: renameId, name: renameValue });
      setRenameId(null);
      setRenameValue("");
    } catch (error) {
      console.error("Failed to rename project:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteProject({ id: deleteId });
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
                <SidebarMenuButton size="lg" className="hover:bg-accent data-[state=open]:bg-accent group-data-[state=collapsed]:justify-center transition-all">
                  <div className="flex aspect-square size-10 group-data-[state=collapsed]:size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 shrink-0">
                    <Sparkles className="size-5 group-data-[state=collapsed]:size-4" />
                  </div>
                  <div className="flex flex-col gap-1 leading-none ml-1 group-data-[state=collapsed]:hidden">
                    <span className="text-lg font-bold text-sidebar-foreground">Studio</span>
                    <span className="text-sm font-medium text-muted-foreground">Generative AI</span>
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
                    <SidebarMenuButton
                      size="lg"
                      tooltip="Your Projects"
                      isActive
                      render={<Link href="/projects" />}
                      className="hover:bg-accent hover:text-accent-foreground text-foreground/70 group-data-[state=collapsed]:justify-center transition-all"
                    >
                      <Folder className="w-5 h-5 text-purple-500 shrink-0" />
                      <span className="text-base font-medium ml-1 group-data-[state=collapsed]:hidden">Your Projects</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
                  className="hover:bg-accent hover:text-accent-foreground text-foreground/70 group-data-[state=collapsed]:justify-center transition-all"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-500 shrink-0" /> : <Moon className="w-5 h-5 text-blue-500 shrink-0" />}
                  <span className="text-base font-medium ml-1 group-data-[state=collapsed]:hidden">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Settings"
                  render={<Link href="/settings" />}
                  className="hover:bg-accent hover:text-accent-foreground text-foreground/70 relative group-data-[state=collapsed]:justify-center transition-all"
                >
                  <Settings className="w-5 h-5 text-purple-500 shrink-0" />
                  <span className="text-base font-medium ml-1 group-data-[state=collapsed]:hidden">Settings</span>
                  {!apiKey && <span className="absolute right-2 w-2 h-2 bg-destructive rounded-full animate-pulse group-data-[state=collapsed]:top-1 group-data-[state=collapsed]:right-1" />}
                </SidebarMenuButton>
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
                <DialogTrigger render={
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-9 px-4 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                } />
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
                    <Card key={project._id} className="bg-card border-border hover:border-border/80 transition-all group overflow-hidden flex flex-col relative shadow-sm hover:shadow-lg hover:-translate-y-1 duration-300">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center border border-border">
                            <Folder className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setRenameId(project._id);
                                setRenameValue(project.name);
                              }}
                              className="p-2 hover:bg-purple-500/10 text-muted-foreground hover:text-purple-500 rounded-lg transition-all"
                              title="Rename Project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setDeleteId(project._id);
                              }}
                              className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1 group-hover:text-purple-500 transition-colors line-clamp-1">{project.name}</h3>
                        <p className="text-xs text-muted-foreground mb-6 flex-1">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>

                        <Link href={`/chat?project=${project._id}`} className="w-full">
                          <Button className="w-full bg-secondary hover:bg-purple-600 hover:text-white border border-border group/btn transition-all rounded-xl h-10 flex items-center justify-between px-4">
                            <span className="font-semibold">Open Workspace</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
    
    {/* Rename Dialog */}
    <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
      <DialogContent className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-purple-500" />
            Rename Project
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter a new name for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input
            placeholder="New project name"
            className="bg-muted border-border h-12 focus:border-purple-500/50 transition-all rounded-xl text-foreground"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRenameId(null)} className="flex-1 rounded-xl">Cancel</Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim() || isRenaming}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold"
            >
              {isRenaming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <DialogContent className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete Project
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete this project? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
