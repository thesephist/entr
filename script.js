const {
  Component,
} = window.Torus;
const html = window.jdom;
const { search } = window.libsearch;

function parseNotes(txt) {
  let heading = null;
  const notes = [];
  const lines = txt.split('\n').filter(line => !!(line.trim()));

  function pushNote(line) { notes.push({ heading, lines: [line.replaceAll(' // ', '\n\n')] }) }
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
    if (window.location.hash) {
      this.search = decodeURIComponent(window.location.hash.substr(1));
    }
    this.notes = [];

    this.fetch();
  }
  async fetch() {
    fetch('notes.txt').then(resp => resp.text()).then(text => {
      this.notes = parseNotes(text);
      this.render();
    }).catch(e => {
      alert(`Couldn't load notes! The error is the following. Feel free to let Linus know :)`, e);
      console.log(e);
    });
  }
  compose() {
    const matched = search(
      this.notes,
      this.search,
      note => (note.heading || '') + note.lines.join('\n'),
      { mode: 'prefix' }
    );
    return html`<div class="app">
      <header class="accent paper">
        <a href="https://thesephist.com" target="_blank">Linus's</a> notes on startups and life.
        <br/>
        <strong>${this.notes.length ? `${matched.length} results` : 'loading notes...'}</strong>
      </header>
      <div class="searcher">
        <input type="text"
          class="paper paper-border-left search-input"
          placeholder="Search Linus's notes..."
          value=${this.search}
          autofocus
            oninput=${evt => {
        this.search = evt.target.value;
        window.history.replaceState(null, null, '#' + encodeURIComponent(this.search));
        this.render();
      }} />
        <a class="movable paper paper-border-right about-button"
          href="https://github.com/thesephist/entr" target="_blank">
          about
        </a>
      </div>
      <div class="results ${this.notes.length ? '' : 'loading'}">
        <ul class="note-list">
          ${matched.map(Note)}
        </ul>
      </div>
      <footer>
        <p>
          Made with <a href="https://github.com/thesephist/torus" target="_blank">Torus</a>
          and
          <a href="https://thesephist.github.io/paper.css/" target="_blank">paper.css</a>
          by
          <a href="https://thesephist.com/" target="_blank">Linus</a>
          with inspiration from
          <a href="https://sahilkapur.com/" target="_blank">Sahil</a>
        </p>
      </footer>
    </div>`;
  }
}

const app = new App();
document.body.appendChild(app.node);