import { generateCSV } from '../services/reportService';

describe('Report Service', () => {
  describe('generateCSV', () => {
    it('should generate empty string for empty data', () => {
      expect(generateCSV([])).toBe('');
    });

    it('should generate csv format correctly', () => {
      const data = [
        { name: 'John Doe', age: 30, city: 'New York' },
        { name: 'Jane Smith', age: 25, city: 'Los Angeles' }
      ];
      
      const csv = generateCSV(data);
      const lines = csv.split('\n');
      
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('name,age,city');
      expect(lines[1]).toBe('John Doe,30,New York');
      expect(lines[2]).toBe('Jane Smith,25,Los Angeles');
    });

    it('should handle strings with commas', () => {
      const data = [
        { title: 'Hello, World', amount: 100 }
      ];
      const csv = generateCSV(data);
      const lines = csv.split('\n');
      
      expect(lines[1]).toBe('"Hello, World",100');
    });
  });
});
