import { createContentLoader } from 'vitepress';
import { formatUtcDate } from './date';

type BlogPost = {
  title: string;
  date: string;
  dateUtc: string;
  summary: string;
  url: string;
  timestamp: number;
};

function toText(value: unknown) {
  return String(value ?? '').trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function resolveTimestamp(value: string, url: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Blog post "${url}" has invalid frontmatter date: "${value}"`);
  }
  return timestamp;
}

function resolveDraftFlag(value: unknown) {
  if (value === true) {
    return true;
  }
  return toText(value).toLowerCase() === 'true';
}

export type { BlogPost };

export default createContentLoader('blog/posts/**/index.md', {
  excerpt: true,
  transform(rawData) {
    return rawData
      .filter((item) => !resolveDraftFlag(item.frontmatter?.draft))
      .map((item) => {
        const title = toText(item.frontmatter?.title);
        if (!title) {
          throw new Error(`Blog post "${item.url}" is missing frontmatter title.`);
        }

        const date = toText(item.frontmatter?.date);
        if (!date) {
          throw new Error(`Blog post "${item.url}" is missing frontmatter date.`);
        }

        const timestamp = resolveTimestamp(date, item.url);
        const summary = toText(item.frontmatter?.summary) || stripHtml(item.excerpt || '') || 'Read the full post.';

        return {
          title,
          date,
          dateUtc: formatUtcDate(timestamp),
          summary,
          url: item.url,
          timestamp,
        } satisfies BlogPost;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  },
});
