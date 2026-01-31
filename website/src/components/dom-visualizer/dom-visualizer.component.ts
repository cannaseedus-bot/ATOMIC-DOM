import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DomNode {
  tag: string;
  attributes: { [key: string]: string };
  children: (DomNode | string)[];
  isUpdated?: boolean;
}

@Component({
  selector: 'app-dom-visualizer',
  templateUrl: './dom-visualizer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DomVisualizerComponent]
})
export class DomVisualizerComponent {
  node = input.required<DomNode>();
  
  objectKeys = Object.keys;

  isDomNode(child: DomNode | string): child is DomNode {
    return typeof child === 'object' && child !== null && 'tag' in child;
  }
}
