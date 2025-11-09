"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UserProfile from "../profile";
import { type User } from "@/services/userService";

interface UserInformation {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  created_at: string;
  last_sign_in_at: string;
}

interface AccountInformation {
  balance: number;
  total_spent: number;
  payment_method?: string;
  billing_address?: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const user_id = params.user_id as string;
  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [userInformation, setUserInformation] = useState<UserInformation | null>(null);
  const [accountInformation, setAccountInformation] = useState<AccountInformation | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user_id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      setUserData(data.user);
      setUserInformation(data.userInformation);
      setAccountInformation(data.accountInformation);
      setProjects(data.projects || []);
      setTotalProjects(data.totalProjects || 0);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUserData(undefined);
      setUserInformation(null);
      setAccountInformation(null);
      setProjects([]);
      setTotalProjects(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id]);

  const handleUserUpdated = () => {
    fetchUser();
  };

  if (isLoading) {
    return <UserProfile userId={user_id} userData={undefined} />;
  }

  return <UserProfile userId={user_id} userData={userData} userInformation={userInformation || undefined} accountInformation={accountInformation || undefined} projects={projects} totalProjects={totalProjects} onUserUpdated={handleUserUpdated} />;
}
