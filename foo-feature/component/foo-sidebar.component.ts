import { Component, computed, effect, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { FooActions } from '../_store/foo.actions';
import { fooSidebarVM } from './foo-sidebar.viewmodel';
import { TextInputFormCtrlComponent } from '@shared/form/inputs/text-input-form-ctrl/text-input-form-ctrl.component';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [
    FormsModule,
    TextInputFormCtrlComponent
  ],
  selector: 'app-foo-sidebar',
  templateUrl: './foo-sidebar.component.html',
  styleUrls: ['./foo-sidebar.component.scss'],
})
export class FooSidebarComponent {
  private readonly store = inject(Store);
  
  // Local component state, think carefully and confirm that ONLY this component needs it.
  // i.e. a typeahead search text or filter text for a long list.
  // Sometimes you might have 'UI' state that is nonetheless needed across mutliple components, in which
  // case best to extend the domain type in /feature/_types/foo.model.ts and manage it in the store.
  private readonly searchTextS = signal('');
  private readonly expandedS = signal(true);

  readonly vm = fooSidebarVM(this.store, this.searchTextS, this.expandedS);

  constructor() {
    effect(() => {
      // Example of a side effect that runs whenever the viewmodel changes. Use sparingly.
      // Ask yourself if NgRx effects or component lifecycle hooks would be more appropriate.
      console.log('FooSidebarComponent VM changed:', this.vm());
    });
  }

  // UI intents
  setSearch(text: string) { 
    this.searchTextS.set(text); 
  }

  toggleExpanded() { 
    this.expandedS.update(v => !v); 
  }

  // Domain intents (store dispatch)
  fooMessageInputChange(text: string) {
    this.store.dispatch(FooActions.fooMessageInputChange({ text }));
  }

  select(id: string) { 
    this.store.dispatch(FooActions.fooSelected({ id })); 
  }

  sendMessageToSelectedFoo() {
    this.store.dispatch(FooActions.sendMessageToSelectedFooButtonClick());
  }

}
