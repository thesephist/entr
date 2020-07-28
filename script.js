const {
  Component,
} = window.Torus;
const html = window.jdom;

function parseNotes(txt) {
  let heading = null;
  const notes = [];
  const lines = txt.split('\n').filter(line => !!(line.trim()));

  function pushNote(line) { notes.push({ heading, lines: [line] }) }
  function pushLine(line) { notes[notes.length - 1].lines.push(line) }

  for (const line of lines) {
    if (line.startsWith('#')) {
      // is heading, update heading and move on
      heading = line.replace(/^#+/, '');
      continue;
    }

    if (line[0] === ' ') {
      // is an indented note, add to previous note's lines
      if (line.trim().startsWith('-')) {
        pushLine(line.trim().replace(/^- /, ''));
      } else {
        pushLine(line.trim().replace(/^\d\.? /, ''));
      }
      continue;
    }

    pushNote(line.replace(/^- /, ''));
  }

  return notes;
}

function noteMatches(search, { heading, lines }) {
  if (!search.trim()) {
    return true;
  }

  if (lines.length === 1) {
    return lines[0].toLowerCase().includes(search.toLowerCase());
  }

  for (const line of lines) {
    if (line.toLowerCase().includes(search.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function Note({ heading, lines }) {
  const mainLine = lines[0];
  const restLines = lines.slice(1);
  return html`<li class="paper note-item">
    ${heading ? html`<p class="heading">${heading}</p>` : null}
    <p class="main-line">${mainLine}</p>
    ${restLines.length ? html`<ul>
      ${restLines.map(line => html`<li class="rest-line">${line}</li>`)}
    </ul>` : null}
  </li>`;
}

class App extends Component {
  init() {
    this.search = '';
    this.notes = [];

    this.fetch();
  }
  async fetch() {
    fetch('notes.txt').then(resp => resp.text()).then(text => {
      this.notes = parseNotes(text);
      this.render();
    }).catch(e => {
      // TODO: improve.
      alert(e);
      console.log(e);
    });
  }
  compose() {
    const matched = this.notes.filter(note => noteMatches(this.search, note));
    return html`<div class="app">
    <header class="accent paper">
      Linus's (<a href="https://thesephist.com">@thesephist</p>) notes on startups and life.
      <br/>
      <strong>${matched.length ? `${matched.length} results` : 'loading notes...'}</strong>
    </header>
    <div class="searcher">
      <input type="text"
        class="paper paper-border-left search-input"
        placeholder="Search Linus's notes..."
        autofocus
          oninput=${evt => {
        this.search = evt.target.value;
        this.render();
      }} />
      <button class="movable paper paper-border-right about-button">
        about
      </button>
    </div>
    <div class="results">
      <ul class="note-list">
        ${matched.map(Note)}
      </ul>
    </div>
    </div>`;
  }
}

const app = new App();
document.body.appendChild(app.node);