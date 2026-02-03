import { createSelector, createFeatureSelector } from '@ngrx/store';
import { Foo } from '../component/foo-sidebar.viewmodel';

export interface FooState {
  foos: Foo[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  inputText: string;
}

export const selectFooState = createFeatureSelector<FooState>('foo');

export const selectFoos = createSelector(
  selectFooState,
  (state: FooState) => state.foos
);

export const selectFooInputText = createSelector(
  selectFooState,
  (state: FooState) => state.inputText
);

export const selectSelectedFooId = createSelector(
  selectFooState,
  (state: FooState) => state.selectedId
);

export const selectSelectedFoo = createSelector(
  selectFoos,
  selectSelectedFooId,
  (foos, selectedId) => foos.find(foo => foo.id === selectedId) || null
);

export const selectLoading = createSelector(
  selectFooState,
  (state: FooState) => state.loading
);

export const selectError = createSelector(
  selectFooState,
  (state: FooState) => state.error
);
