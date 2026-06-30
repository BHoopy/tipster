import { LuHistory as History } from 'react-icons/lu';
import { GroupedTips, GroupedTickets } from '@/types/game';
import NoTipsMessage from './NoTipsMessage';
import FreeTipsList from './FreeTipsList';
import VipTicketsList from './VipTicketsList';

interface HistorySectionProps {
    type: 'free' | 'vip';
    data: GroupedTips[] | GroupedTickets[];
}

export default function HistorySection({ type, data }: HistorySectionProps) {
    if (data.length === 0) return <NoTipsMessage />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {data.map((group) => (
                <div key={group.date}>
                    <h3 style={{
                        fontSize: '1rem',
                        marginBottom: '0.75rem',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <History size={16} />
                        Previous Picks - {group.dateLabel}
                    </h3>
                    {type === 'free'
                        ? <FreeTipsList data={(group as GroupedTips).matches} />
                        : <VipTicketsList tickets={(group as GroupedTickets).tickets} />
                    }
                </div>
            ))}
        </div>
    );
}
