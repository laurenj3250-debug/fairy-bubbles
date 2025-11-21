import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Folder, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  selectedProjectId: number | null;
  onSelect: (projectId: number | null) => void;
  className?: string;
}

export function ProjectSelector({ selectedProjectId, onSelect, className }: ProjectSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return await apiRequest("/api/projects", "POST", data);
    },
    onSuccess: (newProject: Project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onSelect(newProject.id);
      setIsCreating(false);
      setNewProjectName("");
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate({
      name: newProjectName.trim(),
      color: selectedColor,
    });
  };

  const projectColors = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Teal", value: "#14b8a6" },
  ];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className={cn("relative", className)}>
      {/* Selected Project Display */}
      <div className="flex items-center gap-2 flex-wrap">
        {selectedProject ? (
          <button
            onClick={() => onSelect(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
            style={{
              background: `${selectedProject.color}15`,
              borderColor: `${selectedProject.color}40`,
              color: selectedProject.color,
            }}
          >
            <span>{selectedProject.icon || "📁"}</span>
            <span className="font-medium text-sm">{selectedProject.name}</span>
            <X className="w-3 h-3 ml-1" />
          </button>
        ) : (
          <div className="text-sm text-muted-foreground">No project selected</div>
        )}
      </div>

      {/* Project List */}
      <div className="mt-3 flex flex-wrap gap-2">
        {projects.map((project) => {
          const isSelected = project.id === selectedProjectId;
          return (
            <button
              key={project.id}
              onClick={() => onSelect(isSelected ? null : project.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105",
                isSelected && "ring-2"
              )}
              style={{
                background: isSelected ? `${project.color}20` : `${project.color}10`,
                borderColor: `${project.color}${isSelected ? "60" : "30"}`,
                color: project.color,
              }}
            >
              <span>{project.icon || "📁"}</span>
              <span className="text-sm font-medium">{project.name}</span>
              {isSelected && <Check className="w-3 h-3 ml-1" />}
            </button>
          );
        })}

        {/* Create New Project */}
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-foreground/20 hover:border-foreground/40 transition-all text-foreground/60 hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Project</span>
          </button>
        )}
      </div>

      {/* Create Project Form */}
      {isCreating && (
        <div className="mt-4 p-4 rounded-xl bg-background/60 border border-foreground/10 shadow-lg">
          <h3 className="text-sm font-semibold text-foreground mb-3">Create New Project</h3>

          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateProject();
              if (e.key === "Escape") setIsCreating(false);
            }}
            placeholder="Project name..."
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />

          <div className="mb-3">
            <label className="text-xs text-foreground/60 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {projectColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all hover:scale-110",
                    selectedColor === color.value && "ring-2 ring-offset-2 ring-foreground/40"
                  )}
                  style={{ background: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || createProjectMutation.isPending}
              className="flex-1"
            >
              Create
            </Button>
            <Button onClick={() => setIsCreating(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
