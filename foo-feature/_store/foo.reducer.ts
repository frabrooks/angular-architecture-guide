import { createReducer, on } from '@ngrx/store';
import { FooActions } from './foo.actions';
import { FooState, initialFooState } from './foo.state';

export const fooReducer = createReducer(
  initialFooState,
  on(FooActions.updateFooInput, (state, { text }): FooState => ({
    ...state,
    inputText: text
  }))
);
