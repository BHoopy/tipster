interface TeamsWithVsProps {
  teams: string;
  vertical?: boolean;
}

export default function TeamsWithVs({ teams, vertical }: TeamsWithVsProps) {
  const parts = teams.split(/ vs /i);
  if (parts.length < 2) {
    return <>{teams}</>;
  }

  if (vertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', lineHeight: 1.2 }}>
        <span>{parts[0]}</span>
        <img src="/vs.svg" alt="VS" style={{ height: '14px', width: 'auto' }} />
        <span>{parts[1]}</span>
      </div>
    );
  }

  return (
    <>
      {parts.map((part, i) =>
        i > 0 ? (
          <span key={i}>
            <img src="/vs.svg" alt="VS" style={{ height: '16px', width: 'auto', margin: '0 0.25rem', verticalAlign: 'middle' }} />
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
