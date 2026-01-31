import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-concepts',
  templateUrl: './concepts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptsComponent {
  activeConcept = signal<'blocks' | 'wormholes'>('blocks');

  setActiveConcept(concept: 'blocks' | 'wormholes') {
    this.activeConcept.set(concept);
  }
}
