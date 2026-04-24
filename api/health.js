module.exports = function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");

  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GITHUB_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    null;

  if (commit) {
    res.setHeader("x-deploy-commit", commit);
  }

  return res.status(200).json({
    ok: true,
    commit,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
    now: new Date().toISOString(),
  });
};
