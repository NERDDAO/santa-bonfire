import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="text-8xl mb-8">🎄</div>
      <h1 className="text-4xl font-bold font-serif mb-4">Page Not Found</h1>
      <p className="text-xl text-base-content/70 mb-8 max-w-md">
        Oops! This page got lost in the snow. Let&apos;s get you back to Santa&apos;s Workshop.
      </p>
      <Link href="/" className="btn btn-primary btn-lg gap-2">
        🎅 Return to Workshop
      </Link>
    </div>
  );
}

