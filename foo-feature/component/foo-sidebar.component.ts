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
  
  // // Local UI-only state (signals)
  private readonly searchTextS = signal('');
  private readonly expandedS = signal(true);

  readonly vm = fooSidebarVM(this.store, this.searchTextS, this.expandedS);

  constructor() {
    effect(() => {
      console.log('FooSidebarComponent VM changed:', this.vm());
    });
  }

  textInputChange(text: string) {
    this.store.dispatch(FooActions.updateFooInput({ text }));
  }

  // UI intents
  setSearch(text: string) { 
    this.searchTextS.set(text); 
  }

  toggleExpanded() { 
    this.expandedS.update(v => !v); 
  }

  // Domain intents (dispatch)
  select(id: string) { 
    this.store.dispatch(FooActions.selected({ id })); 
  }
}
