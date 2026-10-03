import { TeraRaid } from './TeraRaid';

interface TeraRaid2StarProps {
    isNext?: boolean;
}

export function TeraRaid2Star({ isNext }: TeraRaid2StarProps) {
    return <TeraRaid stars={2} isNext={isNext} zoomedIcon />;
}