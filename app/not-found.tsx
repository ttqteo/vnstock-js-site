import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-2 py-16">
      <p className="text-lg font-bold">Không tìm thấy</p>
      <p className="text-[13px] text-muted-foreground">Mã không tồn tại hoặc trang không có.</p>
      <Link href="/" className="text-[13px] text-up hover:underline">Về trang thị trường</Link>
    </div>
  );
}
