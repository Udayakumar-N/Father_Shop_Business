# Simple Billing System

A lightweight, no-install billing/invoicing web app for small shops — built with vanilla HTML, CSS, and JavaScript. No backend, no build step, no dependencies besides Chart.js (loaded via CDN).

## Features

- **Billing** — add items with autocomplete suggestions from your product history, build a cart, and complete or print bills
- **Sales Dashboard** — daily/monthly sales summaries, charts (via Chart.js), and a searchable bill history with view/edit/delete
- **Stock / Inventory** — automatically tracks every product you've billed, with price, last-used date, and usage count
- **Persistent storage** — all data is saved locally in the browser via `localStorage`, so it works fully offline

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (no frameworks)
- [Chart.js](https://www.chartjs.org/) (CDN)

## Project Structure

```
billing-system-project/
├── index.html   # Markup
├── style.css    # Styling
├── script.js    # App logic
└── README.md
```

## Usage

1. Clone or download this repository
2. Open `index.html` in any modern browser

No installation, server, or API key required.

## Live Demo

You can host this for free using GitHub Pages: go to your repo Settings → Pages → set source to the `main` branch, and your app will be live at `https://<your-username>.github.io/<repo-name>/`.

## License

Free to use and modify.
