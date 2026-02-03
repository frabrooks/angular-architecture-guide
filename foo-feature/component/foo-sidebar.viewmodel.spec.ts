import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { 
  mapToFooSidebarVM, 
  fooSidebarVM, 
  Foo, 
  FooSidebarVM 
} from './foo-sidebar.viewmodel';
import { 
  selectFoos, 
  selectSelectedFooId, 
  selectFooInputText 
} from '../_store/foo.selectors';

describe('FooSidebar ViewModel', () => {
  // Test data
  const mockFoos: Foo[] = [
    {
      id: '1',
      name: 'Test Foo 1',
      description: 'First test foo',
      status: 'active',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Another Foo',
      description: 'Second test item',
      status: 'inactive',
      createdAt: new Date('2024-01-02')
    },
    {
      id: '3',
      name: 'Special Item',
      description: 'Contains special keyword',
      status: 'active',
      createdAt: new Date('2024-01-03')
    }
  ];

  describe('fooSidebarVM (ViewModel Integration Testing)', () => {
    let store: MockStore;
    let searchTextSignal: Signal<string>;
    let expandedSignal: Signal<boolean>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore({
            initialState: {},
            selectors: [
              { selector: selectFoos, value: mockFoos },
              { selector: selectSelectedFooId, value: '1' },
              { selector: selectFooInputText, value: 'store input text' }
            ]
          })
        ]
      });

      store = TestBed.inject(MockStore);
      searchTextSignal = signal('test');
      expandedSignal = signal(false);
    });

    afterEach(() => {
      store?.resetSelectors();
    });

    it('should create viewmodel signal that combines store and local state', () => {
      // Act
      const vmSignal = fooSidebarVM(store, searchTextSignal, expandedSignal);
      const vm = vmSignal();

      // Assert
      expect(vm.textInputValue).toBe('store input text'); // From store
      expect(vm.searchText).toBe('test'); // From local signal
      expect(vm.isExpanded).toBe(false); // From local signal
      expect(vm.selectedId).toBe('1'); // From store
      expect(vm.items.length).toBe(3); // From store
      expect(vm.items[0].isSelected).toBe(true); // Item '1' should be selected
    });

    it('should react to store state changes', () => {
      // Arrange
      const vmSignal = fooSidebarVM(store, searchTextSignal, expandedSignal);
      
      // Initial state
      let vm = vmSignal();
      expect(vm.selectedId).toBe('1');

      // Act - Update store state
      store.overrideSelector(selectSelectedFooId, '2');
      store.refreshState();

      // Assert - ViewModel should reflect new store state
      vm = vmSignal();
      expect(vm.selectedId).toBe('2');
      expect(vm.items[0].isSelected).toBe(false); // Item '1' no longer selected
      expect(vm.items[1].isSelected).toBe(true);  // Item '2' now selected
    });

    it('should react to local signal changes', () => {
      // Arrange
      const searchSignal = signal('');
      const vmSignal = fooSidebarVM(store, searchSignal, expandedSignal);
      
      // Initial state - no filtering
      let vm = vmSignal();
      expect(vm.filteredItems.length).toBe(3);

      // Act - Update search text
      searchSignal.set('special');

      // Assert - ViewModel should reflect filtered results
      vm = vmSignal();
      expect(vm.filteredItems.length).toBe(1);
      expect(vm.filteredItems[0].name).toBe('Special Item');
      expect(vm.searchText).toBe('special');
    });

    it('should handle empty store state gracefully', () => {
      // Arrange - Override store to return empty data
      store.overrideSelector(selectFoos, []);
      store.overrideSelector(selectSelectedFooId, null);
      store.overrideSelector(selectFooInputText, '');
      store.refreshState();

      // Act
      const vmSignal = fooSidebarVM(store, searchTextSignal, expandedSignal);
      const vm = vmSignal();

      // Assert
      expect(vm.items).toEqual([]);
      expect(vm.filteredItems).toEqual([]);
      expect(vm.hasResults).toBe(false);
      expect(vm.selectedId).toBe(null);
      expect(vm.textInputValue).toBe('');
    });
  });
});
