(async () => {
  const el = (tag, text) => {
    const n = document.createElement(tag);
    n.textContent = text || "";
    return n;
  };
  async function load(kind, slug) {
    const r = await fetch(
      "/v1/content/" + kind + (slug ? "?slug=" + encodeURIComponent(slug) : ""),
    );
    if (!r.ok) throw Error("Content temporarily unavailable");
    return (await r.json()).items;
  }
  const page = document.getElementById("cms-content");
  if (page) {
    try {
      const params = new URLSearchParams(location.search),
        kind = params.get("kind") === "articles" ? "articles" : "pages";
      const rows = await load(kind, params.get("slug")),
        r = rows.find((r) => !params.get("id") || r.id === params.get("id"));
      if (!r) throw Error("This content is unavailable or unpublished");
      page.replaceChildren(el("h1", r.data.title));
      document.title = r.data.title + " | Find Doctor Dubai";
      if (r.data.imageUrl) {
        const image = el("img");
        image.src = r.data.imageUrl;
        image.alt = r.data.title;
        image.style.cssText = "max-width:100%;border-radius:12px;margin:20px 0";
        page.append(image);
      }
      const body = el("div", r.data.body);
      body.style.cssText =
        "white-space:pre-wrap;line-height:1.85;margin-top:24px";
      page.append(body);
    } catch (e) {
      page.textContent = e.message;
    }
    return;
  }
  // Published CMS entries update the original homepage; drafts and private records never enter this API.
  const result = await Promise.allSettled(
    ["articles", "faqs", "banners", "pages"].map((k) => load(k)),
  );
  for (let i = 0; i < result.length; i++) {
    if (result[i].status !== "fulfilled" || !result[i].value.length) continue;
    const rows = result[i].value;
    if (i === 0) {
      const grid = document.querySelector("#guides .grid-4");
      if (grid) {
        grid.replaceChildren();
        for (const r of rows.slice(0, 8)) {
          const card = el("article");
          card.className = "blog-card";
          const body = el("div");
          body.className = "blog-body";
          body.append(
            el("small", r.data.category),
            el("h3", r.data.title),
            el("p", r.data.body.slice(0, 160)),
          );
          const link = el("a", "Read article →");
          link.href = "content.html?kind=articles&id=" + r.id;
          body.append(link);
          card.append(body);
          grid.append(card);
        }
      }
    }
    if (i === 1) {
      const section = document.querySelector("#faq");
      if (section) {
        section.querySelectorAll(".faq-item").forEach((n) => n.remove());
        const target = section.querySelector(".faq") || section;
        for (const r of rows) {
          const d = el("details");
          d.className = "faq-item";
          d.style.padding = "16px";
          d.append(el("summary", r.data.question), el("p", r.data.answer));
          target.append(d);
        }
      }
    }
    if (i === 2) {
      const box = el("section");
      box.style.cssText =
        "max-width:1200px;padding:20px;margin:auto;display:flex;gap:16px;flex-wrap:wrap";
      for (const r of rows) {
        const a = el("a");
        a.href = r.data.link || "#";
        const img = el("img");
        img.src = r.data.imageUrl;
        img.alt = r.data.title;
        img.style.cssText = "width:100%;max-width:550px;border-radius:12px";
        a.append(img);
        box.append(a);
      }
      document.querySelector("main")?.prepend(box);
    }
    if (i === 3) {
      const foot = document.querySelector("footer");
      if (foot) {
        const nav = el("nav");
        nav.style.cssText = "display:flex;gap:20px;padding:20px;flex-wrap:wrap";
        nav.setAttribute("aria-label", "Published pages");
        for (const r of rows) {
          const a = el("a", r.data.title);
          a.href = "content.html?slug=" + encodeURIComponent(r.data.slug);
          nav.append(a);
        }
        foot.prepend(nav);
      }
    }
  }
})();
