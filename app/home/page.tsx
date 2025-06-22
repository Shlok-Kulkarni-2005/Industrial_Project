import HomeClient from "./HomeClient";

export default async function HomePage() {
  // Removed all authentication and redirection logic
  const profileImage: string | null = null;
  const username: string | null = "Guest"; // Or some default value

  return <HomeClient profileImage={profileImage} username={username} />;
}
