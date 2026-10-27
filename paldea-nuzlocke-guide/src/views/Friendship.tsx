import { css } from '@project-dragalge/css-in-js';
import { FriendshipGuide } from '../components/FriendshipGuide';

export function Friendship() {
    return (
        <section className={page}>
            <h2>Friendship mechanics</h2>
            <FriendshipGuide />
        </section>
    );
}

const page = css`
    width: 100%;

    h2 {
        margin: 0 0 var(--space-4);
    }
`;
