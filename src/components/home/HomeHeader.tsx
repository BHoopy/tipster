export default function HomeHeader() {
    return (
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.03em' }}>
                Winning Starts Here
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto', opacity: 0.8 }}>
                Most accurate football predictions and expert-vetted VIP ticket bundles daily.
            </p>
        </div>
    );
}
