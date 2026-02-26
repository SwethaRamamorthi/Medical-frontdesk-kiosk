export default function LoadingSpinner({ label = 'Loading…' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-16" style={{ padding: '48px' }}>
            <div className="spinner" />
            <p className="text-muted">{label}</p>
        </div>
    );
}
