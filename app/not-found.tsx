import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-sm text-muted-foreground">{PRODUCT_NAME}</p>
      <h1 className="mt-2 font-serif text-4xl">This page is not on the desk.</h1>
      <Link href="/en" className="mt-6 text-sm text-primary underline-offset-4 hover:underline">
        Back to the front
      </Link>
    </main>
  );
}
