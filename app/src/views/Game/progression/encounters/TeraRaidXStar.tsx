import { TeraRaid } from './TeraRaid';

interface TeraRaid1StarProps {
    isNext?: boolean;
}

export function TeraRaid1Star({ isNext }: TeraRaid1StarProps) {
    return <TeraRaid stars={1} isNext={isNext} zoomedIcon />;
}
