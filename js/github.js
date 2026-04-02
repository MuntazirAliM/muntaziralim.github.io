

const GITHUB_USERNAME = 'MuntazirAliM';

const FEATURED_REPOS = [
  'finrisk-terminal',
  'hospital-readmission',
  'depot-management',
  'sign-language-glove',
];


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



async function fetchRepos(username) {
  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}



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



export async function loadGithubProjects(username = GITHUB_USERNAME) {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  try {
    const allRepos = await fetchRepos(username);

   
    const sorted = FEATURED_REPOS
      .map(name => allRepos.find(r => r.name === name))
      .filter(Boolean);

    if (sorted.length === 0) {
      console.warn('GitHub: no matching repos found. Keeping static HTML.');
      return;
    }

    
    grid.innerHTML = '';
    sorted.forEach((repo, i) => {
      const card = buildProjectCard(repo, i);
      grid.appendChild(card);
    });

   
    document.querySelectorAll('.reveal').forEach(el => {
      
      el.classList.remove('visible');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.1 });
      observer.observe(el);
    });

  } catch (err) {
    console.warn('GitHub API unavailable — using static project HTML.', err);
    
  }
}
