let sql = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  sql += chunk;
});

process.stdin.on("end", () => {
  sql = sql
    .replace(/^CREATE TABLE /gm, "CREATE TABLE IF NOT EXISTS ")
    .replace(/^CREATE INDEX /gm, "CREATE INDEX IF NOT EXISTS ")
    .replace(
      /^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" (.+);$/gm,
      (_, table, constraint, rest) => {
        return [
          "DO $$ BEGIN",
          `\tIF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraint}') THEN`,
          `\t\tALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ${rest};`,
          "\tEND IF;",
          "END $$;",
        ].join("\n");
      },
    );

  process.stdout.write(sql);
});
