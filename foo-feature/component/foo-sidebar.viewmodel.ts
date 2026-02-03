import { Signal, computed } from "@angular/core";
import { Store } from "@ngrx/store";
import { selectFooInputText, selectFoos, selectSelectedFooId } from "../_store/foo.selectors";

export interface Foo {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly status: 'active' | 'inactive';
  readonly createdAt: Date;
}

export interface FooItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: 'active' | 'inactive';
  readonly isSelected: boolean;
}

export type FooSidebarVM = {
  readonly textInputValue: string;
  readonly items: readonly FooItem[];
  readonly selectedId: string | null;
  readonly isExpanded: boolean;
  readonly filteredItems: readonly FooItem[];
  readonly hasResults: boolean;
  readonly searchText: string;
};

export function mapToFooSidebarVM(input: {
  foos: Foo[];
  selectedId: string | null;
  expanded: boolean;
  searchText: string;
  inputText: string;
}): FooSidebarVM {
  // pure mapping; safe defaults; never throw
  const safeInput = {
    foos: input.foos || [],
    selectedId: input.selectedId,
    expanded: input.expanded ?? true,
    searchText: input.searchText || '',
    inputText: input.inputText || '',
  };

  const items: FooItem[] = safeInput.foos.map(foo => ({
    id: foo.id,
    name: foo.name,
    description: foo.description || '',
    status: foo.status,
    isSelected: foo.id === safeInput.selectedId,
  }));

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(safeInput.searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(safeInput.searchText.toLowerCase())
  );
  
  return {
    textInputValue: safeInput.inputText,
    items,
    selectedId: safeInput.selectedId,
    isExpanded: safeInput.expanded,
    filteredItems,
    hasResults: filteredItems.length > 0,
    searchText: safeInput.searchText,
  };
}


export function fooSidebarVM(store: Store, searchText: Signal<string>, expanded: Signal<boolean>): Signal<FooSidebarVM> {

  // Domain state (from NgRx as signals)
  const foos = store.selectSignal(selectFoos);
  const selectedId = store.selectSignal(selectSelectedFooId);
  const inputText = store.selectSignal(selectFooInputText);

  return computed(() => {
    return mapToFooSidebarVM({
      foos: foos(),
      selectedId: selectedId(),
      expanded: expanded(),
      searchText: searchText(),
      inputText: inputText()
    });
  });
}


