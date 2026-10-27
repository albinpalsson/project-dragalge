export const FEEDBACK_EMAIL = 'feedback@paldeanuzlocke.com';
export const GITHUB_REPO_URL = 'https://github.com/albinpalsson/project-dragalge';
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues/new`;

export function buildMailto(subject: string, body?: string): string {
    const params = [`subject=${encodeURIComponent(subject)}`];
    if (body !== undefined) {
        params.push(`body=${encodeURIComponent(body)}`);
    }
    return `mailto:${FEEDBACK_EMAIL}?${params.join('&')}`;
}
