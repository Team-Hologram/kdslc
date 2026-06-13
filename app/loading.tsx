export default function Loading() {
  return (
    <main className="siteLoadingShell" role="status" aria-live="polite" aria-label="Loading page">
      <div className="siteLoadingCircle">
        <div className="siteLoadingSpinner" />
        <img src="/logo.png" alt="Logo" className="siteLoadingLogoImg" />
      </div>
    </main>
  );
}
