import { TeraRaid } from './TeraRaid';

interface TeraRaid4StarProps {
    isNext?: boolean;
}

export function TeraRaid4Star({ isNext }: TeraRaid4StarProps) {
    return <TeraRaid stars={4} isNext={isNext} />;
}
