---
title: Knex, the Garden, and the Long Road Back
date: 2026-03-23T00:00:00+08:00
summary: Where is Knex now, and where we want to take it; a quick recap about the status of the project and where it's going.
---

# Knex, the Garden, and the Long Road Back

Knex as a project has been around for a long time. Development started in 2013, when JavaScript still didn’t have classes, `let`/`const`, arrow functions, template literals, destructuring, modules, native Promises, or `async`/`await`. It's free software; so, development sometimes tends to happen in cycles where intense development is followed by periods of lighter activity. That’s a normal and healthy -- and in fact this is even true for commercial software, the differce being the lack of funding (commercial software) rather than the lack of contributors (free software).

After a period of lighter activity, knex is now is in a period of much more intense development. This article is to share what has been done so far, and what we have planned for the near future.

## What we did

The most glaring advancement in the last few months has been the work on the issue backlog. Knex had 1,079 open issues, and many of them were duplicate or irrelevant.

This required going through each one of the 1,079 open issues, working on categorization, deduplication, and adding an AI write‑up to provide a starting point for when we would come back to them. The write up was also helpful to see if original posters were still interested in Knex. In some cases, it had been _years_ since submission or the last comment! It was a lot of tedious work. Each issue had to be faced individually, and we never knew what we would find: a simple bug, or something that required major architectural changes. It was disheartening at times, especially since each issue was only a tiny step towards the top of the mountain we had to climb.

## Where we are now

Tidying up the issues gave us a much clearer picture of the work ahead. We now have a much better understanding of what needs to be done. However, the priority was the other elephant in the room: pending PRs. We couldn't go ahead with making changes to the codebase ignoring the existing PRs, since some of the PR work was very valuable, and the more work was done to the codebase, the harder it would become to actually merge them.

This is what we are up to now; for each PR, we are deciding what to do: review and merge them, close them, or close them and turn them into issues depending on their state and value. We have already made a significant dent in the PR backlog, but there are still many to go through.

## The work ahead

The next stage is to go through the issues marked as “bug” and fix them. This is a crucial step, because it will help us stabilize the codebase making sure that Knex always does what it's expected to do. Good software is software that works, and we want to make sure that Knex is reliable and trustworthy for all the teams that depend on it.

In some cases, the bug fixes will be simple and straightforward. In other cases, they will require more work, and may even require changes to the architecture of Knex. But we are committed to getting through them all, and making sure that Knex is as solid as it can be.

## Further down the track

Once all of the bugs are sorted out or recategorised as part of wider refactoring, it will be a matter of going through existing issues while improving the overall structure of Knex. We haven't decided on a plan of action; however, the current consensus amongst maintainers is to work on existing issues as well as making design improvements which will melt away several issues.

## A “Side Project” That Mattered

One side project we took on while working through PRs was a drastic improvement of the website. As maintainers, we felt that it was important for the documentation to show developers exactly what it Knex _does_. So we updated the documentation to include the actual SQL Knex generates for each dialect, both for query building and schema building.

The schema work was especially tricky. The only reliable way to know what Knex actually did was to run the schema changes shown in the documentation. That took a lot of time, but the result is documentation that shows Knex as it truly is. The end result is revealing, in terms of how amazing and useful Knex actually is, and how much work went behind the scenes to consider every edge case.

The new documentation site helped answer one fundamental question: what is Knex, really?

## Where We Are Now

As we go through PRs, we need all the help we can get. There is still a lot to review, still a lot to test, and still a lot to decide. But we now have a path forward and a clearer sense of the work ahead.

Great things are ahead for Knex: much improved TypeScript support, better dialect‑specific query generation, more consistency in the API itself, and a clearer story for long‑term maintenance. But these will only happen once the issue list is under control and the foundation is solid again.

It’s been a tough journey, but also a very rewarding one. Knex deserves to thrive, and we’re committed to getting it there.
