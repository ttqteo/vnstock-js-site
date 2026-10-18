export interface NavItem {
  href: string;
  label: string;
}

/** Top-level sections. Cơ hội and Phân tích join when their pages exist. */
export const NAV: NavItem[] = [
  { href: "/", label: "Thị trường" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/bieu-do", label: "Biểu đồ" },
  { href: "/danh-muc", label: "Danh mục" },
  { href: "/tin-tuc", label: "Tin tức" },
];

/** href of the section the path belongs to, null when it belongs to none. */
export function activeNav(pathname: string): string | null {
  if (pathname === "/") return "/";
  for (const item of NAV) {
    if (item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/"))) return item.href;
  }
  return null;
}
