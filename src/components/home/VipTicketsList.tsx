import { VipTicket } from '@/types/game';
import NoTipsMessage from './NoTipsMessage';
import VipTicketCard from './VipTicketCard';

interface VipTicketsListProps {
    tickets: VipTicket[];
}

export default function VipTicketsList({ tickets }: VipTicketsListProps) {
    if (tickets.length === 0) return <NoTipsMessage />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {tickets.map((ticket) => (
                <VipTicketCard key={ticket.id} ticket={ticket} />
            ))}
        </div>
    );
}
