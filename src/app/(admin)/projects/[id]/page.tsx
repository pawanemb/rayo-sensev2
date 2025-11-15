"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectProfile from "./profile";

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
  brand_tone_settings: unknown;
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

export default function ProjectProfilePage() {
  const params = useParams();
  const project_id = params.id as string;
  const [projectData, setProjectData] = useState<ProjectData | undefined>(undefined);
  const [projectInformation, setProjectInformation] = useState<ProjectInformation | null>(null);
  const [blogsCount, setBlogsCount] = useState<number>(0);
  const [recentBlogs, setRecentBlogs] = useState<BlogRecord[]>([]);
  const [scrapedContent, setScrapedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project_id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("API Error:", response.status, errorData);
        const errorMessage = errorData.error || `Failed to fetch project (${response.status})`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Project data fetched:", data);
      setProjectData(data.project);
      setProjectInformation(data.projectInformation);
      setBlogsCount(data.blogsCount || 0);
      setRecentBlogs(data.recentBlogs || []);
      setScrapedContent(data.scrapedContent || null);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      setProjectData(undefined);
      setProjectInformation(null);
      setBlogsCount(0);
      setRecentBlogs([]);
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project_id]);

  const handleProjectUpdated = () => {
    fetchProject();
  };

  if (isLoading) {
    return <ProjectProfile projectId={project_id} projectData={undefined} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-error-200 bg-error-50 px-6 py-8 text-center dark:border-error-500/30 dark:bg-error-500/10">
          <h3 className="text-lg font-semibold text-error-900 dark:text-error-200 mb-2">
            Failed to load project
          </h3>
          <p className="text-sm text-error-700 dark:text-error-300 mb-4">
            {error}
          </p>
          <button
            onClick={fetchProject}
            className="rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 dark:bg-error-700 dark:hover:bg-error-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectProfile
      projectId={project_id}
      projectData={projectData}
      projectInformation={projectInformation || undefined}
      blogsCount={blogsCount}
      recentBlogs={recentBlogs}
      scrapedContent={scrapedContent}
      onProjectUpdated={handleProjectUpdated}
    />
  );
}
