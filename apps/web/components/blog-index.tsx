"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icon";
import {articleText} from "../lib/article-document";
import { blogTopics, BlogPost, postImage, readingTime, coverPosition } from "../lib/blog";
const topicIcons = [
  "heart",
  "user",
  "pill",
  "lab",
  "medicine",
  "pill",
  "shield",
  "lungs",
  "user",
  "shield",
  "baby",
  "heart",
  "brain",
  "nutrition",
  "tooth",
  "hospital",
];
function PostImage({ post }: { post: BlogPost }) {
  const src = postImage(post);
  return src ? (
    <img src={src} alt={post.data.imageAlt || ""} loading="lazy" style={{objectPosition:coverPosition(post.data.imagePosition)}} />
  ) : (
    <div className="blog-image-placeholder">
      <Icon name="file" size={38} />
      <span>{post.data.category || "Health article"}</span>
    </div>
  );
}
function Meta({ post }: { post: BlogPost }) {
  return (
    <p className="blog-meta">
      <span>
        <Icon name="calendar" size={13} />
        {new Date(post.updated_at).toLocaleDateString("en-AE", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
      <span>
        <Icon name="clock" size={13} />
        {readingTime(post)} min read
      </span>
    </p>
  );
}
export function BlogIndex({
  posts,
  error,
  initialQuery = "",
}: {
  posts: BlogPost[];
  error: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery),
    [search, setSearch] = useState(initialQuery),
    [topic, setTopic] = useState("");
  const topics = [
    ...blogTopics,
    ...Array.from(
      new Set(posts.map((p) => p.data.category).filter(Boolean)),
    ).filter((t) => !blogTopics.includes(t)),
  ];
  const results = posts.filter(
    (p) =>
      (!topic || p.data.category === topic) &&
      `${p.data.title} ${p.data.excerpt || ""} ${p.data.tags || ""} ${articleText(p.data.body||"",p.data.bodyFormat)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const featured = results.filter((p) => p.data.featured === "yes"),
    lead = featured[0] || results[0],
    related = results.filter((p) => p.id !== lead?.id).slice(0, 4);
  return (
    <div className="blog-reference">
      <section className="blog-hero">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Home</Link> › Articles & Health Blog
          </p>
          <div className="blog-hero-grid">
            <div>
              <h1>Health Articles & Guides</h1>
              <h2>Information for a healthier you</h2>
              <p>
                Explore articles on symptoms, conditions, treatments and healthy
                living from our healthcare community.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(query);
                }}
                className="blog-search"
              >
                <span>
                  <Icon name="search" size={19} />
                  <input
                    aria-label="Search articles"
                    placeholder="Search articles"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </span>
                <button className="button">Search Articles</button>
              </form>
            </div>
            <aside>
              <h3>Explore Your Health</h3>
              {[
                "Browse health topics",
                "Read published articles",
                "Find care in Dubai",
                "Learn at your pace",
              ].map((t) => (
                <p key={t}>
                  <span>
                    <Icon name="check" size={13} />
                  </span>
                  {t}
                </p>
              ))}
            </aside>
          </div>
        </div>
      </section>
      <main className="container blog-page">
        <section className="blog-panel">
          <div className="blog-section-heading">
            <h2>Browse Articles by Topic</h2>
            <button
              className="link"
              onClick={() => {
                setTopic("");
                setSearch("");
                setQuery("");
              }}
            >
              View All Topics →
            </button>
          </div>
          <div className="blog-topic-grid">
            {topics.map((t, i) => {
              const count = posts.filter((p) => p.data.category === t).length;
              return (
                <button
                  key={t}
                  className={"blog-topic " + (topic === t ? "selected" : "")}
                  onClick={() => setTopic(topic === t ? "" : t)}
                  aria-pressed={topic === t}
                >
                  <span className={"topic-icon tone-" + (i % 5)}>
                    <Icon name={topicIcons[i % topicIcons.length]} size={27} />
                  </span>
                  <strong>{t}</strong>
                  <small>
                    {count} {count === 1 ? "article" : "articles"}
                  </small>
                </button>
              );
            })}
          </div>
        </section>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {(topic || search) && (
          <div className="blog-filter-summary">
            <strong>
              {results.length} articles {topic && "in " + topic}{" "}
              {search && "matching “" + search + "”"}
            </strong>
            <button
              className="link"
              onClick={() => {
                setTopic("");
                setSearch("");
                setQuery("");
              }}
            >
              Clear filters ×
            </button>
          </div>
        )}
        <div className="blog-main-grid">
          <section className="blog-panel">
            <div className="blog-section-heading">
              <h2>
                {topic || search
                  ? "Articles"
                  : featured.length
                    ? "Featured Articles"
                    : "Recent Articles"}
              </h2>
              <a href="#latest-posts" className="link">
                View All Articles →
              </a>
            </div>
            {lead ? (
              <div className="blog-featured-grid">
                <Link className="blog-lead" href={"/blog/" + lead.id}>
                  <PostImage post={lead} />
                  <span className="tag">{lead.data.category || "Health"}</span>
                  <h2>{lead.data.title}</h2>
                  <p>
                    {lead.data.excerpt || articleText(lead.data.body||"",lead.data.bodyFormat).slice(0, 170) + "…"}
                  </p>
                  <Meta post={lead} />
                </Link>
                <div className="blog-side-list">
                  {related.map((p) => (
                    <Link href={"/blog/" + p.id} key={p.id}>
                      <PostImage post={p} />
                      <div>
                        <span className="tag">
                          {p.data.category || "Health"}
                        </span>
                        <h3>{p.data.title}</h3>
                        <Meta post={p} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="blog-empty">
                <Icon name="file" size={44} />
                <h3>
                  {posts.length
                    ? "No matching articles"
                    : "Your health library starts here"}
                </h3>
                <p>
                  {posts.length
                    ? "Try a different topic or search."
                    : "Published posts will appear here with their cover images. Create your first post from the dashboard."}
                </p>
                <Link
                  className="button"
                  href="/dashboard/admin?tab=posts&new=1"
                >
                  Create a Blog Post
                </Link>
              </div>
            )}
          </section>
          <aside className="blog-right">
            <section className="blog-contribute">
              <span className="topic-icon">
                <Icon name="file" size={30} />
              </span>
              <div>
                <h2>Share Your Health Articles</h2>
                <p>
                  Create an article, add a cover image and preview it before
                  publishing.
                </p>
              </div>
              <Link className="button" href="/dashboard/admin?tab=posts&new=1">
                Write a Blog Post →
              </Link>
            </section>
            <section className="blog-panel">
              <div className="blog-section-heading">
                <h2>Explore Health Topics</h2>
              </div>
              {topics
                .filter((t) => posts.some((p) => p.data.category === t))
                .slice(0, 5)
                .map((t, i) => (
                  <button
                    className="blog-topic-link"
                    onClick={() => setTopic(t)}
                    key={t}
                  >
                    <span>{i + 1}</span>
                    <strong>{t}</strong>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              {!posts.length && (
                <p className="muted">
                  Your published categories will appear here.
                </p>
              )}
              <Link className="blog-care-link" href="/doctors">
                <Icon name="heart" />
                <span>
                  Looking for care?<strong>Find a doctor in Dubai →</strong>
                </span>
              </Link>
            </section>
          </aside>
        </div>
        <section className="blog-panel" id="latest-posts">
          <div className="blog-section-heading">
            <h2>Latest Articles</h2>
            <span className="muted">
              {results.length} published{" "}
              {results.length === 1 ? "article" : "articles"}
            </span>
          </div>
          <div className="blog-latest-grid">
            {results.map((p) => (
              <Link className="blog-card" href={"/blog/" + p.id} key={p.id}>
                <PostImage post={p} />
                <div>
                  <span className="tag">{p.data.category || "Health"}</span>
                  <h3>{p.data.title}</h3>
                  <Meta post={p} />
                </div>
              </Link>
            ))}
          </div>
          {!results.length && (
            <p className="muted">No published articles to display yet.</p>
          )}
        </section>
        <div className="blog-bottom-topics">
          {[
            ["Articles by Health Condition", "Health Conditions", "Symptoms"],
            ["Articles by Treatment", "Treatments", "Procedures"],
            ["Articles by Test", "Tests & Diagnostics"],
          ].map(([heading, ...categories]) => (
            <section className="blog-panel" key={heading}>
              <div className="blog-section-heading">
                <h2>{heading}</h2>
              </div>
              {posts
                .filter((p) => categories.includes(p.data.category))
                .slice(0, 6)
                .map((p) => (
                  <Link
                    className="blog-topic-link"
                    href={"/blog/" + p.id}
                    key={p.id}
                  >
                    <Icon name="heart" size={17} />
                    {p.data.title}
                    <Icon name="chevron" size={15} />
                  </Link>
                ))}
              {!posts.some((p) => categories.includes(p.data.category)) && (
                <p className="muted">
                  Articles in this topic will appear when published.
                </p>
              )}
            </section>
          ))}
        </div>
        <section className="blog-care-banner">
          <div>
            <h2>Need Expert Medical Advice?</h2>
            <p>Find doctors and available appointments in Dubai.</p>
          </div>
          <Link className="button secondary" href="/doctors">
            Find a Doctor Now →
          </Link>
        </section>
      </main>
    </div>
  );
}
