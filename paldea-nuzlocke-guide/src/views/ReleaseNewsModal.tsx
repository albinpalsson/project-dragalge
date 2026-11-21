import { css, cx } from '@project-dragalge/css-in-js';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { textLink } from '../components/text-link';
import type { ReleaseNewsDismissal } from '../analytics/events';
import type { ReleaseNews } from '../release-news';
import type { ActiveView } from '../router';

interface ReleaseNewsModalProps {
    news: readonly ReleaseNews[];
    // Called with the highest number shown when the popup is dismissed in any way.
    onAcknowledge: (newsNumber: number, via: ReleaseNewsDismissal) => void;
    onNavigate: (view: ActiveView) => void;
}

// Shows all pending news at once: acknowledging the highest number retires
// everything below it, so nothing may be held back for later.
export function ReleaseNewsModal({
    news,
    onAcknowledge,
    onNavigate,
}: ReleaseNewsModalProps) {
    const shownThrough = Math.max(...news.map((item) => item.number));
    const dismiss = (via: ReleaseNewsDismissal) =>
        onAcknowledge(shownThrough, via);

    return (
        <Modal title="What's new" onClose={() => dismiss('close')}>
            <div className={content}>
                {news.map(({ number, title, paragraphs, action, link }) => (
                    <section
                        key={number}
                        className={newsItem}
                        aria-labelledby={`release-news-${number}`}
                    >
                        <h3 id={`release-news-${number}`}>{title}</h3>
                        {paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        {(action || link) && (
                            <div className={links}>
                                {action && (
                                    <button
                                        type="button"
                                        className={textLink}
                                        onClick={() => {
                                            dismiss('action');
                                            onNavigate(action.view);
                                        }}
                                    >
                                        {action.label}
                                    </button>
                                )}
                                {link && (
                                    <a
                                        className={cx(textLink, quietLink)}
                                        href={link.href}
                                    >
                                        {link.label}
                                    </a>
                                )}
                            </div>
                        )}
                    </section>
                ))}
                <Button className={gotIt} onClick={() => dismiss('acknowledge')}>
                    Got it
                </Button>
            </div>
        </Modal>
    );
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-2);
`;

const newsItem = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  h3,
  p {
    margin: 0;
  }

  /* Quieter than the modal title, but set off from the text below it: body
     size in the full text colour, over paragraphs in the secondary colour. */
  h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
  }

  p {
    color: var(--color-text-secondary);
  }
`;

const links = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
`;

const quietLink = css`
  && {
    font-weight: normal;
  }
`;

const gotIt = css`
  align-self: flex-end;
`;
