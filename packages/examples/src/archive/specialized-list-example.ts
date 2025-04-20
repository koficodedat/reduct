/**
 * Example demonstrating optimizations for specific data types
 */

import { List } from '@reduct/data-structures';

console.log('Optimizations for Specific Data Types Example');
console.log('------------------------------------------');

// Numeric Data Optimizations
console.log('\n1. Numeric Data Optimizations:');
const numbers = List.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
console.log('Numbers:', numbers.toArray());

// Calculate sum manually
const sum = numbers.reduce((acc: number, val: number) => acc + val, 0);
console.log('Sum:', sum);

// Calculate average manually
const average = sum / numbers.size;
console.log('Average:', average);

// Calculate min manually
const min = Math.min(...numbers.toArray());
console.log('Min:', min);

// Calculate max manually
const max = Math.max(...numbers.toArray());
console.log('Max:', max);

// Map operation
console.log('Doubled:', numbers.map((x: number) => x * 2).toArray());

// Filter operation
console.log('Even numbers:', numbers.filter((x: number) => x % 2 === 0).toArray());

// String Data Optimizations
console.log('\n2. String Data Optimizations:');
const fruits = List.from(['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape']);
console.log('Fruits:', fruits.toArray());

// Join operation
console.log('Joined:', fruits.toArray().join(', '));

// Custom string operations
console.log('Contains "a":', fruits.filter((s: string) => s.includes('a')).toArray());
console.log('Starts with "b":', fruits.filter((s: string) => s.startsWith('b')).toArray());
console.log('Ends with "e":', fruits.filter((s: string) => s.endsWith('e')).toArray());
console.log('Uppercase:', fruits.map((s: string) => s.toUpperCase()).toArray());
console.log('Length > 5:', fruits.filter((s: string) => s.length > 5).toArray());

// Object Data Optimizations
console.log('\n3. Object Data Optimizations:');
interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
}

const people = List.from<Person>([
  { id: 1, name: 'Alice', age: 30, city: 'New York' },
  { id: 2, name: 'Bob', age: 25, city: 'Boston' },
  { id: 3, name: 'Charlie', age: 35, city: 'Chicago' },
  { id: 4, name: 'David', age: 25, city: 'Denver' },
  { id: 5, name: 'Eve', age: 30, city: 'New York' }
]);

console.log('People:', people.toArray());

// Extract property values
const names = people.map((p: Person) => p.name);
console.log('Names:', names.toArray());

// Filter by property
const age25 = people.filter((p: Person) => p.age === 25);
console.log('Age 25:', age25.toArray());

const fromNY = people.filter((p: Person) => p.city === 'New York');
console.log('From New York:', fromNY.toArray());

// Group by age
const groupedByAge = people.reduce((groups: Record<number, Person[]>, person: Person) => {
  const age = person.age;
  if (!groups[age]) {
    groups[age] = [];
  }
  groups[age].push(person);
  return groups;
}, {});

console.log('\nGrouped by age:');
Object.entries(groupedByAge).forEach(([age, group]: [string, Person[]]) => {
  console.log(`Age ${age}:`, group.map(p => p.name));
});

// Group by city
const groupedByCity = people.reduce((groups: Record<string, Person[]>, person: Person) => {
  const city = person.city;
  if (!groups[city]) {
    groups[city] = [];
  }
  groups[city].push(person);
  return groups;
}, {});

console.log('\nGrouped by city:');
Object.entries(groupedByCity).forEach(([city, group]: [string, Person[]]) => {
  console.log(`${city}:`, group.map(p => p.name));
});

// Unique cities
const cities = people.map((p: Person) => p.city);
const uniqueCities = Array.from(new Set(cities.toArray()));
console.log('\nUnique cities:', uniqueCities);

// Performance benefits
console.log('\n4. Performance Benefits of Type-Specific Optimizations:');
console.log('- Typed arrays for numeric data (Float64Array, Int32Array)');
console.log('- String-specific methods (startsWith, endsWith, includes)');
console.log('- Object property access optimizations');
console.log('- Memory layout optimizations for homogeneous data');
console.log('- JIT compiler optimizations for type-stable code');
console.log('- Reduced boxing/unboxing of primitive values');
console.log('- Cache-friendly memory access patterns');
