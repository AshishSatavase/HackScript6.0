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
    label: "Analytics",
    href: "/analytics",
    icon: (
      <PieChart className="text-neutral-700 dark:text-neutral-200 hover:text-theme h-5 w-5 flex-shrink-0" />
    ),
  },
 
];
