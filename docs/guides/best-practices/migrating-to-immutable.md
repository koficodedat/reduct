# Migrating from Mutable to Immutable Data Structures

## Introduction

Transitioning from mutable to immutable data structures can significantly improve code reliability and maintainability. This guide provides practical strategies for migrating existing JavaScript/TypeScript code to use Reduct's immutable data structures.

## Why Migrate to Immutable Data Structures?

### Benefits of Immutability

1. **Predictable State Management**: Immutable data can't be changed after creation, eliminating unexpected mutations
2. **Simplified Debugging**: Easier to track when and where data changes
3. **Concurrency Safety**: No race conditions from shared mutable state
4. **Pure Functions**: Encourages pure functions that are easier to test and reason about
5. **Time-Travel Debugging**: Previous states are preserved, enabling powerful debugging techniques
6. **Performance Optimization**: Enables structural sharing and efficient change detection

## Incremental Migration Strategy

### Step 1: Identify Mutable Data Structures

Start by identifying the mutable data structures in your codebase:

```typescript
// Mutable array
const users = [];
users.push({ name: 'Alice', role: 'admin' });

// Mutable object
const config = {};
config.apiUrl = 'https://api.example.com';
config.timeout = 5000;
```

### Step 2: Replace with Immutable Equivalents

Replace mutable structures with their immutable equivalents:

```typescript
import { List, Map } from '@reduct/data-structures';

// Immutable list
let users = List.empty<User>();
users = users.append({ name: 'Alice', role: 'admin' });

// Immutable map
let config = Map.empty<string, any>();
config = config.set('apiUrl', 'https://api.example.com');
config = config.set('timeout', 5000);
```

### Step 3: Update Function Signatures

Update function signatures to reflect immutability:

```typescript
// Before
function addUser(users: User[], user: User): void {
  users.push(user); // Mutates the array
}

// After
function addUser(users: List<User>, user: User): List<User> {
  return users.append(user); // Returns a new list
}
```

### Step 4: Adapt Iteration Patterns

Update iteration patterns to work with immutable collections:

```typescript
// Before
for (let i = 0; i < users.length; i++) {
  processUser(users[i]);
}

// After
users.forEach(user => {
  processUser(user);
});

// Or using functional transformations
const processedUsers = users.map(processUser);
```

## Common Migration Patterns

### Arrays to Lists

```typescript
// Original mutable code
const numbers = [1, 2, 3, 4, 5];
numbers.push(6);
numbers[2] = 10;
numbers.splice(1, 2);

// Migrated immutable code
import { List } from '@reduct/data-structures';

let numbers = List.from([1, 2, 3, 4, 5]);
numbers = numbers.append(6);
numbers = numbers.set(2, 10);
numbers = numbers.delete(1, 2); // Remove 2 elements starting at index 1
```

### Objects to Maps

```typescript
// Original mutable code
const user = {
  name: 'Alice',
  role: 'admin'
};
user.email = 'alice@example.com';
delete user.role;

// Migrated immutable code
import { Map } from '@reduct/data-structures';

let user = Map.from([
  ['name', 'Alice'],
  ['role', 'admin']
]);
user = user.set('email', 'alice@example.com');
user = user.delete('role');
```

### Nested Data Structures

```typescript
// Original mutable code
const organization = {
  name: 'Acme Inc',
  departments: [
    { name: 'Engineering', employees: ['Alice', 'Bob'] },
    { name: 'Marketing', employees: ['Charlie', 'Diana'] }
  ]
};
organization.departments[0].employees.push('Eve');

// Migrated immutable code
import { Map, List } from '@reduct/data-structures';

let organization = Map.from([
  ['name', 'Acme Inc'],
  ['departments', List.from([
    Map.from([
      ['name', 'Engineering'],
      ['employees', List.from(['Alice', 'Bob'])]
    ]),
    Map.from([
      ['name', 'Marketing'],
      ['employees', List.from(['Charlie', 'Diana'])]
    ])
  ])]
]);

// Update nested structure
organization = organization.update(
  'departments',
  departments => departments.update(
    0,
    dept => dept.update(
      'employees',
      employees => employees.append('Eve')
    )
  )
);
```

### Batch Updates

```typescript
// Original mutable code
const users = [];
for (let i = 0; i < 1000; i++) {
  users.push({ id: i, name: `User ${i}` });
}

// Migrated immutable code - inefficient approach
let users = List.empty<User>();
for (let i = 0; i < 1000; i++) {
  users = users.append({ id: i, name: `User ${i}` });
}

// Better approach with batch updates
let users = List.empty<User>().withMutations(mutable => {
  for (let i = 0; i < 1000; i++) {
    mutable.append({ id: i, name: `User ${i}` });
  }
});
```

## Handling Common Challenges

### State Management Libraries

When using state management libraries:

```typescript
// Redux with mutable data (anti-pattern)
function reducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_USER':
      state.users.push(action.user); // Mutation! This is wrong in Redux
      return state;
    // ...
  }
}

// Redux with Reduct immutable data
import { List } from '@reduct/data-structures';

function reducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_USER':
      return {
        ...state,
        users: state.users.append(action.user)
      };
    // ...
  }
}
```

### Performance Considerations

Optimize performance when migrating:

```typescript
import { List } from '@reduct/data-structures';

// Inefficient: Creates many intermediate lists
let list = List.empty<number>();
for (let i = 0; i < 10000; i++) {
  list = list.append(i);
}

// Efficient: Uses batch operations
const list = List.empty<number>().withMutations(mutable => {
  for (let i = 0; i < 10000; i++) {
    mutable.append(i);
  }
});

// Alternative: Create from existing array
const array = Array.from({ length: 10000 }, (_, i) => i);
const list = List.from(array);
```

### Working with External Libraries

When interfacing with libraries expecting mutable data:

```typescript
import { List } from '@reduct/data-structures';

// Convert to mutable for external library
const immutableList = List.from([1, 2, 3]);
const mutableArray = immutableList.toArray();

externalLibrary.processArray(mutableArray);

// Convert back to immutable after external processing
const updatedList = List.from(mutableArray);
```

## Testing During Migration

### Write Tests for Immutable Behavior

```typescript
import { List } from '@reduct/data-structures';

describe('User Service', () => {
  it('should add user without mutating original list', () => {
    const originalList = List.from([{ name: 'Alice' }]);
    const newList = userService.addUser(originalList, { name: 'Bob' });

    // Original list should be unchanged
    expect(originalList.size).toBe(1);
    expect(originalList.get(0).name).toBe('Alice');

    // New list should have the added user
    expect(newList.size).toBe(2);
    expect(newList.get(1).name).toBe('Bob');
  });
});
```

### Verify Reference Equality

```typescript
import { List } from '@reduct/data-structures';

describe('Performance Optimization', () => {
  it('should reuse structure when nothing changes', () => {
    const list = List.from([1, 2, 3]);
    const sameList = list.filter(() => true);

    // Should be reference equal (same object)
    expect(list === sameList).toBe(true);
  });
});
```

## Gradual Migration Approach

### 1. Start with Leaf Components

Begin migration with leaf components or isolated modules:

```typescript
// Before migration
function processOrders(orders) {
  return orders.filter(order => order.status === 'completed');
}

// After migration
import { List } from '@reduct/data-structures';

function processOrders(orders: List<Order> | Order[]): List<Order> {
  // Handle both types during migration
  const immutableOrders = Array.isArray(orders) ? List.from(orders) : orders;
  return immutableOrders.filter(order => order.status === 'completed');
}
```

### 2. Use Type Definitions for Safety

Leverage TypeScript to ensure immutability:

```typescript
import { List, Map } from '@reduct/data-structures';

// Define immutable state types
interface AppState {
  users: List<User>;
  config: Map<string, any>;
  currentUser: User | null;
}

// This won't compile if you try to mutate the state
function processState(state: AppState): AppState {
  // state.users.push(newUser); // Error: push does not exist on type List<User>
  return {
    ...state,
    users: state.users.append(newUser)
  };
}
```

### 3. Create Boundary Adapters

Create adapters at system boundaries:

```typescript
// Adapter for external API
function fetchAndProcessUsers() {
  return fetch('/api/users')
    .then(response => response.json())
    .then(users => List.from(users)) // Convert to immutable
    .then(processUsers)
    .then(users => users.toArray()); // Convert back for external use
}
```

## Real-World Migration Examples

### Example 1: Form State Management

```typescript
// Before: Mutable form state
class UserForm {
  private formData = {
    name: '',
    email: '',
    preferences: []
  };

  updateField(field, value) {
    this.formData[field] = value;
    this.render();
  }

  addPreference(preference) {
    this.formData.preferences.push(preference);
    this.render();
  }
}

// After: Immutable form state
import { Map, List } from '@reduct/data-structures';

class UserForm {
  private formData = Map.from([
    ['name', ''],
    ['email', ''],
    ['preferences', List.empty<string>()]
  ]);

  updateField(field, value) {
    this.formData = this.formData.set(field, value);
    this.render();
  }

  addPreference(preference) {
    this.formData = this.formData.update(
      'preferences',
      preferences => preferences.append(preference)
    );
    this.render();
  }
}
```

### Example 2: Data Processing Pipeline

```typescript
// Before: Mutable data processing
function processData(data) {
  // Filter invalid entries
  const filtered = data.filter(item => item.value > 0);

  // Sort by priority
  filtered.sort((a, b) => b.priority - a.priority);

  // Extract and transform values
  const values = filtered.map(item => item.value * 2);

  return values;
}

// After: Immutable data processing
import { List } from '@reduct/data-structures';

function processData(data) {
  return List.from(data)
    .filter(item => item.value > 0)
    .sortBy(item => -item.priority) // Sort descending by priority
    .map(item => item.value * 2)
    .toArray();
}
```

## Conclusion

Migrating from mutable to immutable data structures is a journey that can be approached incrementally. By following the patterns and strategies in this guide, you can gradually transform your codebase to leverage the benefits of immutability while maintaining performance and compatibility with existing code.

Remember that Reduct's hybrid implementation strategy provides excellent performance for both small and large collections, making it practical to use immutable data structures throughout your application.

For more information on optimizing performance with immutable data structures, see the [Performance Guarantees](../performance/performance-guarantees.md), [Hybrid Implementations](../performance/hybrid-implementations.md), and [Understanding Performance Tradeoffs](../performance/understanding-performance-tradeoffs.md) guides.
