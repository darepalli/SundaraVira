window.SV_VERSION = {
  major: 1,
  minor: 0,
  build: 11,
  updatedAt: "2026-05-11"
};

window.getSVVersionLabel = function getSVVersionLabel() {
  const v = window.SV_VERSION;
  return `Version ${v.major}.${v.minor}  Build ${v.build}`;
};
