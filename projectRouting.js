const PROJECT_PARAM = "project";

export function getProjectIdFromUrl(location = window.location) {
  try {
    const url = new URL(location.href);
    const rawId = url.searchParams.get(PROJECT_PARAM);
    return rawId ? rawId.trim() : null;
  } catch {
    return null;
  }
}

export function buildProjectHref(projectId, location = window.location) {
  if (!projectId) return location.pathname + location.search + location.hash;

  const url = new URL(location.href);
  url.searchParams.set(PROJECT_PARAM, projectId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function updateProjectUrl(projectId, { replace = false } = {}) {
  try {
    const url = new URL(window.location.href);
    if (projectId) {
      url.searchParams.set(PROJECT_PARAM, projectId);
    } else {
      url.searchParams.delete(PROJECT_PARAM);
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const state = { project: projectId || null };

    if (replace) {
      window.history.replaceState(state, "", nextUrl);
      return;
    }

    const currentProjectId = getProjectIdFromUrl();
    if (currentProjectId === projectId && !replace) return;
    window.history.pushState(state, "", nextUrl);
  } catch {
    // Ignore routing issues in environments without history support.
  }
}

export { PROJECT_PARAM };
