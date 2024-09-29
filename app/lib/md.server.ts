import fm from "front-matter";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeShiki from "@shikijs/rehype/core";
import { createHighlighterCore, HighlighterGeneric } from "shiki/core";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import { h, s } from "hastscript";
import { visit } from "unist-util-visit";
import type { Root } from "hast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CodeMeta = Record<string, any>;

async function createProcessor() {
  const highlighter = (await createHighlighterCore({
    themes: [
      import("shiki/themes/github-light.mjs"),
      import("shiki/themes/dracula.mjs"),
    ],
    langs: [
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/jsx.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/jsonc.mjs"),
      import("shiki/langs/shell.mjs"),
      import("shiki/langs/diff.mjs"),
    ],
    loadWasm: import("shiki/wasm"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as HighlighterGeneric<any, any>;
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShiki, highlighter, {
      themes: {
        light: "github-light",
        dark: "dracula",
      },
      transformers: [
        {
          preprocess() {
            const meta = this.options.meta?.__raw;
            if (meta) {
              const parsedMeta: CodeMeta = {};
              meta
                .split(" ")
                .map((attr) => attr.split("="))
                .forEach(([key, value]) => {
                  parsedMeta[key] = value;
                });
              if (parsedMeta.lines) {
                const lines: Set<number> = new Set();
                (parsedMeta.lines as string)
                  .slice(1, -1)
                  .split(",")
                  .forEach((line) => {
                    const parts = line.split("-").map(Number);
                    const start = parts[0];
                    const end = parts[1] || start;
                    for (let i = start; i <= end; i++) {
                      lines.add(i);
                    }
                  });
                parsedMeta.lines = lines;
              }
              this.meta = parsedMeta;
            }
          },
          pre(node) {
            const meta = this.meta as CodeMeta;
            if (meta.filename) {
              node.properties["data-filename"] = meta.filename;
            }
            const styles = (node.properties.style as string).split(";");
            const excluded = ["background-color", "--shiki-dark-bg"];
            node.properties.style = styles
              .filter((style) => {
                const [property] = style.split(":");
                return !excluded.includes(property);
              })
              .join(";");
          },
          line(node, line) {
            const meta = this.meta as CodeMeta;
            if (!meta || !("nonumber" in meta)) {
              // Default to showing line numbers
              node.properties["data-line"] = line;
            }
            const lines = meta?.lines;
            if (lines && lines.has(line)) {
              this.addClassToHast(node, "highlight");
            }
          },
        },
      ],
    })
    .use(() => {
      return (tree: Root) => {
        const copySvg = s(
          "svg",
          {
            className: "copy",
            viewBox: "0 0 1024 1024",
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
          },
          [
            s("path", {
              d: "M768 682.666667V170.666667a85.333333 85.333333 0 0 0-85.333333-85.333334H170.666667a85.333333 85.333333 0 0 0-85.333334 85.333334v512a85.333333 85.333333 0 0 0 85.333334 85.333333h512a85.333333 85.333333 0 0 0 85.333333-85.333333zM170.666667 170.666667h512v512H170.666667z m682.666666 85.333333v512a85.333333 85.333333 0 0 1-85.333333 85.333333H256a85.333333 85.333333 0 0 0 85.333333 85.333334h426.666667a170.666667 170.666667 0 0 0 170.666667-170.666667V341.333333a85.333333 85.333333 0 0 0-85.333334-85.333333z",
            }),
          ]
        );
        const checkedSvg = s(
          "svg",
          {
            className: "checked",
            viewBox: "0 0 1024 1024",
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
          },
          [
            s("path", {
              d: "M677.840584 333.048305l57.882292 59.672054L504.146637 631.452579l-57.882292 59.672054-57.926294-59.672054 0.173962-0.261966-100.237959-104.33937 57.882292-59.672054 100.281961 104.33937L677.840584 333.048305zM958.70846 243.934708l0 535.9996c0 98.711186-80.08599 178.709171-178.711218 178.709171L243.998665 958.64348c-98.711186 0-178.709171-79.997985-178.709171-178.709171L65.289494 243.934708c0-98.625228 79.997985-178.579211 178.709171-178.579211l535.998577 0C878.62247 65.355497 958.70846 145.30948 958.70846 243.934708zM869.286848 288.687982c0-74.067926-59.932997-134.042879-133.910872-134.042879L288.623002 154.645103c-73.979922 0-134.000923 59.974953-134.000923 134.042879l0 446.577988c0 74.023924 60.021002 134.086881 134.000923 134.086881l446.752973 0c73.977875 0 133.910872-60.062957 133.910872-134.086881L869.286848 288.687982z",
            }),
          ]
        );
        const copyBtn = h("button", { className: "copy-btn" }, [
          copySvg,
          checkedSvg,
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visit(tree as any, "element", (node) => {
          if (node.tagName === "pre") {
            node.children.push(copyBtn);
          }
        });
      };
    })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(() => {
      return (tree: Root) => {
        const children = tree.children;
        const navList: typeof children = [];
        visit(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tree as any,
          "element",
          (node) => {
            if (
              node.type === "element" &&
              node.tagName.startsWith("h") &&
              node.properties.id
            ) {
              const cloned = JSON.parse(JSON.stringify(node));
              cloned.properties = {
                "data-id": node.properties.id,
                "data-level": node.tagName[1],
              };
              cloned.tagName = "span";
              navList.push(cloned);
              navList.push(h("br"));
            }
          }
        );
        if (navList.length) {
          navList.pop();
        }
        children.unshift(h("nav", navList));
      };
    })
    .use(rehypeAutolinkHeadings)
    .use(rehypeStringify);
}

let processor: Awaited<ReturnType<typeof createProcessor>> | null = null;

async function requireProcessor() {
  if (!processor) {
    processor = await createProcessor();
  }
  return processor;
}

export async function markdownToHtml(markdown: string) {
  const { body } = fm<Record<string, string>>(markdown);
  const processor = await requireProcessor();
  const file = await processor.process({
    path: "/markdown.md",
    cwd: "",
    value: body,
  });
  const content = String(file);
  const navEndIndex = content.indexOf("</nav>");
  const navInnerHtml = content.slice(5, navEndIndex);
  const navList = navInnerHtml ? navInnerHtml.split("<br>") : [];
  const contentHtml = content.slice(navEndIndex + 6);
  return {
    navList,
    html: contentHtml,
  };
}

export type MarkdownRenderResult = Awaited<ReturnType<typeof markdownToHtml>>;
