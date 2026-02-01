import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DomVisualizerComponent, DomNode } from '../dom-visualizer/dom-visualizer.component';

interface Card {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-code-example',
  templateUrl: './code-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DomVisualizerComponent]
})
export class CodeExampleComponent {
  // --- Basic Example State ---
  isUpdatedState = signal(false);

  // --- Flip Card Example State ---
  flippedCardIndex = signal<number | null>(null);
  cards = signal<Card[]>([
    {
      title: 'Declarative UI',
      description: 'Describe your UI based on state. AtomicDOM handles the rendering efficiently.',
      icon: '✨'
    },
    {
      title: 'Component Model',
      description: 'Build encapsulated components that manage their own state, then compose them to make complex UIs.',
      icon: '📦'
    },
    {
      title: 'Performant',
      description: 'A minimal diffing algorithm ensures that only the necessary changes are made to the actual DOM.',
      icon: '🚀'
    }
  ]);

  // --- Basic Example Computations ---
  classicDomCode = signal<string>(
`// Direct, mutable, and error-prone
const container = document.getElementById('app');

const header = document.createElement('h1');
header.textContent = 'Hello World';
header.className = 'title';

const p = document.createElement('p');
p.textContent = 'This is a paragraph.';

container.appendChild(header);
container.appendChild(p);

// State change requires more manual updates
header.textContent = 'Hello Again!';`);

  atomicDomCode = computed(() => {
    const title = this.isUpdatedState() ? 'Hello Again!' : 'Hello World';
    const text = 'This is a paragraph.';
    const stateChangeComment = this.isUpdatedState() 
      ? `\n// State has been updated!` 
      : `\n// State change triggers efficient re-render`;
    return `// Declarative, immutable, and type-safe
import { atom, render } from '@xjson/atomic-dom';

const view = (title, text) => 
  atom('div', { id: 'app' }, [
    atom('h1', { class: 'title' }, title),
    atom('p', {}, text)
  ]);

let appState = {
  title: '${title}',
  text: '${text}'
};

// Render based on current state
render(document.body, view(appState.title, appState.text));${stateChangeComment}`;
  });

  domTree = computed<DomNode>(() => {
    const isUpdated = this.isUpdatedState();
    const title = isUpdated ? 'Hello Again!' : 'Hello World';
    return {
      tag: 'div',
      attributes: { id: 'app' },
      children: [
        {
          tag: 'h1',
          attributes: { class: 'title' },
          children: [title],
          isUpdated: isUpdated,
        },
        {
          tag: 'p',
          attributes: {},
          children: ['This is a paragraph.'],
        },
      ],
    };
  });

  // --- Flip Card Example Computations ---
  flipCardDomTree = computed<DomNode>(() => {
    const flippedIndex = this.flippedCardIndex();
    return {
      tag: 'div',
      attributes: { class: 'card-grid' },
      children: this.cards().map((card, index) => ({
        tag: 'div',
        attributes: { class: `flip-card ${flippedIndex === index ? 'flipped' : ''}` },
        isUpdated: flippedIndex === index,
        children: [{
          tag: 'div',
          attributes: { class: 'flip-card-inner' },
          children: [
            { // Front
              tag: 'div',
              attributes: { class: 'flip-card-front' },
              children: [
                { tag: 'span', attributes: { class: 'icon' }, children: [card.icon] },
                { tag: 'h3', attributes: {}, children: [card.title] },
              ],
            },
            { // Back
              tag: 'div',
              attributes: { class: 'flip-card-back' },
              children: [{ tag: 'p', attributes: {}, children: [card.description] }],
            }
          ]
        }]
      }))
    };
  });

  flipCardCode = computed(() => {
    const flippedIndex = this.flippedCardIndex();
    return `import { atom, render } from '@xjson/atomic-dom';

const cardsData = [/* ... data for ${this.cards().length} cards ... */];
let flippedCard = ${flippedIndex === null ? 'null' : flippedIndex};

const Card = (card, index, isFlipped) =>
  atom('div', { 
    class: \`flip-card \${isFlipped ? 'flipped' : ''}\`,
    onClick: () => { /* handle flip state */ }
  }, [
    // ... inner structure with front and back faces
  ]);

const App = (cards, flipped) =>
  atom('div', { class: 'card-grid' }, 
    cards.map((card, i) => Card(card, i, i === flipped))
  );

// Re-render when 'flippedCard' changes
render(document.body, App(cardsData, flippedCard));`;
  });

  // --- Methods ---
  toggleState() {
    this.isUpdatedState.update(v => !v);
  }

  flipCard(index: number) {
    this.flippedCardIndex.update(currentIndex => 
      currentIndex === index ? null : index
    );
  }
}
