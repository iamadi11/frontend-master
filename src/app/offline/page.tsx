export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
