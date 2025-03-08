import { Home, PieChart, Video } from "lucide-react";

export const Links = [
  {
    label: "Home",
    href: "/home",
    icon: (
      <Home className="text-neutral-700 dark:text-neutral-200 hover:text-theme h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Charts",
    href: "/charts",
    icon: (
      <PieChart className="text-neutral-700 dark:text-neutral-200 hover:text-theme h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "VideoChat",
    href: "/webrtc",
    icon: (
      <Video className="text-neutral-700 dark:text-neutral-200 hover:text-theme h-5 w-5 flex-shrink-0" />
    ),
  },
];
