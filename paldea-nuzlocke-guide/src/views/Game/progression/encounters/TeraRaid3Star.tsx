import { TeraRaid } from './TeraRaid';

interface TeraRaid3StarProps {
    isNext?: boolean;
}

export function TeraRaid3Star({ isNext }: TeraRaid3StarProps) {
    return <TeraRaid stars={3} isNext={isNext} />;
}
