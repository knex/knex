import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POSTS_PER_PAGE } from '../blog.constants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsRootDir = path.resolve(__dirname, '..', 'posts');

function listPostFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listPostFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === 'index.md') {
      files.push(fullPath);
    }
  }

  return files;
}

function isDraftPost(filePath: string): boolean {
  const source = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!frontmatterMatch) {
    return false;
  }

  return /(?:^|\n)\s*draft\s*:\s*true\s*(?:\n|$)/i.test(frontmatterMatch[1]);
}

function countPublishedPosts() {
  return listPostFiles(postsRootDir).filter((filePath) => !isDraftPost(filePath)).length;
}

export default {
  paths() {
    const publishedPostCount = countPublishedPosts();
    const totalPages = Math.max(1, Math.ceil(publishedPostCount / POSTS_PER_PAGE));
    const paths = [];

    for (let page = 2; page <= totalPages; page += 1) {
      paths.push({
        params: {
          page: String(page),
        },
      });
    }

    return paths;
  },
};
