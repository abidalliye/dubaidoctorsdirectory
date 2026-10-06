import { Fragment } from "react";
export function ArticleContent({ body }: { body: string }) {
  const inline = (text: string) =>
    text
      .split(/(\*\*[^*]+\*\*)/g)
      .map((s, i) =>
        s.startsWith("**") ? (
          <strong key={i}>{s.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{s}</Fragment>
        ),
      );
  return (
    <div className="article-prose">
      {body
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) =>
          block.startsWith("## ") ? (
            <h2 key={i}>{inline(block.slice(3))}</h2>
          ) : block.startsWith("### ") ? (
            <h3 key={i}>{inline(block.slice(4))}</h3>
          ) : block.split("\n").every((s) => s.startsWith("- ")) ? (
            <ul key={i}>
              {block.split("\n").map((s, j) => (
                <li key={j}>{inline(s.slice(2))}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{inline(block)}</p>
          ),
        )}
    </div>
  );
}
