/* ============================================================
   MUNTAZIR ALI MUGHAL — Portfolio
   js/github.js

   Fetches pinned/public repos from GitHub API and renders
   them into the projects grid dynamically.

   Usage (in main.js):
     import { loadGithubProjects } from './github.js';
     loadGithubProjects('MuntazirAliM');
   ============================================================ */

const GITHUB_USERNAME = 'MuntazirAliM';

// Repos to feature (in order). Must match GitHub repo names exactly.
const FEATURED_REPOS = [
  'finrisk-terminal',
  'hospital-readmission',
  'depot-management',
  'sign-language-glove',
];

// Display metadata — override GitHub's default descriptions here
const REPO_META = {
  'finrisk-terminal': {
    label:  'Financial Risk · NLP · RAG',
    title:  'FinRisk Terminal — AI Financial Risk Platform',
    desc:   'Engineered a SQL data warehouse ingesting 15,000+ rows of financial market data across 10 S&P 500 tickers, with a natural language AI copilot grounded in 500+ SEC 10-K filings.',
    featured: true,
  },
  'hospital-readmission': {
    label: 'Healthcare · ML · Explainability',
    title: 'Hospital Readmission Prediction',
    desc:  'Identified the top 5 statistical drivers of 30-day readmissions using SHAP explainability, communicated via an interactive Streamlit dashboard for non-clinical stakeholders.',
  },
  'depot-management': {
    label: 'ETL · Business Intelligence',
    title: 'Depot Management System',
    desc:  'Replaced manual Excel reporting with an automated ETL pipeline and real-time inventory tracking, cutting reporting time by ~60% across 8+ workflows.',
  },
  'sign-language-glove': {
    label: 'ML · Sensor Data · Classification',
    title: 'Sign Language Glove — Gesture Classification',
    desc:  'Feature-engineered 5,000+ labelled sensor samples across 28 gesture classes, achieving 95%+ classification accuracy through rigorous cross-validation.',
  },
};


/**
 * Fetch all public repos for a GitHub user.
 * @param {string} username
 * @returns {Promise<Array>}
 */
async function fetchRepos(username) {
  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}


/**
 * Build a single project card element.
 * @param {object} repo  — GitHub repo object
 * @param {number} index — 0-based position
 * @returns {HTMLElement}
 */
function buildProjectCard(repo, index) {
  const meta     = REPO_META[repo.name] || {};
  const num      = String(index + 1).padStart(2, '0');
  const isFeat   = meta.featured === true;
  const label    = meta.label || 'Project';
  const title    = meta.title || repo.name;
  const desc     = meta.desc  || repo.description || 'No description available.';
  const topics   = repo.topics || [];
  const repoUrl  = repo.html_url;

  const card = document.createElement('div');
  card.className = `project-card reveal reveal-delay-${(index % 4) + 1}${isFeat ? ' featured' : ''}`;

  const techTags = topics.map(t => `<span class="tech-tag">${t}</span>`).join('');

  card.innerHTML = `
    <div>
      <div class="project-num">${num}</div>
      <span class="project-tag">${label}</span>
      <h3 class="project-title">${title}</h3>
      <p class="project-desc">${desc}</p>
      <div class="project-tech">${techTags}</div>
      <a href="${repoUrl}" target="_blank" class="project-link">View on GitHub</a>
    </div>
    ${isFeat ? `
    <div class="project-visual">
      <div class="project-visual-icon">◈</div>
      <div class="project-visual-label">${title.toUpperCase().slice(0, 20)}</div>
    </div>` : ''}
  `;

  return card;
}


/**
 * Main entry point. Fetches repos and renders them.
 * Falls back to static HTML if the API fails.
 * @param {string} username
 */
export async function loadGithubProjects(username = GITHUB_USERNAME) {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  try {
    const allRepos = await fetchRepos(username);

    // Sort by FEATURED_REPOS order, then by stars for any extras
    const sorted = FEATURED_REPOS
      .map(name => allRepos.find(r => r.name === name))
      .filter(Boolean);

    if (sorted.length === 0) {
      console.warn('GitHub: no matching repos found. Keeping static HTML.');
      return;
    }

    // Clear static HTML and render dynamic cards
    grid.innerHTML = '';
    sorted.forEach((repo, i) => {
      const card = buildProjectCard(repo, i);
      grid.appendChild(card);
    });

    // Re-attach scroll reveal observer to new elements
    document.querySelectorAll('.reveal').forEach(el => {
      // Trigger IntersectionObserver re-scan
      el.classList.remove('visible');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.1 });
      observer.observe(el);
    });

  } catch (err) {
    console.warn('GitHub API unavailable — using static project HTML.', err);
    // Static HTML remains in place — no action needed
  }
}
