const POSTS_PER_PAGE = 10;

function resolveBlogPageLink(pageNumber: number) {
  if (pageNumber <= 1) {
    return '/blog/';
  }
  return `/blog/page/${pageNumber}`;
}

export { POSTS_PER_PAGE, resolveBlogPageLink };
