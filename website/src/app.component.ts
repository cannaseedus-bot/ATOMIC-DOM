import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { FeaturesComponent } from './components/features/features.component';
import { CodeExampleComponent } from './components/code-example/code-example.component';
import { FooterComponent } from './components/footer/footer.component';
import { ConceptsComponent } from './components/concepts/concepts.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // Fix: Corrected a typo in the ChangeDetectionStrategy enum. It should be a dot, not a hyphen.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    HeroComponent,
    FeaturesComponent,
    CodeExampleComponent,
    ConceptsComponent,
    FooterComponent
  ]
})
export class AppComponent {}