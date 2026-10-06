"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, User } from "../lib/client-api";
import { Icon } from "./icon";
import { ArticleContent } from "./article-content";
import { blogTopics } from "../lib/blog";
type Post = { id: string; data: Record<string, string>; updated_at: string };
export function BlogWorkspace({
  user,
  startNew = false,
  onStarted,
}: {
  user: User;
  startNew?: boolean;
  onStarted: () => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]),
    [draft, setDraft] = useState<Record<string, string> | null>(null),
    [id, setId] = useState(""),
    [filter, setFilter] = useState("All"),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [preview, setPreview] = useState(false),
    [dirty, setDirty] = useState(false),
    [cover, setCover] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null),
    uploadRef = useRef<HTMLInputElement>(null);
  const admin = user.role === "admin";
  const load = async () => {
    try {
      setPosts((await api("dashboard/records/articles")).items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (startNew) {
      edit();
      onStarted();
    }
  }, [startNew]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function edit(post?: Post) {
    setId(post?.id || "");
    setDraft(
      post
        ? { ...post.data }
        : {
            title: "",
            author: user.name,
            body: "",
            excerpt: "",
            category: "",
            tags: "",
            imageId: "",
            imageUrl: "",
            imageAlt: "",
            featured: "no",
            status: "Draft",
          },
    );
    setCover(
      post?.data.imageId
        ? `/v1/dashboard/files/${post.data.imageId}`
        : post?.data.imageUrl || "",
    );
    setPreview(false);
    setDirty(false);
    setError("");
    setNotice("");
  }
  function change(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }
  function close() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setDraft(null);
    setDirty(false);
    setError("");
  }
  async function save(status: string) {
    if (!draft) return;
    if (!draft.title?.trim() || !draft.body?.trim()) {
      setError("Enter a title and article content before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api(
        "dashboard/records/articles" + (id ? "/" + id : ""),
        id ? "PATCH" : "POST",
        { ...draft, status },
      );
      const post = result.item || result.record || result;
      setId(post.id);
      setDraft(post.data || { ...draft, status });
      setDirty(false);
      setNotice(
        status === "Published"
          ? "Post published. It is now visible on the public blog."
          : status === "Pending"
            ? "Post submitted for administrator review."
            : "Draft saved. You can return to edit it later.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 1048576
    ) {
      setError("Choose a PNG or JPEG image up to 1 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const r = await api("dashboard/files", "POST", {
        name: file.name,
        type: file.type,
        content: data.split(",")[1],
      });
      setDraft((d) => ({ ...d, imageId: r.id, imageUrl: "" }));
      setCover(data);
      setDirty(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }
  function format(before: string, after = "") {
    const field = bodyRef.current;
    if (!field || !draft) return;
    const { selectionStart: start, selectionEnd: end } = field;
    change(
      "body",
      draft.body.slice(0, start) +
        before +
        draft.body.slice(start, end) +
        after +
        draft.body.slice(end),
    );
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + before.length, end + before.length);
    });
  }
  const shown = posts.filter(
    (p) =>
      (filter === "All" || p.data.status === filter) &&
      `${p.data.title} ${p.data.category} ${p.data.author}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section className="blog-workspace">
      <div className="post-heading">
        <div>
          <span className="eyebrow">CONTENT STUDIO</span>
          <h2>
            {draft
              ? id
                ? "Edit Blog Post"
                : "Create Blog Post"
              : "Blog Posts"}
          </h2>
          <p className="muted">
            {draft
              ? "Write, preview and share your article."
              : "Manage your articles, drafts and submissions."}
          </p>
        </div>
        {draft ? (
          <button className="button secondary" disabled={busy} onClick={close}>
            Back to posts
          </button>
        ) : (
          <button className="button" onClick={() => edit()}>
            <Icon name="file" /> Add Blog Post
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="post-success">
          {notice}{" "}
          {id && draft?.status === "Published" && (
            <Link href={"/blog/" + id}>View published post →</Link>
          )}
        </p>
      )}
      {!draft ? (
        <>
          <div className="post-controls">
            <div className="tabs">
              {["All", "Draft", "Pending", "Published"].map((s) => (
                <button
                  key={s}
                  className={filter === s ? "active" : ""}
                  onClick={() => setFilter(s)}
                >
                  {s === "Pending" ? "In Review" : s}{" "}
                  <span>
                    {
                      posts.filter((p) => s === "All" || p.data.status === s)
                        .length
                    }
                  </span>
                </button>
              ))}
            </div>
            <input
              className="field"
              placeholder="Search posts"
              aria-label="Search posts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="card empty">Loading posts…</div>
          ) : shown.length ? (
            <div className="post-list">
              {shown.map((p) => (
                <article className="post-list-row" key={p.id}>
                  <div className="post-thumb">
                    {p.data.imageId || p.data.imageUrl ? (
                      <img
                        src={
                          p.data.imageId
                            ? `/v1/dashboard/files/${p.data.imageId}`
                            : p.data.imageUrl
                        }
                        alt={p.data.imageAlt || ""}
                      />
                    ) : (
                      <Icon name="file" />
                    )}
                  </div>
                  <div>
                    <span className="tag">
                      {p.data.category || "Uncategorized"}
                    </span>
                    <h3>{p.data.title}</h3>
                    <p className="muted">
                      {p.data.author || user.name} ·{" "}
                      {new Date(p.updated_at).toLocaleDateString("en-AE")}
                    </p>
                  </div>
                  <span
                    className={
                      "badge " +
                      (p.data.status === "Published" ? "" : "pending")
                    }
                  >
                    {p.data.status === "Pending"
                      ? "In Review"
                      : p.data.status || "Draft"}
                  </span>
                  <div className="row">
                    <button
                      className="button secondary small"
                      onClick={() => edit(p)}
                    >
                      Edit Post
                    </button>
                    {p.data.status === "Published" && (
                      <Link className="table-action" href={"/blog/" + p.id}>
                        View
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card post-empty">
              <Icon name="file" />
              <h3>
                {posts.length
                  ? "No matching posts"
                  : "Your first article starts here"}
              </h3>
              <p className="muted">
                Add a cover image, write your story, then save a draft or
                publish it.
              </p>
              <button className="button" onClick={() => edit()}>
                Create Blog Post
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="post-editor-layout">
            <div className="post-editor-main">
              <section className="card">
                <div className="post-section-head">
                  <h3>Article Content</h3>
                  <div className="tabs">
                    <button
                      className={!preview ? "active" : ""}
                      onClick={() => setPreview(false)}
                    >
                      Write
                    </button>
                    <button
                      className={preview ? "active" : ""}
                      onClick={() => setPreview(true)}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                {preview ? (
                  <article className="post-preview">
                    {cover && (
                      <img
                        className="post-cover"
                        src={cover}
                        alt={draft.imageAlt || ""}
                      />
                    )}
                    <span className="tag">{draft.category || "Health"}</span>
                    <h1>{draft.title || "Your article title"}</h1>
                    <p className="muted">By {draft.author || user.name}</p>
                    <p>{draft.excerpt}</p>
                    <ArticleContent
                      body={draft.body || "Your article preview appears here."}
                    />
                  </article>
                ) : (
                  <>
                    <input
                      className="field post-title-input"
                      aria-label="Post title"
                      placeholder="Post title"
                      maxLength={500}
                      value={draft.title || ""}
                      onChange={(e) => change("title", e.target.value)}
                    />
                    <textarea
                      className="field"
                      aria-label="Short summary"
                      placeholder="Short summary"
                      rows={3}
                      maxLength={12000}
                      value={draft.excerpt || ""}
                      onChange={(e) => change("excerpt", e.target.value)}
                    />
                    <div className="post-toolbar" aria-label="Text formatting">
                      <button
                        onClick={() => format("**", "**")}
                        title="Bold text"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        onClick={() => format("\n\n## ")}
                        title="Section heading"
                      >
                        H2
                      </button>
                      <button
                        onClick={() => format("\n\n- ")}
                        title="Bullet list"
                      >
                        • List
                      </button>
                      <span>
                        {
                          (draft.body || "").trim().split(/\s+/).filter(Boolean)
                            .length
                        }{" "}
                        words
                      </span>
                    </div>
                    <textarea
                      ref={bodyRef}
                      className="field post-body-input"
                      aria-label="Article content"
                      placeholder="Write your article"
                      maxLength={12000}
                      value={draft.body || ""}
                      onChange={(e) => change("body", e.target.value)}
                    />
                    <p className="muted small">
                      Use blank lines for paragraphs, ## for headings, and
                      **bold** for emphasis.
                    </p>
                  </>
                )}
              </section>
            </div>
            <aside className="post-editor-aside">
              <section className="card">
                <h3>Publishing</h3>
                <p className="muted">
                  {dirty
                    ? "Unsaved changes"
                    : id
                      ? "All changes saved"
                      : "New draft"}
                </p>
                <input
                  className="field"
                  aria-label="Author name"
                  placeholder="Author name"
                  maxLength={500}
                  value={draft.author || ""}
                  onChange={(e) => change("author", e.target.value)}
                />
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => save("Draft")}
                >
                  {busy ? "Saving…" : "Save Draft"}
                </button>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => save(admin ? "Published" : "Pending")}
                >
                  {busy
                    ? "Please wait…"
                    : admin
                      ? draft.status === "Published"
                        ? "Update Published Post"
                        : "Publish Post"
                      : "Submit for Review"}
                </button>
                <p className="muted small">
                  {admin
                    ? "Published posts appear immediately on the public blog."
                    : "An administrator reviews submissions before publication."}
                </p>
              </section>
              <section className="card">
                <h3>Cover Image</h3>
                <button
                  className="post-cover-picker"
                  disabled={busy}
                  onClick={() => uploadRef.current?.click()}
                >
                  {cover ? (
                    <img src={cover} alt={draft.imageAlt || "Selected cover"} />
                  ) : (
                    <>
                      <Icon name="file" />
                      <span>Upload cover image</span>
                      <small>PNG or JPEG · up to 1 MB</small>
                    </>
                  )}
                </button>
                <input
                  ref={uploadRef}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg"
                  aria-label="Upload cover image"
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
                {cover && (
                  <button
                    className="table-action"
                    onClick={() => {
                      change("imageId", "");
                      change("imageUrl", "");
                      setCover("");
                    }}
                  >
                    Remove image
                  </button>
                )}
                <input
                  className="field"
                  aria-label="Image URL"
                  placeholder="Image URL"
                  type="url"
                  value={draft.imageUrl || ""}
                  onChange={(e) => {
                    change("imageUrl", e.target.value);
                    change("imageId", "");
                    setCover(e.target.value);
                  }}
                />
                <input
                  className="field"
                  aria-label="Image description"
                  placeholder="Image description"
                  maxLength={500}
                  value={draft.imageAlt || ""}
                  onChange={(e) => change("imageAlt", e.target.value)}
                />
              </section>
              <section className="card">
                <h3>Organization</h3>
                <input
                  className="field"
                  list="blog-topics"
                  aria-label="Post category"
                  placeholder="Post category"
                  maxLength={500}
                  value={draft.category || ""}
                  onChange={(e) => change("category", e.target.value)}
                />
                <datalist id="blog-topics">
                  {blogTopics.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <input
                  className="field"
                  aria-label="Tags, comma separated"
                  placeholder="Tags, comma separated"
                  maxLength={500}
                  value={draft.tags || ""}
                  onChange={(e) => change("tags", e.target.value)}
                />
                <select
                  className="field"
                  aria-label="Featured placement"
                  value={draft.featured || "no"}
                  onChange={(e) => change("featured", e.target.value)}
                >
                  <option value="no">Standard post</option>
                  <option value="yes">Featured post</option>
                </select>
              </section>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
