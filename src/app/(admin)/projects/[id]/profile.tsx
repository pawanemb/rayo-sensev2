"use client";

import React from "react";
import ProjectInformation from "@/components/project-profile/ProjectInformation";
import ProjectConfiguration from "@/components/project-profile/ProjectConfiguration";
import ProjectSettings from "@/components/project-profile/ProjectSettings";
import ProjectBlogs from "@/components/project-profile/ProjectBlogs";
import ProjectImageGallery from "@/components/project-profile/ProjectImageGallery";
import ScrapedContent from "@/components/project-profile/ScrapedContent";

interface ProjectData {
  id: string;
  name: string;
  url: string;
  brand_name: string | null;
  services: string[];
  industries: string[];
  gender: string;
  languages: string[];
  age_groups: string[];
  locations: string[];
  business_type: string | null;
  is_active: boolean;
  visitors: number;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  cms_config: unknown;
  background_image: string | null;
  brand_tone_settings: Record<string, string>;
  featured_image_style: string | null;
  feature_image_active: boolean;
  pinned: boolean;
  internal_linking_enabled: boolean;
  person_tone: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

interface ProjectInformation {
  id: string;
  name: string;
  url: string;
  brand_name: string | null;
  visitors: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface BlogRecord {
  _id: string;
  title: string;
  status: string;
  word_count: number;
  created_at: string;
}

interface ProjectProfileProps {
  projectId: string;
  projectData?: ProjectData;
  projectInformation?: ProjectInformation;
  blogsCount?: number;
  recentBlogs?: BlogRecord[];
  scrapedContent?: string | null;
  onProjectUpdated?: () => void;
}

export default function ProjectProfile({
  projectId,
  projectData,
  projectInformation,
  blogsCount,
  recentBlogs,
  scrapedContent,
  onProjectUpdated,
}: ProjectProfileProps) {
  return (
    <div className="space-y-6">
      {/* Project Information Header - Full Width */}
      <ProjectInformation
        projectId={projectId}
        projectData={projectData}
        projectInformation={projectInformation}
        onProjectUpdated={onProjectUpdated}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Configuration */}
          <ProjectConfiguration projectData={projectData} onProjectUpdated={onProjectUpdated} />

          {/* Project Blogs */}
          <ProjectBlogs projectId={projectId} blogsCount={blogsCount} recentBlogs={recentBlogs} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Settings */}
          <ProjectSettings projectData={projectData} onProjectUpdated={onProjectUpdated} />

          {/* Scraped Content */}
          <ScrapedContent scrapedContent={scrapedContent ?? null} />
        </div>
      </div>

      {/* Project Images - Full Width at Bottom */}
      <ProjectImageGallery projectId={projectId} />
    </div>
  );
}
