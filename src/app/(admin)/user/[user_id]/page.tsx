"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UserProfile from "../profile";
import { getUserById, type User } from "@/services/userService";

export default function UserProfilePage() {
  const params = useParams();
  const user_id = params.user_id as string;
  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [userInformation, setUserInformation] = useState<any>(null);
  const [accountInformation, setAccountInformation] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
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

  return <UserProfile userId={user_id} userData={userData} userInformation={userInformation} accountInformation={accountInformation} projects={projects} totalProjects={totalProjects} onUserUpdated={handleUserUpdated} />;
}
