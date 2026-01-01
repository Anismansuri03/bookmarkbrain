export default {
  async fetch(req: Request, env: any) {
    const url = new URL(req.url);

    // -----------------------------
    // EMBED FUNCTION
    // -----------------------------
    async function embed(text: string) {
      const res = await env.AI.run(
        "@cf/baai/bge-base-en-v1.5",
        { text }
      );
      return res.data[0];
    }

    // -----------------------------
    // ADD BOOKMARK (example)
    // -----------------------------
    if (url.pathname === "/bookmark" && req.method === "POST") {
      const body = await req.json();

      const content = `
      ${body.title || ""}
      ${body.description || ""}
      ${body.tags || ""}
      ${body.category || ""}
      ${body.url}
      `;

      const embedding = await embed(content);

      await env.DB.prepare(`
        INSERT INTO bookmarks
        (url, title, description, tags, category, embedding)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        body.url,
        body.title,
        body.description,
        body.tags,
        body.category,
        JSON.stringify(embedding)
      ).run();

      return Response.json({ success: true });
    }

    // -----------------------------
    // VECTOR SEARCH
    // -----------------------------
    if (url.pathname === "/search/vector") {
      const q = url.searchParams.get("q") || "";
      const qEmb = await embed(q);

      const rows = await env.DB
        .prepare(`SELECT * FROM bookmarks WHERE embedding IS NOT NULL`)
        .all();

      const scored = rows.results
        .map((row: any) => {
          const emb = JSON.parse(row.embedding);
          let dot = 0, a = 0, b = 0;

          for (let i = 0; i < emb.length; i++) {
            dot += emb[i] * qEmb[i];
            a += emb[i] ** 2;
            b += qEmb[i] ** 2;
          }

          const score = dot / (Math.sqrt(a) * Math.sqrt(b));
          return { ...row, score };
        })
        .sort((x: any, y: any) => y.score - x.score)
        .slice(0, 20);

      return Response.json(scored);
    }

    return new Response("OK");
  }
};
