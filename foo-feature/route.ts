

import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { fooReducer } from './_store/foo.reducer';
import { FooEffects } from './_store/foo.effects';

export const Routes = [
  {
    path: '',
    loadComponent: () => import('./component/foo-sidebar.component').then(m => m.FooSidebarComponent),
    providers: [
      provideState('foo', fooReducer),
      provideEffects(FooEffects)
    ]
  }
]
