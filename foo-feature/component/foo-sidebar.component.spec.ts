import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FooSidebarComponent } from './foo-sidebar.component';
import { FooActions } from '../_store/foo.actions';
import { 
  selectFoos, 
  selectSelectedFooId, 
  selectFooInputText 
} from '../_store/foo.selectors';
import { Foo } from './foo-sidebar.viewmodel';

describe('FooSidebarComponent', () => {
  let component: FooSidebarComponent;
  let fixture: ComponentFixture<FooSidebarComponent>;
  let store: MockStore;

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
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooSidebarComponent], // Standalone component
      providers: [
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: selectFoos, value: mockFoos },
            { selector: selectSelectedFooId, value: null },
            { selector: selectFooInputText, value: 'initial input' }
          ]
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooSidebarComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    fixture.detectChanges();
  });

  afterEach(() => {
    store?.resetSelectors();
  });

  describe('Component Creation & ViewModel Integration', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize viewmodel with store and local state', () => {
      // Act
      const vm = component.vm();

      // Assert - Component should have a viewmodel with expected data
      expect(vm).toBeTruthy();
      expect(vm.items.length).toBe(2);
      expect(vm.textInputValue).toBe('initial input'); // From store
      expect(vm.isExpanded).toBe(true); // Default local state
      expect(vm.searchText).toBe(''); // Default local state
      expect(vm.selectedId).toBe(null);
    });

    it('should have viewmodel reactive to store changes', () => {
      // Arrange - Initial state
      let vm = component.vm();
      expect(vm.selectedId).toBe(null);

      // Act - Update store
      store.overrideSelector(selectSelectedFooId, '1');
      store.refreshState();
      fixture.detectChanges();

      // Assert - ViewModel should reflect new state
      vm = component.vm();
      expect(vm.selectedId).toBe('1');
      expect(vm.items[0].isSelected).toBe(true);
    });

    it('should have viewmodel reactive to local signal changes', () => {
      // Arrange - Initial state
      let vm = component.vm();
      expect(vm.searchText).toBe('');
      expect(vm.filteredItems.length).toBe(2);

      // Act - Update local state via component method
      component.setSearch('test');

      // Assert - ViewModel should reflect filtered results
      vm = component.vm();
      expect(vm.searchText).toBe('test');
      expect(vm.filteredItems.length).toBe(1); // Only "Test Foo 1" matches
    });
  });

  describe('Template Rendering', () => {
    it('should render the sidebar header', () => {
      // Act
      const headerElement = fixture.debugElement.query(By.css('.sidebar-header h3'));
      
      // Assert
      expect(headerElement).toBeTruthy();
      expect(headerElement.nativeElement.textContent.trim()).toBe('Foo Items');
    });

    it('should render toggle button with correct state', () => {
      // Act
      const toggleBtn = fixture.debugElement.query(By.css('.toggle-btn'));
      
      // Assert
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.nativeElement.textContent.trim()).toBe('Collapse'); // Default expanded
      expect(toggleBtn.nativeElement.getAttribute('aria-expanded')).toBe('true');
    });

    it('should render search input when expanded', () => {
      // Arrange - Component starts expanded
      expect(component.vm().isExpanded).toBe(true);

      // Act
      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      
      // Assert
      expect(searchInput).toBeTruthy();
      expect(searchInput.nativeElement.placeholder).toBe('Search items...');
    });

    it('should render items list when expanded', () => {
      // Arrange - Component starts expanded with 2 items
      expect(component.vm().isExpanded).toBe(true);

      // Act
      const itemElements = fixture.debugElement.queryAll(By.css('.item'));
      
      // Assert
      expect(itemElements.length).toBe(2);
      expect(itemElements[0].nativeElement.textContent).toContain('Test Foo 1');
      expect(itemElements[1].nativeElement.textContent).toContain('Another Foo');
    });

    it('should not render content when collapsed', () => {
      // Act - Collapse the sidebar
      component.toggleExpanded();
      fixture.detectChanges();

      // Assert
      const sidebarContent = fixture.debugElement.query(By.css('.sidebar-content'));
      expect(sidebarContent).toBeFalsy(); // Should not be in DOM due to @if
    });

    it('should show selected item with correct styling', () => {
      // Arrange - Set item '1' as selected
      store.overrideSelector(selectSelectedFooId, '1');
      store.refreshState();
      fixture.detectChanges();

      // Act
      const selectedItem = fixture.debugElement.query(By.css('.item.selected'));
      const allItems = fixture.debugElement.queryAll(By.css('.item'));

      // Assert
      expect(selectedItem).toBeTruthy();
      expect(allItems[0].nativeElement.classList.contains('selected')).toBe(true);
      expect(allItems[1].nativeElement.classList.contains('selected')).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('should toggle expanded state when toggle button is clicked', () => {
      // Arrange
      const toggleBtn = fixture.debugElement.query(By.css('.toggle-btn'));
      expect(component.vm().isExpanded).toBe(true);

      // Act
      toggleBtn.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(component.vm().isExpanded).toBe(false);
      expect(toggleBtn.nativeElement.textContent.trim()).toBe('Expand');
    });

    it('should update search text when user types in search input', () => {
      // Arrange
      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      
      // Act
      searchInput.nativeElement.value = 'another';
      searchInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Assert
      const vm = component.vm();
      expect(vm.searchText).toBe('another');
      expect(vm.filteredItems.length).toBe(1);
      expect(vm.filteredItems[0].name).toBe('Another Foo');
    });

    it('should dispatch selection action when item is clicked', () => {
      // Arrange
      spyOn(store, 'dispatch');
      const firstItem = fixture.debugElement.query(By.css('.item'));

      // Act
      firstItem.nativeElement.click();

      // Assert
      expect(store.dispatch).toHaveBeenCalledWith(
        FooActions.selected({ id: '1' })
      );
    });

    it('should show "no results" message when search has no matches', () => {
      // Arrange - Set a search that won't match anything
      component.setSearch('nonexistent');
      fixture.detectChanges();

      // Act
      const noResultsElement = fixture.debugElement.query(By.css('.no-results'));

      // Assert
      expect(noResultsElement).toBeTruthy();
      expect(noResultsElement.nativeElement.textContent).toContain('No items found matching "nonexistent"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty store state gracefully', () => {
      // Arrange - Override store with empty data
      store.overrideSelector(selectFoos, []);
      store.overrideSelector(selectFooInputText, '');
      store.refreshState();
      fixture.detectChanges();

      // Act
      const vm = component.vm();
      const noResultsElement = fixture.debugElement.query(By.css('.no-results'));

      // Assert
      expect(vm.items).toEqual([]);
      expect(vm.hasResults).toBe(false);
      expect(noResultsElement).toBeTruthy();
      expect(noResultsElement.nativeElement.textContent).toContain('No items available');
    });

    it('should handle inactive items with correct styling', () => {
      // Arrange - Mock data with inactive item
      const fooWithInactive: Foo[] = [
        { ...mockFoos[0], status: 'inactive' }
      ];
      store.overrideSelector(selectFoos, fooWithInactive);
      store.refreshState();
      fixture.detectChanges();

      // Act
      const inactiveItem = fixture.debugElement.query(By.css('.item.inactive'));

      // Assert
      expect(inactiveItem).toBeTruthy();
      expect(inactiveItem.nativeElement.classList.contains('inactive')).toBe(true);
    });
  });
});
