window.SV_VERSION = {
  major: 1,
  minor: 0,
  build: 13,
  updatedAt: "2026-05-15"
};

window.getSVVersionLabel = function getSVVersionLabel() {
  const v = window.SV_VERSION;
  return `Version ${v.major}.${v.minor}  Build ${v.build}`;
};
