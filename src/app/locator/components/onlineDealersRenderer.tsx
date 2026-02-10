"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export type EditorJsBlock = {
  id: string;
  type: string;
  data: {
    text?: string;
    level?: number;
    style?: "ordered" | "unordered";
    items?: string[];
  };
};

type DealerItem = {
  image: string;
  url: string;
  description: string;
  title: string;
};

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const textarea =
    typeof document !== "undefined" ? document.createElement("textarea") : null;

  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fallback for server-side rendering
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Helper function to check if text contains HTML table elements
function isTableFragment(text: string): boolean {
  const tablePatterns = [
    /<table/i,
    /<\/table>/i,
    /<thead/i,
    /<\/thead>/i,
    /<tbody/i,
    /<\/tbody>/i,
    /<tr/i,
    /<\/tr>/i,
    /<td/i,
    /<\/td>/i,
    /<th/i,
    /<\/th>/i,
    /<colgroup/i,
    /<\/colgroup>/i,
    /<col/i,
  ];
  return tablePatterns.some((pattern) => pattern.test(text));
}

// Helper function to parse table HTML and extract dealer data
function parseTableToDealers(html: string): DealerItem[] {
  if (typeof document === "undefined") return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = doc.querySelectorAll("tr");
  const dealers: DealerItem[] = [];

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 2) {
      const firstCell = cells[0];
      const secondCell = cells[1];
      const thirdCell = cells[2];

      // Extract image
      const img = firstCell.querySelector("img");
      const imgSrc = img?.getAttribute("src") || "";

      // Extract URL and description from second cell
      const link = secondCell.querySelector("a");
      const url = link?.getAttribute("href") || "";
      const description = secondCell.textContent?.trim() || "";
      const title = thirdCell?.textContent?.trim() || "";

      if (imgSrc && url) {
        dealers.push({
          image: imgSrc,
          url: url,
          description: description,
          title: title,
        });
      }
    }
  });

  return dealers;
}

// Helper function to merge table fragments
function mergeTableBlocks(blocks: EditorJsBlock[]): EditorJsBlock[] {
  const merged: EditorJsBlock[] = [];
  let tableBuffer: string[] = [];
  let tableStartId: string | null = null;
  let isInTable = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = block.data?.text || "";
    const decodedText = decodeHtmlEntities(text);

    // Check if this starts a table
    if (/<table/i.test(decodedText)) {
      isInTable = true;
      tableStartId = block.id;
    }

    if (
      block.type === "paragraph" &&
      (isInTable || isTableFragment(decodedText))
    ) {
      // Start or continue accumulating table content
      if (!tableStartId) {
        tableStartId = block.id;
        isInTable = true;
      }

      // Clean up individual fragments: remove <br> tags and preserve whitespace
      const cleanedText = decodedText
        .replace(/<br\s*\/?>/gi, "")
        .replace(/^\s+|\s+$/g, "");

      if (cleanedText) {
        tableBuffer.push(cleanedText);
      }

      // Check if this closes the table
      if (/<\/table>/i.test(decodedText)) {
        isInTable = false;
        // Create merged table block
        const mergedHTML = tableBuffer.join("");
        merged.push({
          id: tableStartId || block.id,
          type: "table",
          data: {
            text: mergedHTML,
          },
        });
        tableBuffer = [];
        tableStartId = null;
      }
    } else {
      // If we have accumulated table content, create a merged block
      if (tableBuffer.length > 0 && tableStartId) {
        const mergedHTML = tableBuffer.join("");
        merged.push({
          id: tableStartId,
          type: "table",
          data: {
            text: mergedHTML,
          },
        });
        tableBuffer = [];
        tableStartId = null;
        isInTable = false;
      }
      // Add the non-table block
      merged.push(block);
    }
  }

  // Handle any remaining table content
  if (tableBuffer.length > 0 && tableStartId) {
    const mergedHTML = tableBuffer.join("");
    merged.push({
      id: tableStartId,
      type: "table",
      data: {
        text: mergedHTML,
      },
    });
  }

  return merged;
}

function DealersList({ blockId, html }: { blockId: string; html: string }) {
  const [dealers, setDealers] = useState<DealerItem[]>([]);

  useEffect(() => {
    const parsedDealers = parseTableToDealers(html);
    setDealers(parsedDealers);
  }, [html]);

  if (dealers.length === 0) {
    return null;
  }
  return (
    <div className="w-full space-y-0">
      {dealers.map((dealer, index) => (
        <div
          key={`${blockId}-${index}`}
          className="border-b border-gray-200 last:border-b-0"
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-2 py-4 md:py-5">
            {/* Image Container - Fixed size */}
            <div className="flex-shrink-0 w-48 h-24 mr-8 flex items-center justify-center bg-white">
              <Image
                width={192}
                height={87}
                src={dealer.image}
                alt={dealer.description}
                className="object-contain"
              />
            </div>

            {/* Content Container */}
            <div>
              <a
                href={dealer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <h3 className="text-lg font-semibold text-gray-900 uppercase mb-2 hover:text-[var(--color-primary)] transition-colors max-w-[500px] break-words">
                  {dealer.description}
                </h3>
              </a>
              <p className="text-base text-gray-600">{dealer.title}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OnlineDealersRenderer({
  content,
}: {
  content: string | null | undefined;
}) {
  let blocks: EditorJsBlock[] = [];
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.blocks)) {
        blocks = parsed.blocks as EditorJsBlock[];
      }
    } catch (_) {}
  }

  if (!blocks.length) {
    return (
      <div className="w-full p-6">
        <h2 className="text-xl font-semibold">Data Not available</h2>
      </div>
    );
  }

  // Merge table fragments before rendering
  const mergedBlocks = mergeTableBlocks(blocks);

  const renderBlock = (block: EditorJsBlock) => {
    const { type, data } = block;
    const html = decodeHtmlEntities(data?.text || "");

    switch (type) {
      case "table":
        return (
          <DealersList
            key={block.id}
            blockId={block.id}
            html={data?.text || ""}
          />
        );
      case "header": {
        const level = Math.min(Math.max(Number(data?.level) || 3, 1), 6);
        return React.createElement(`h${level}`, {
          key: block.id,
          className: "text-2xl font-semibold leading-8 tracking-[-0.06px] my-6",
          dangerouslySetInnerHTML: { __html: html },
        });
      }
      case "list": {
        const style = data?.style || "unordered";
        const items = Array.isArray(data?.items) ? data.items : [];
        const ListTag = style === "ordered" ? "ol" : "ul";
        const listClassName =
          style === "ordered"
            ? "list-none my-4 space-y-2 text-lg leading-7 tracking-[-0.045px]"
            : "list-none my-4 space-y-2 text-lg leading-7 tracking-[-0.045px]";

        return (
          <ListTag key={block.id} className={listClassName}>
            {items.map((item, idx) => (
              <li
                key={`${block.id}-${idx}`}
                dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(item) }}
              />
            ))}
          </ListTag>
        );
      }
      case "paragraph":
      default:
        // Check if this paragraph contains table HTML that wasn't merged
        if (isTableFragment(html)) {
          return <DealersList key={block.id} blockId={block.id} html={html} />;
        }
        return (
          <p
            key={block.id}
            className="text-base lg:text-lg leading-7 tracking-[-0.045px] my-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .editor-content a {
            color: #2563eb;
            text-decoration: none;
            transition: color 0.2s;
          }
          hr {
            border-color: #A1A1AA;
          }
          .editor-content a:hover {
            color: #1d4ed8;
          }
          .editor-content strong,
          .editor-content b {
            font-weight: 600;
          }
          .editor-content em,
          .editor-content i {
            font-style: italic;
          }
        `,
        }}
      />
      <div className="editor-content">{mergedBlocks.map(renderBlock)}</div>
    </>
  );
}
